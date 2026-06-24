<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Fee;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Session;
use App\Models\FeeBeneficiary;
use Illuminate\Support\Facades\DB;

$institutionId = 1;
$student = Student::where('institution_id', $institutionId)->first();
$fee = Fee::where('institution_id', $institutionId)->first();

if (!$student || !$fee) {
    echo "Required data not found.\n";
    exit;
}

// Ensure we have at least two beneficiaries with different percentages for the test
FeeBeneficiary::where('fee_id', $fee->id)->delete();
FeeBeneficiary::create([
    'fee_id' => $fee->id,
    'account_name' => 'MAJOR HOLDER (School)',
    'account_number' => '1111111111',
    'bank_name' => 'Kuda',
    'bank_code' => '000',
    'percentage' => 70.00
]);
FeeBeneficiary::create([
    'fee_id' => $fee->id,
    'account_name' => 'LESSER HOLDER (Diocese)',
    'account_number' => '2222222222',
    'bank_name' => 'Kuda',
    'bank_code' => '000',
    'percentage' => 30.00
]);

$paidAt = now();
echo "Testing 'Smallest Beneficiary Pays' Strategy at: {$paidAt}\n";

DB::beginTransaction();

try {
    // Test Amount: 10,000
    // Paystack Fee (1% of 10000) = 100
    // IT Fee = 100
    // Total Fees = 200
    
    // Manual Tx (No deductions)
    $manualTx = Transaction::create([
        'institution_id' => $institutionId,
        'student_id' => $student->id,
        'fee_id' => $fee->id,
        'reference' => 'TEST-MAN-' . time(),
        'amount' => 10000,
        'status' => 'success',
        'channel' => 'manual',
        'paid_at' => $paidAt
    ]);

    // Online Tx (Should deduct 200 from Lesser Holder)
    $onlineTx = Transaction::create([
        'institution_id' => $institutionId,
        'student_id' => $student->id,
        'fee_id' => $fee->id,
        'reference' => 'TEST-ONL-' . time(),
        'amount' => 10000, 
        'status' => 'success',
        'channel' => 'paystack',
        'paid_at' => $paidAt
    ]);

    $date = $paidAt->format('Y-m-d');
    $transactions = Transaction::whereDate('paid_at', $date)->where('status', 'success')->get();

    foreach ($transactions as $tx) {
        echo "------------------------------------------------\n";
        echo "Channel: {$tx->channel} | Amount: {$tx->amount}\n";
        
        $txAmount = (float)$tx->amount;
        $totalFees = 0;
        if ($tx->channel !== 'manual') {
            $paystackFee = min($txAmount * 0.01, 300);
            $itFee = 100;
            $totalFees = $paystackFee + $itFee;
        }
        echo "Total Fees to Deduct: {$totalFees}\n";

        $bens = FeeBeneficiary::where('fee_id', $tx->fee_id)->get();
        $lesserBen = $bens->sortBy('percentage')->first();
        
        foreach ($bens as $ben) {
            $grossShare = ($ben->percentage / 100) * $txAmount;
            $netShare = ($ben->id === $lesserBen->id) ? max(0, $grossShare - $totalFees) : $grossShare;
            
            echo "  NAME: {$ben->account_name} ({$ben->percentage}%)\n";
            echo "  GROSS: {$grossShare} | NET: {$netShare}\n";
        }
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
} finally {
    DB::rollBack();
    echo "Test entries rolled back.\n";
}
