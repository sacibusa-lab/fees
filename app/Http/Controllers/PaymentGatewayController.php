<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\WebhookEvent;
use App\Models\StudentVirtualAccount;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PaymentGatewayController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        // --- Transaction Stats ---
        $totalTransactions = Transaction::where('institution_id', $institutionId)->count();
        $successfulTx = Transaction::where('institution_id', $institutionId)->where('status', 'success')->count();
        $failedTx = Transaction::where('institution_id', $institutionId)->where('status', 'failed')->count();
        $pendingTx = Transaction::where('institution_id', $institutionId)->where('status', 'pending')->count();

        $onlineTx = Transaction::where('institution_id', $institutionId)->where('channel', '!=', 'manual')->count();
        $manualTx = Transaction::where('institution_id', $institutionId)->where('channel', 'manual')->count();

        $totalVolume = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->sum('amount');

        // --- Webhook Stats ---
        $totalWebhooks = WebhookEvent::count();
        $processedWebhooks = WebhookEvent::where('status', 'processed')->count();
        $failedWebhooks = WebhookEvent::where('status', 'failed')->count();
        $pendingWebhooks = WebhookEvent::where('status', 'pending')->count();

        // --- Recent webhook events ---
        $recentWebhooks = WebhookEvent::latest()
            ->take(20)
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
                    'event_type' => $w->event_type,
                    'reference' => $w->reference,
                    'status' => $w->status,
                    'error_message' => $w->error_message,
                    'processed_at' => $w->processed_at?->diffForHumans(),
                    'created_at' => $w->created_at->diffForHumans(),
                ];
            });

        // --- Recent transactions ---
        $recentTransactions = Transaction::where('institution_id', $institutionId)
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'reference' => $t->reference,
                    'amount' => (float)$t->amount,
                    'channel' => $t->channel ?? 'N/A',
                    'gateway' => $t->gateway ?? 'N/A',
                    'status' => $t->status,
                    'paid_at' => $t->paid_at?->diffForHumans(),
                    'created_at' => $t->created_at->diffForHumans(),
                ];
            });

        // --- DVA (Virtual Account) Stats ---
        $totalDva = StudentVirtualAccount::where('institution_id', $institutionId)->count();

        // --- Transaction trend (last 7 days) ---
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $daySuccess = Transaction::where('institution_id', $institutionId)
                ->where('status', 'success')
                ->whereDate('paid_at', $date)
                ->count();
            $dayFailed = Transaction::where('institution_id', $institutionId)
                ->where('status', 'failed')
                ->whereDate('created_at', $date)
                ->count();
            $trend[] = [
                'date' => $date->format('D'),
                'successful' => $daySuccess,
                'failed' => $dayFailed,
            ];
        }

        // --- Channel breakdown ---
        $channelBreakdown = Transaction::where('institution_id', $institutionId)
            ->selectRaw('COALESCE(NULLIF(channel, ""), "manual") as ch, COUNT(*) as total')
            ->groupBy('ch')
            ->pluck('total', 'ch')
            ->toArray();

        // --- Paystack balance (live check) ---
        $paystackBalance = $this->getPaystackBalance();

        // --- Paystack config status ---
        $paystackConfigured = !empty(config('services.paystack.public_key'))
            && !empty(config('services.paystack.secret_key'));

        return Inertia::render('PaymentGateway', [
            'stats' => [
                'total_transactions' => $totalTransactions,
                'successful' => $successfulTx,
                'failed' => $failedTx,
                'pending' => $pendingTx,
                'online' => $onlineTx,
                'manual' => $manualTx,
                'total_volume' => $totalVolume,
                'success_rate' => $totalTransactions > 0
                    ? round(($successfulTx / $totalTransactions) * 100, 1)
                    : 0,
            ],
            'webhookStats' => [
                'total' => $totalWebhooks,
                'processed' => $processedWebhooks,
                'failed' => $failedWebhooks,
                'pending' => $pendingWebhooks,
            ],
            'dvaStats' => [
                'total' => $totalDva,
            ],
            'trend' => $trend,
            'channelBreakdown' => $channelBreakdown,
            'paystackBalance' => $paystackBalance,
            'paystackConfigured' => $paystackConfigured,
            'recentWebhooks' => $recentWebhooks,
            'recentTransactions' => $recentTransactions,
        ]);
    }

    private function getPaystackBalance()
    {
        $secretKey = config('services.paystack.secret_key');
        if (!$secretKey) {
            return null;
        }

        try {
            $response = Http::withToken($secretKey)
                ->retry(2, 100)
                ->get('https://api.paystack.co/balance');

            if ($response->successful()) {
                $data = $response->json()['data'] ?? [];
                if (!empty($data)) {
                    return [
                        'currency' => $data[0]['currency'] ?? 'NGN',
                        'balance' => ($data[0]['balance'] ?? 0) / 100,
                        'pending' => ($data[0]['pending'] ?? 0) / 100,
                    ];
                }
            }
            return null;
        } catch (\Exception $e) {
            Log::error('Paystack balance check failed', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
