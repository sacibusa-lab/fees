<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TermiiProvider implements SmsProviderInterface
{
    protected string $apiKey;
    protected string $senderId;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('sms.providers.termii.api_key');
        $this->senderId = config('sms.providers.termii.sender_id');
        $this->baseUrl = config('sms.providers.termii.url', 'https://api.termii.com/v1');
    }

    public function getName(): string
    {
        return 'termii';
    }

    public function setFrom(?string $from): void
    {
        if ($from !== null) {
            $this->senderId = $from;
        }
    }

    /**
     * Send SMS via Termii API
     */
    public function send(string $phone, string $message): array
    {
        // Ensure phone number is properly formatted
        $phone = $this->formatPhoneNumber($phone);

        try {
            $response = Http::timeout(15)->post($this->baseUrl . '/sms/send', [
                'api_key' => $this->apiKey,
                'to' => $phone,
                'from' => $this->senderId,
                'sms' => $message,
                'type' => 'plain',
                'channel' => 'generic',
            ]);

            $body = $response->json();

            if ($response->successful() && ($body['message'] ?? '') === 'Successfully Sent') {
                Log::info('SMS sent via Termii', [
                    'phone' => $phone,
                    'message_id' => $body['message_id'] ?? null,
                ]);

                return [
                    'status' => 'sent',
                    'response' => $body,
                ];
            }

            Log::warning('Termii SMS failed', [
                'phone' => $phone,
                'response' => $body,
                'http_status' => $response->status(),
            ]);

            return [
                'status' => 'failed',
                'response' => $body ?? $response->body(),
            ];
        } catch (\Exception $e) {
            Log::error('Termii SMS exception', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'failed',
                'response' => $e->getMessage(),
            ];
        }
    }

    /**
     * Format phone number to international format
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove any non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If it starts with 0, replace with 234 (Nigeria default)
        if (strlen($phone) === 11 && substr($phone, 0, 1) === '0') {
            $phone = '234' . substr($phone, 1);
        }

        // If it doesn't have a country code, prepend 234
        if (strlen($phone) === 10) {
            $phone = '234' . $phone;
        }

        return $phone;
    }
}
