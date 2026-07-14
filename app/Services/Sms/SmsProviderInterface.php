<?php

namespace App\Services\Sms;

interface SmsProviderInterface
{
    /**
     * Send an SMS message
     *
     * @param string $phone The recipient phone number
     * @param string $message The message body
     * @return array ['status' => 'sent'|'failed', 'response' => mixed]
     */
    public function send(string $phone, string $message): array;

    /**
     * Get the provider name
     */
    public function getName(): string;

    /**
     * Set the sender ID (overrides default)
     */
    public function setFrom(?string $from): void;
}
