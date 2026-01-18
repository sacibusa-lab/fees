<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;

class WebhookController extends Controller
{
    /**
     * Handle Paystack webhook notifications
     */
    public function paystack(Request $request)
    {
        // Verify the webhook signature
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
            'reference' => $data['reference'] ?? null
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
        $reference = $data['reference'];
        $amount = $data['amount'] / 100; // Paystack sends amount in kobo
        $status = $data['status'];

        // Update or create transaction
        Transaction::updateOrCreate(
            ['reference' => $reference],
            [
                'amount' => $amount,
                'status' => 'success',
                'payment_method' => 'paystack',
                'metadata' => json_encode($data),
                'paid_at' => now()
            ]
        );

        Log::info('Payment successful', ['reference' => $reference, 'amount' => $amount]);
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
