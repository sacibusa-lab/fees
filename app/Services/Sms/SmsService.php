<?php

namespace App\Services\Sms;

use App\Models\SmsLog;
use App\Models\SmsTemplate;
use App\Models\ClassSmsSetting;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected SmsProviderInterface $provider;

    public function __construct(SmsProviderInterface $provider)
    {
        $this->provider = $provider;
    }

    /**
     * Get the current provider
     */
    public function getProvider(): SmsProviderInterface
    {
        return $this->provider;
    }

    /**
     * Send a raw SMS message
     */
    public function send(string $phone, string $message, ?int $institutionId = null, ?int $studentId = null, ?int $templateId = null): bool
    {
        if (!config('sms.enabled', false)) {
            Log::info('SMS disabled, skipping send', ['phone' => $phone]);
            return false;
        }

        // Resolve sender ID from institution settings (DB) if available
        if ($institutionId) {
            $institution = \App\Models\Institution::find($institutionId);
            if ($institution) {
                $settings = $institution->settings ?? [];
                $providerName = $this->provider->getName();
                $senderKey = $providerName === 'africastalking' ? 'at_from' : 'termii_sender_id';
                if (array_key_exists($senderKey, $settings)) {
                    $this->provider->setFrom($settings[$senderKey]);
                }
            }
        }

        $result = $this->provider->send($phone, $message);

        SmsLog::create([
            'institution_id' => $institutionId,
            'student_id' => $studentId,
            'sms_template_id' => $templateId,
            'phone' => $phone,
            'message' => $message,
            'status' => $result['status'],
            'provider_response' => json_encode($result['response']),
            'provider' => $this->provider->getName(),
        ]);

        return $result['status'] === 'sent';
    }

    /**
     * Send an SMS using a named template
     */
    public function sendFromTemplate(
        string $templateName,
        string $phone,
        array $data,
        int $institutionId,
        ?int $studentId = null
    ): bool {
        $template = SmsTemplate::where('institution_id', $institutionId)
            ->where('name', $templateName)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            Log::warning('SMS template not found or inactive', [
                'template' => $templateName,
                'institution_id' => $institutionId,
            ]);
            return false;
        }

        $message = $template->parse($data);

        return $this->send($phone, $message, $institutionId, $studentId, $template->id);
    }

    /**
     * Send payment receipt SMS to a student
     */
    public function sendPaymentReceipt(
        int $institutionId,
        int $studentId,
        string $phone,
        string $studentName,
        string $feeTitle,
        float $amountPaid,
        float $totalFee,
        string $term
    ): bool {
        $balance = max(0, $totalFee - $amountPaid);
        $isFullPayment = $balance <= 0;

        $data = [
            'name' => $studentName,
            'fee' => $feeTitle,
            'amount' => number_format($amountPaid, 2),
            'total' => number_format($totalFee, 2),
            'balance' => number_format($balance, 2),
            'term' => $term,
            'status' => $isFullPayment ? 'Full Payment' : 'Partial Payment',
        ];

        return $this->sendFromTemplate('payment_receipt', $phone, $data, $institutionId, $studentId);
    }

    /**
     * Send payment reminder SMS
     */
    public function sendPaymentReminder(
        int $institutionId,
        int $studentId,
        string $phone,
        string $studentName,
        string $guardianName,
        float $amountDue,
        string $feeTitle,
        string $term,
        string $dueDate
    ): bool {
        $data = [
            'name' => $studentName,
            'guardian' => $guardianName,
            'fee' => $feeTitle,
            'amount' => number_format($amountDue, 2),
            'term' => $term,
            'due_date' => $dueDate,
        ];

        return $this->sendFromTemplate('payment_reminder', $phone, $data, $institutionId, $studentId);
    }

    /**
     * Check if SMS is enabled for a student's class
     */
    public function isEnabledForStudent($student): bool
    {
        return ClassSmsSetting::isEnabledFor(
            $student->institution_id,
            $student->class_id,
            $student->sub_class_id
        );
    }
}
