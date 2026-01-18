<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;
use App\Models\StudentVirtualAccount;

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

        // Handle different event types
        switch ($event) {
            case 'charge.success':
                $this->handleChargeSuccess($data);
                break;
                
            case 'charge.failed':
                $this->handleChargeFailed($data);
                break;
                
            case 'transfer.success':
                $this->handleTransferSuccess($data);
                break;
                
            case 'transfer.failed':
                $this->handleTransferFailed($data);
                break;

            case 'dedicatedaccount.assign.success':
                Log::info('DVA Assigned successfully', ['data' => $data]);
                break;
                
            default:
                Log::info('Unhandled Paystack event: ' . $event);
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
    private function handleChargeSuccess($data)
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

        // Update or create transaction
        Transaction::updateOrCreate(
            ['reference' => $reference],
            [
                'institution_id' => $institutionId,
                'student_id' => $studentId,
                'amount' => $amount,
                'status' => 'success',
                'payment_method' => 'paystack',
                'metadata' => $data,
                'paid_at' => now()
            ]
        );

        if ($studentId) {
            \App\Models\Student::where('id', $studentId)->update(['payment_status' => 'paid']);
            Log::info("Student payment status updated to paid", ['student_id' => $studentId]);
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
    private function handleChargeFailed($data)
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
    private function handleTransferSuccess($data)
    {
        Log::info('Transfer successful', ['data' => $data]);
        // Implement transfer success logic here
    }

    /**
     * Handle failed transfer
     */
    private function handleTransferFailed($data)
    {
        Log::warning('Transfer failed', ['data' => $data]);
        // Implement transfer failure logic here
    }
}
