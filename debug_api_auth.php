<?php

use Illuminate\Http\Request;
use App\Http\Controllers\PaymentController;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Mock Auth
$user = User::first();
auth()->login($user);

echo "Logged in as: " . $user->name . " (Inst ID: " . $user->institution_id . ")\n";

// Fake request
$request = Request::create('/api/payments/verify', 'GET', ['query' => 'SAC/2020/0526']);

// Instantiate controller
$controller = app(PaymentController::class);

try {
    $response = $controller->verifyStatus($request);
    echo "Response Status: " . $response->getStatusCode() . "\n";
    $data = $response->getData(true); // as array
    echo "Type: " . ($data['type'] ?? 'N/A') . "\n";
    echo "Student: " . ($data['student_name'] ?? 'N/A') . "\n";
    echo "Data Count: " . (isset($data['data']) ? count($data['data']) : 0) . "\n";
    print_r($data['data'] ?? []);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
