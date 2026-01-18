<?php

namespace App\Http\Controllers;

use App\Models\PaymentSummary;
use App\Models\Student;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        $stats = [
            'totalReceived' => PaymentSummary::where('institution_id', $institutionId)->sum('total_received'),
            'expected' => PaymentSummary::where('institution_id', $institutionId)->sum('expected'),
            'defaulters' => Student::where('institution_id', $institutionId)->where('payment_status', 'pending')->count(),
            'revenueCodes' => 12, // Mock for now
        ];

        // Mock chart data for now
        $chartData = [
            ['name' => 'Mon', 'amount' => 450000],
            ['name' => 'Tue', 'amount' => 520000],
            ['name' => 'Wed', 'amount' => 480000],
            ['name' => 'Thu', 'amount' => 610000],
            ['name' => 'Fri', 'amount' => 550000],
            ['name' => 'Sat', 'amount' => 420000],
            ['name' => 'Sun', 'amount' => 380000],
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData
        ]);
    }
}
