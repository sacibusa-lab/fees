<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Fee;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Session;
use Illuminate\Support\Facades\DB;

$institutionId = 1;
$student = Student::where('institution_id', $institutionId)->first();
$fee = Fee::where('institution_id', $institutionId)->first();

if (!$student || !$fee) {
    echo "Required data not found.\n";
    exit;
}

$paidAt = now();
echo "Testing splits with Fee Deductions at: {$paidAt}\n";

DB::beginTransaction();

try {
    // 1. Create a MANUAL transaction (No deductions)
    $manualTx = Transaction::create([
        'institution_id' => $institutionId,
        'student_id' => $student->id,
        'fee_id' => $fee->id,
        'reference' => 'TEST-MAN-' . time(),
        'amount' => 50000,
        'status' => 'success',
        'channel' => 'manual',
        'paid_at' => $paidAt
    ]);

    // 2. Create an ONLINE transaction (Should have deductions)
    $onlineTx = Transaction::create([
        'institution_id' => $institutionId,
        'student_id' => $student->id,
        'fee_id' => $fee->id,
        'reference' => 'TEST-ONL-' . time(),
        'amount' => 50000, 
        'status' => 'success',
        'channel' => 'paystack',
        'paid_at' => $paidAt
    ]);

    $date = $paidAt->format('Y-m-d');
    
    // We'll call the logic from SettlementController (the one we just modified)
    $transactions = Transaction::whereDate('paid_at', $date)->where('status', 'success')->get();

    echo "Count of transactions for {$date}: " . $transactions->count() . "\n";

    foreach ($transactions as $tx) {
        $txAmount = (float)$tx->amount;
        $totalFeesForTx = 0;
        if ($tx->channel !== 'manual') {
            $paystackFee = min($txAmount * 0.01, 300);
            $itFee = 100;
            $totalFeesForTx = $paystackFee + $itFee;
        }

        echo "Tx Channel: {$tx->channel} | Total Paid: {$txAmount} | Fees: {$totalFeesForTx}\n";
        
        $bens = App\Models\FeeBeneficiary::where('fee_id', $tx->fee_id)->get();
        if ($bens->isEmpty()) {
            echo "  Warning: No beneficiaries for Fee ID: {$tx->fee_id}\n";
        } else {
            $lesserBen = $bens->sortBy('amount')->first();
            $totalBenAmount = $bens->sum('amount');
            $isPartial = $txAmount < $totalBenAmount;

            foreach ($bens as $ben) {
                if ($isPartial) {
                    $grossShare = $totalBenAmount > 0 
                        ? ($ben->amount / $totalBenAmount) * $txAmount 
                        : 0;
                } else {
                    $grossShare = (float)$ben->amount;
                }

                if ($ben->id === $lesserBen->id) {
                    $netShare = max(0, $grossShare - $totalFeesForTx);
                } else {
                    $netShare = $grossShare;
                }
                echo "  -> Ben: {$ben->account_name} (Fixed: {$ben->amount}) | Gross: {$grossShare} | Net: {$netShare}\n";
            }
        }
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
} finally {
    DB::rollBack();
    echo "Test entries rolled back.\n";
}
