<?php

namespace App\Http\Controllers;

use App\Models\PaymentSummary;
use App\Models\Student;
use App\Models\Fee;
use App\Models\Transaction;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        // Calculate expected income based on active fees and student count
        $studentCount = Student::where('institution_id', $institutionId)->count();
        $totalFees = Fee::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->sum('amount');
        $expectedIncome = $totalFees * $studentCount;

        $stats = [
            'totalStudents' => $studentCount,
            'totalReceived' => PaymentSummary::where('institution_id', $institutionId)->sum('total_received'),
            'expected' => $expectedIncome,
            'defaulters' => Student::where('institution_id', $institutionId)->where('payment_status', 'pending')->count(),
            'revenueCodes' => Fee::where('institution_id', $institutionId)->distinct('revenue_code')->count('revenue_code'),
        ];

        // Fetch successful transactions for the current session
        $transactions = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->with(['fee'])
            ->get();

        $termData = [
            'first' => ['amount' => 0, 'count' => 0],
            'second' => ['amount' => 0, 'count' => 0],
            'third' => ['amount' => 0, 'count' => 0],
        ];

        foreach ($transactions as $transaction) {
            $fee = $transaction->fee;
            if (!$fee) continue;

            $title = strtolower($fee->title ?? '');
            
            if (str_contains($title, '1st') || str_contains($title, 'first')) {
                $termData['first']['amount'] += $transaction->amount;
                $termData['first']['count']++;
            } elseif (str_contains($title, '2nd') || str_contains($title, 'second')) {
                $termData['second']['amount'] += $transaction->amount;
                $termData['second']['count']++;
            } elseif (str_contains($title, '3rd') || str_contains($title, 'third')) {
                $termData['third']['amount'] += $transaction->amount;
                $termData['third']['count']++;
            }
        }

        $grossTotal = [
            'amount' => array_sum(array_column($termData, 'amount')),
            'count' => array_sum(array_column($termData, 'count')),
        ];

        $stats = [
            'totalStudents' => $studentCount,
            'totalReceived' => $grossTotal['amount'],
            'expected' => $expectedIncome,
            'defaulters' => Student::where('institution_id', $institutionId)->where('payment_status', 'pending')->count(),
            'revenueCodes' => Fee::where('institution_id', $institutionId)->distinct('revenue_code')->count('revenue_code'),
            'gross_transaction' => $grossTotal,
            'term_breakdown' => $termData,
        ];

        // Format chart data for Terms instead of Days
        $chartData = [
            ['name' => 'First Term', 'amount' => (float) $termData['first']['amount']],
            ['name' => 'Second Term', 'amount' => (float) $termData['second']['amount']],
            ['name' => 'Third Term', 'amount' => (float) $termData['third']['amount']],
        ];

        // Fetch recent successful transactions for the dashboard table
        $recentTransactions = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->with(['student', 'fee'])
            ->orderBy('paid_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'payer' => $t->student->name ?? 'External Payee',
                    'fee' => $t->fee->title ?? 'General Payment',
                    'payment_method' => ucfirst($t->payment_method),
                    'amount' => $t->amount,
                    'status' => ucfirst($t->status),
                    'date' => $t->paid_at->format('M d, Y h:i A'),
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'recentTransactions' => $recentTransactions
        ]);
    }
}
