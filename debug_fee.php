<?php

use App\Models\Transaction;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tx = Transaction::with('fee')->find(6);

if (!$tx) {
    echo "Transaction 6 not found.\n";
    exit;
}

echo "Transaction 6:\n";
echo "Fee Relationship: " . ($tx->fee ? "YES ({$tx->fee->title})" : "NO") . "\n";
echo "Metadata: " . json_encode($tx->metadata) . "\n";

$feesFromMeta = $tx->metadata['fees'] ?? null;
echo "Metadata Fees: " . json_encode($feesFromMeta) . " (Type: " . gettype($feesFromMeta) . ")\n";

$feeTitle = $tx->fee->title ?? ($feesFromMeta[0] ?? 'N/A');
echo "Calculated Fee Title: {$feeTitle}\n";
