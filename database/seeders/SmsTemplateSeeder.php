<?php

namespace Database\Seeders;

use App\Models\SmsTemplate;
use Illuminate\Database\Seeder;

class SmsTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'payment_receipt',
                'label' => 'Payment Receipt',
                'message' => "Dear {name},\n\nYour {fee} payment of ₦{amount} for {term} has been received.\nStatus: {status}\nTotal Fee: ₦{total}\nAmount Paid: ₦{amount}\nBalance: ₦{balance}\n\nThank you.",
                'is_active' => true,
            ],
            [
                'name' => 'payment_reminder',
                'label' => 'Payment Reminder',
                'message' => "Dear {guardian},\n\nThis is a reminder that the {fee} of ₦{amount} for {term} for {name} is due.\n\nPlease make payment at your earliest convenience to avoid disruption.\n\nThank you.",
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            SmsTemplate::firstOrCreate(
                ['name' => $template['name'], 'institution_id' => 0],
                $template
            );
        }
    }
}
