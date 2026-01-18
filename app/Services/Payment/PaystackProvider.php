<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackProvider implements PaymentGatewayInterface
{
    protected $baseUrl;
    protected $secretKey;

    public function __construct()
    {
        $this->baseUrl = 'https://api.paystack.co';
        $this->secretKey = config('services.paystack.secret_key');
    }

    public function initiateTransaction(array $data): array
    {
        try {
            $formattedAmount = $data['amount'] * 100; // Paystack expects Kobo

            $response = Http::withToken($this->secretKey)->post("{$this->baseUrl}/transaction/initialize", [
                'email' => $data['email'],
                'amount' => $formattedAmount,
                'reference' => $data['reference'],
                'callback_url' => $data['callback_url'],
                'metadata' => $data['metadata'] ?? [],
                'channels' => ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                return [
                    'status' => true,
                    'checkout_url' => $responseData['data']['authorization_url'],
                    'message' => 'Transaction initialized'
                ];
            }

            Log::error('Paystack Initialization Error', ['response' => $response->body()]);
            return [
                'status' => false,
                'checkout_url' => null,
                'message' => $response->json()['message'] ?? 'Initialization failed'
            ];

        } catch (\Exception $e) {
            Log::error('Paystack Initialization Exception', ['error' => $e->getMessage()]);
            return [
                'status' => false,
                'checkout_url' => null,
                'message' => 'Service unavailable'
            ];
        }
    }

    public function verifyTransaction(string $reference): array
    {
        try {
            $response = Http::withToken($this->secretKey)->get("{$this->baseUrl}/transaction/verify/{$reference}");

            if ($response->successful()) {
                $responseData = $response->json();
                
                if ($responseData['data']['status'] === 'success') {
                    return [
                        'status' => true,
                        'data' => $responseData['data'],
                        'message' => 'Verification successful'
                    ];
                }

                return [
                    'status' => false,
                    'data' => $responseData['data'],
                    'message' => 'Transaction not successful'
                ];
            }

            return [
                'status' => false,
                'data' => [],
                'message' => 'Verification failed'
            ];

        } catch (\Exception $e) {
            Log::error('Paystack Verification Exception', ['error' => $e->getMessage()]);
            return [
                'status' => false,
                'data' => [],
                'message' => 'Service unavailable'
            ];
        }
    }

    public function getBanks(): array
    {
        try {
            // Using cache to avoid frequent API calls for static data
            return cache()->remember('paystack_banks', 86400, function () { // Cache for 24 hours
                $response = Http::withToken($this->secretKey)->get("{$this->baseUrl}/bank", [
                    'currency' => 'NGN'
                ]);

                if ($response->successful()) {
                    return $response->json()['data'] ?? [];
                }
                return [];
            });
        } catch (\Exception $e) {
            Log::error('Paystack Get Banks Exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    public function resolveAccountNumber(string $accountNumber, string $bankCode): array
    {
        try {
            $response = Http::withToken($this->secretKey)->get("{$this->baseUrl}/bank/resolve", [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode
            ]);

            if ($response->successful()) {
                return [
                    'status' => true,
                    'account_name' => $response->json()['data']['account_name'],
                    'account_number' => $response->json()['data']['account_number']
                ];
            }

            return [
                'status' => false,
                'message' => 'Could not resolve account details'
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => 'Service error: ' . $e->getMessage()
            ];
        }
    }

    public function createSubAccount(array $data): array
    {
        try {
            // Data should contain: business_name, settlement_bank (code), account_number, percentage_charge
            $response = Http::withToken($this->secretKey)->post("{$this->baseUrl}/subaccount", [
                'business_name' => $data['business_name'],
                'settlement_bank' => $data['settlement_bank'],
                'account_number' => $data['account_number'],
                'percentage_charge' => $data['percentage_charge'] ?? 0, // Default 0 for now
                'description' => $data['description'] ?? 'School Fee Subaccount'
            ]);

            if ($response->successful()) {
                return [
                    'status' => true,
                    'subaccount_code' => $response->json()['data']['subaccount_code'],
                    'data' => $response->json()['data']
                ];
            }

            Log::error('Paystack Subaccount Creation Failed', ['response' => $response->body()]);
            return [
                'status' => false,
                'message' => $response->json()['message'] ?? 'Failed to create subaccount'
            ];

        } catch (\Exception $e) {
            Log::error('Paystack Subaccount Exception', ['error' => $e->getMessage()]);
            return [
                'status' => false,
                'message' => 'Service error'
            ];
        }
    }
}
