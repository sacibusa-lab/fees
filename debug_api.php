<?php

use Illuminate\Http\Request;
use App\Http\Controllers\PaymentController;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Fake request
$request = Request::create('/api/payments/verify', 'GET', ['query' => 'SAC/2020/0526']);

// Instantiate controller
$controller = app(PaymentController::class);

try {
    $response = $controller->verifyStatus($request);
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Content:\n";
    print_r($response->getData());
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
