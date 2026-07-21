<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;
use App\Models\StudentVirtualAccount;
use App\Models\WebhookEvent;
use App\Models\Student;
use App\Models\Fee;
use App\Models\Session;
use App\Services\Sms\SmsService;

class WebhookController extends Controller
{
    /**
     * Handle Paystack webhook notifications
     */
    public function paystack(Request $request)
    {
        // ... (verify signature logic remains same)
        $signature = $request->header('x-paystack-signature');
        $body = $request->getContent();
        
        if (!$this->verifyPaystackSignature($signature, $body)) {
            Log::warning('Invalid Paystack webhook signature');
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        Log::info('Paystack Webhook Received', [
            'event' => $event,
            'reference' => $data['reference'] ?? null,
            'body' => $body,
            'headers' => $request->headers->all()
        ]);

        // Log the event to database for monitoring
        $webhookLog = WebhookEvent::create([
            'event_type' => $event,
            'reference' => $data['reference'] ?? null,
            'payload' => $data,
            'status' => 'pending'
        ]);

        try {
            // Handle different event types
            switch ($event) {
                case 'charge.success':
                    $this->handleChargeSuccess($data, $webhookLog);
                    break;
                    
                case 'charge.failed':
                    $this->handleChargeFailed($data, $webhookLog);
                    break;
                    
                case 'transfer.success':
                    $this->handleTransferSuccess($data, $webhookLog);
                    break;
                    
                case 'transfer.failed':
                    $this->handleTransferFailed($data, $webhookLog);
                    break;

                case 'dedicatedaccount.assign.success':
                    Log::info('DVA Assigned successfully', ['data' => $data]);
                    $webhookLog->update(['status' => 'processed', 'processed_at' => now()]);
                    break;
                    
                default:
                    Log::info('Unhandled Paystack event: ' . $event);
                    $webhookLog->update(['status' => 'processed', 'processed_at' => now()]);
            }
        } catch (\Exception $e) {
            Log::error('Error processing webhook', [
                'event' => $event,
                'error' => $e->getMessage()
            ]);
            $webhookLog->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
        }

        return response()->json(['message' => 'Webhook received'], 200);
    }

    /**
     * Verify Paystack webhook signature
     */
    private function verifyPaystackSignature($signature, $body)
    {
        $secret = config('services.paystack.secret_key');
        $hash = hash_hmac('sha512', $body, $secret);
        
        return hash_equals($hash, $signature);
    }

    /**
     * Handle successful charge
     */
    private function handleChargeSuccess($data, $webhookLog = null)
    {
        $reference = $data['reference'] ?? null;
        $amount = $data['amount'] / 100;
        $status = $data['status'];
        $customerCode = $data['customer']['customer_code'] ?? null;
        
        $studentId = null;
        $institutionId = null;

        // 1. Try to find student via Dedicated Virtual Account (DVA)
        if ($customerCode) {
            $va = StudentVirtualAccount::where('customer_code', $customerCode)->first();
            if ($va) {
                $studentId = $va->student_id;
                $institutionId = $va->institution_id;
            }
        }

        // 2. Fallback to reference lookup if not DVA or VA not found
        if (!$studentId && $reference) {
            $existingTransaction = Transaction::where('reference', $reference)->first();
            if ($existingTransaction) {
                $studentId = $existingTransaction->student_id;
                $institutionId = $existingTransaction->institution_id;
            }
        }

        if (!$institutionId) {
            Log::warning('Could not resolve institution for webhook', ['data' => $data]);
            return;
        }

        // 3. Determine which session/term this payment applies to
        // Since students use the same DVA across all terms, we apply payment
        // to the OLDEST outstanding balance first.
        $feeId = null;
        $session = null;
        $term = null;
        $student = $studentId ? \App\Models\Student::with('schoolClass')->find($studentId) : null;

        try {
            // Get all sessions ordered oldest first
            $allSessions = \App\Models\Session::where('institution_id', $institutionId)
                ->orderBy('id', 'asc')
                ->get();

            $allFees = \App\Models\Fee::where('institution_id', $institutionId)
                ->where('status', 'active')
                ->with('overrides')
                ->get();

            $termOrder = ['1st Term', '2nd Term', '3rd Term'];
            $remainingAmount = $amount;

            // Walk through sessions oldest-first, then terms
            foreach ($allSessions as $s) {
                foreach ($termOrder as $t) {
                    // Calculate how much this student owes for this session/term
                    $expectedForTerm = 0;
                    $matchedFeeForTerm = null;

                    foreach ($allFees as $fee) {
                        if ($fee->class_id && $student && $fee->class_id != $student->class_id) continue;
                        if (!$fee->isActiveForTerm($t)) continue;

                        $override = $fee->overrides->where('class_id', $student?->class_id)->first();
                        $feeAmount = ($override && $override->status === 'active')
                            ? (float)$override->amount
                            : (float)$fee->getAmountForTerm($t);

                        if ($feeAmount > 0) {
                            $expectedForTerm += $feeAmount;
                            $matchedFeeForTerm = $fee;
                        }
                    }

                    if ($expectedForTerm <= 0) continue;

                    // Check what's already been paid for this session/term
                    $alreadyPaid = (float)\App\Models\Transaction::where('institution_id', $institutionId)
                        ->where('student_id', $studentId)
                        ->where('status', 'success')
                        ->where('metadata->term', $t)
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.session_id')) = ?", [(string)$s->id])
                        ->sum('amount');

                    $outstanding = max(0, $expectedForTerm - $alreadyPaid);

                    if ($outstanding > 0 && $remainingAmount > 0) {
                        $applyAmount = min($remainingAmount, $outstanding);
                        $remainingAmount -= $applyAmount;

                        // This is the session/term this payment (or part of it) goes to
                        $session = $s;
                        $term = $t;
                        $feeId = $matchedFeeForTerm?->id;

                        // If the full amount was consumed, stop here
                        if ($remainingAmount <= 0) break 2;
                    }
                }
            }

            // If no outstanding balance found (overpayment), fallback to current session
            if (!$session) {
                $session = \App\Models\Session::where('institution_id', $institutionId)
                    ->where('is_current', true)
                    ->first();
                $term = $session->current_term ?? '1st Term';
            }
        } catch (\Exception $e) {
            Log::error('Error resolving session/term for transaction', ['error' => $e->getMessage()]);
            $session = \App\Models\Session::where('institution_id', $institutionId)
                ->where('is_current', true)
                ->first();
            $term = $session->current_term ?? '1st Term';
        }

        $metadata = $data;
        $metadata['session_id'] = $session->id;
        $metadata['term'] = $term;
        
        if ($feeId) {
            $feeObj = \App\Models\Fee::find($feeId);
            if ($feeObj) {
                $metadata['fees'] = [$feeObj->title];
            }
        }

        // Get the channel from the Paystack data
        $channel = $data['channel'] ?? 'bank_transfer';

        // Update or create transaction
        Transaction::updateOrCreate(
            ['reference' => $reference],
            [
                'institution_id' => $institutionId,
                'student_id' => $studentId,
                'fee_id' => $feeId,
                'amount' => $amount,
                'status' => 'success',
                'channel' => $channel,
                'gateway' => 'paystack',
                'metadata' => $metadata,
                'paid_at' => now()
            ]
        );

        if ($studentId) {
            Student::where('id', $studentId)->update(['payment_status' => 'paid']);
            Log::info("Student payment status updated to paid", ['student_id' => $studentId]);

            // Send SMS receipt if enabled
            try {
                $student = Student::with('schoolClass')->find($studentId);
                if ($student && config('sms.enabled', false)) {
                    $smsService = app(SmsService::class);

                    // Check if SMS is enabled for this student's class
                    if ($smsService->isEnabledForStudent($student)) {
                        $phone = $student->phone;

                        if (!empty($phone)) {
                            $feeTitle = 'School Fees';
                            $totalFee = $amount;

                            if (isset($feeId)) {
                                $feeObj = Fee::find($feeId);
                                if ($feeObj) {
                                    $feeTitle = $feeObj->title;
                                    $totalFee = $feeObj->getAmountForTerm($term ?? '1st Term');
                                }
                            }

                            $smsService->sendPaymentReceipt(
                                $institutionId,
                                $studentId,
                                $phone,
                                $student->name,
                                $feeTitle,
                                $amount,
                                $totalFee,
                                $term
                            );
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to send payment SMS receipt', [
                    'student_id' => $studentId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($institutionId && isset($webhookLog)) {
            $webhookLog->update([
                'institution_id' => $institutionId,
                'status' => 'processed',
                'processed_at' => now()
            ]);
        }

        Log::info('Payment successful and processed', [
            'reference' => $reference, 
            'student_id' => $studentId, 
            'institution_id' => $institutionId
        ]);
    }

    /**
     * Handle failed charge
     */
    private function handleChargeFailed($data, $webhookLog = null)
    {
        $reference = $data['reference'];

        Transaction::updateOrCreate(
            ['reference' => $reference],
            [
                'status' => 'failed',
                'metadata' => json_encode($data)
            ]
        );

        Log::warning('Payment failed', ['reference' => $reference]);
    }

    /**
     * Handle successful transfer (payout)
     */
    private function handleTransferSuccess($data, $webhookLog = null)
    {
        Log::info('Transfer successful', ['data' => $data]);
        // Implement transfer success logic here
    }

    /**
     * Handle failed transfer
     */
    private function handleTransferFailed($data, $webhookLog = null)
    {
        Log::warning('Transfer failed', ['data' => $data]);
        // Implement transfer failure logic here
    }
}
