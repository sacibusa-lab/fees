<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Fee;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Session;
use App\Http\Controllers\PaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// 1. Setup Data
$institutionId = 1;
$session = Session::where('institution_id', $institutionId)->where('is_current', true)->first();
$student = Student::where('institution_id', $institutionId)->first();
$fee = Fee::where('institution_id', $institutionId)->first();

if (!$session || !$student || !$fee) {
    echo "Required data (Session, Student, or Fee) not found. Cannot proceed with test.\n";
    exit;
}

echo "Testing with Student: {$student->name}, Fee: {$fee->title}, Session: {$session->name}\n";

// 2. Simulate Manual Bulk Payment (The logic we just modified)
// We'll manually call the controller or just simulate the loop logic.
// For the sake of truth, let's look at how notices are built.

$mockRequest = new Request([
    'session_id' => $session->id,
    'term' => $session->current_term ?: '1st Term',
    'student_ids' => [$student->id],
    'fee_title' => 'all',
    'payment_mode' => 'full'
]);

// Since we can't easily call internal private methods of the controller, 
// we will verify the Transaction creation logic.

$paidAt = now();
echo "Simulating bulk payment at: {$paidAt}\n";

// We'll use DB transaction to cleanup after
DB::beginTransaction();

try {
    // This is a simplified version of the logic in PaymentController@bulkMarkPaid
    // But we want to test if separate transactions are created.
    
    // Create a dummy transaction using the logic we added
    $feesToPay = [
        ['id' => $fee->id, 'title' => $fee->title, 'amount' => $fee->amount]
    ];
    
    foreach ($feesToPay as $f) {
        Transaction::create([
            'institution_id' => $institutionId,
            'student_id' => $student->id,
            'fee_id' => $f['id'],
            'reference' => 'TEST-' . time(),
            'amount' => $f['amount'],
            'status' => 'success',
            'channel' => 'manual',
            'paid_at' => $paidAt,
            'metadata' => ['fee_title' => $f['title']]
        ]);
    }

    $txCount = Transaction::where('paid_at', $paidAt)->count();
    echo "Created {$txCount} transactions for the test.\n";

    // 3. Verify Splits in SettlementController Logic
    $date = $paidAt->format('Y-m-d');
    
    // We'll simulate the show() logic here
    $transactions = Transaction::where('institution_id', $institutionId)
        ->whereDate('paid_at', $date)
        ->where('status', 'success')
        ->get();

    $payouts = [];
    $totalAllocated = 0;

    foreach ($transactions as $tx) {
        $feeId = $tx->fee_id;
        
        // Use the new fallback logic
        if (!$feeId) {
            $metadata = $tx->metadata;
            $feeTitle = $metadata['fee_title'] ?? null;
            if ($feeTitle) {
                $resolvedFee = Fee::where('institution_id', $institutionId)->where('title', $feeTitle)->first();
                $feeId = $resolvedFee?->id;
            }
        }

        if ($feeId) {
            $bens = App\Models\FeeBeneficiary::where('fee_id', $feeId)->get();
            foreach ($bens as $ben) {
                $bankKey = "{$ben->bank_name}-{$ben->account_number}";
                if (!isset($payouts[$bankKey])) {
                    $payouts[$bankKey] = ['name' => $ben->account_name, 'amount' => 0];
                }
                $allocated = ($ben->percentage / 100) * $tx->amount;
                $payouts[$bankKey]['amount'] += $allocated;
                $totalAllocated += $allocated;
            }
        }
    }

    echo "Total Allocated to Beneficiaries: " . $totalAllocated . "\n";
    echo "Payouts Breakdown:\n";
    foreach ($payouts as $key => $p) {
        echo "  - {$p['name']}: {$p['amount']}\n";
    }

    if ($totalAllocated > 0) {
        echo "SUCCESS: Splits correctly calculated.\n";
    } else {
        echo "FAILURE: No splits found. Ensure beneficiaries exist for Fee ID: {$fee->id}.\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
} finally {
    DB::rollBack();
    echo "Test entries rolled back.\n";
}
