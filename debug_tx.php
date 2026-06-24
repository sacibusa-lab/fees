<?php

use App\Models\Student;
use App\Models\Session;
use App\Models\Transaction;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$student = Student::where('admission_number', 'SAC/2020/0526')->first();

if (!$student) {
    echo "Student SAC/2020/0526 not found.\n";
    exit;
}

echo "Found Student: {$student->name} (ID: {$student->id})\n";
echo "Institution ID: {$student->institution_id}\n";

$currentSession = Session::where('institution_id', $student->institution_id)
    ->where('is_current', true)
    ->first();

if ($currentSession) {
    echo "Current Session: {$currentSession->name} (ID: {$currentSession->id})\n";
} else {
    echo "NO CURRENT SESSION FOUND!\n";
}

$transactions = Transaction::where('student_id', $student->id)->get();

echo "Found " . $transactions->count() . " transactions:\n";

foreach ($transactions as $tx) {
    $metaSession = $tx->metadata['session_id'] ?? 'NULL';
    $metaTerm = $tx->metadata['term'] ?? 'NULL';
    
    echo "------------------------------------------------\n";
    echo "ID: {$tx->id}\n";
    echo "Ref: {$tx->reference}\n";
    echo "Status: {$tx->status}\n";
    echo "Amount: {$tx->amount}\n";
    echo "Meta Session ID: {$metaSession} (Type: " . gettype($metaSession) . ")\n";
    echo "Meta Term: {$metaTerm}\n";
    
    if ($currentSession) {
        $matchId = $metaSession == $currentSession->id;
        $matchStr = (string)$metaSession === (string)$currentSession->id;
        echo "Matches Current Session? " . ($matchId ? 'YES' : 'NO') . " (String match: " . ($matchStr ? 'YES' : 'NO') . ")\n";
    }
}
