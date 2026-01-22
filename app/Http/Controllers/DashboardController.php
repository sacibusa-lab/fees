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
        
        // 1. Get Current Session and Term
        $currentSession = \App\Models\Session::where('institution_id', $institutionId)
            ->where('is_current', true)
            ->first();

        // Fallback if no session is set
        $sessionName = $currentSession ? $currentSession->name : 'N/A';
        $currentTerm = $currentSession ? $currentSession->current_term : 'N/A'; 
        // Normalize term for fee calculations
        $termKey = 'first_term_amount'; // default
        if ($currentTerm) {
            $t = strtolower($currentTerm);
            if (str_contains($t, 'second') || str_contains($t, '2nd')) $termKey = 'second_term_amount';
            if (str_contains($t, 'third') || str_contains($t, '3rd')) $termKey = 'third_term_amount';
        }

        // 2. Calculate Expected Revenue for Current Term
        // Strategy: Iterate over all active fees for this session, count students in that class, multiply.
        $expectedRevenue = 0;
        
        // Get all fees for current session
        $fees = Fee::where('institution_id', $institutionId)
            ->where('session_id', $currentSession?->id)
            ->get();

        foreach ($fees as $fee) {
            // Get amount for current term
            $amount = $fee->$termKey ?? $fee->amount; 
            
            // If fee is 0 or null for this term, skip
            if (!$amount || $amount <= 0) continue;

            // Count eligible students
            // If fee has specific class_id, count students in that class.
            // If fee is global (class_id null), count all students.
            $studentQuery = Student::where('institution_id', $institutionId)
                ->where('payment_status', '!=', 'inactive'); // assuming inactive students don't pay

            if ($fee->class_id) {
                $studentQuery->where('class_id', $fee->class_id);
            }

            $count = $studentQuery->count();
            $expectedRevenue += ($count * $amount);
        }
        
        // 3. Calculate Generated Revenue (Live Transactions)
        // We sum all successful transactions for this institution within the current session context.
        // ideally, transactions should be linked to session. If not, we might filter by date range of session
        // For now, let's assume all transactions in DB are relevant or filter by created_at if session has dates.
        // Simplest: Sum all successful transactions for now, or filter by session relationship if it exists.
        // Based on models, Transaction has no direct session_id, but Fee does. 
        // Let's filter transactions where the related Fee belongs to current session.
        
        $generatedRevenue = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->whereHas('fee', function($q) use ($currentSession) {
                if ($currentSession) {
                     $q->where('session_id', $currentSession->id);
                }
            })
            ->sum('amount');

        // 4. Calculate Outstanding
        $outstandingRevenue = max(0, $expectedRevenue - $generatedRevenue);
        
        // 5. Calculate Fee Collection Progress (Live from Revenue)
        $collectionProgress = 0;
        if ($expectedRevenue > 0) {
            $collectionProgress = round(($generatedRevenue / $expectedRevenue) * 100);
            // Cap at 100% for display
            if ($collectionProgress > 100) $collectionProgress = 100;
        }

        // 6. Chart Data: Breakdown by Class (Paid vs Outstanding)
        // This is complex. We need to group expected vs paid by class.
        // Simplified approach: Get all classes, calculate expected for each. 
        // Then sum payments for students in that class.
        
        $classes = \App\Models\SchoolClass::where('institution_id', $institutionId)->get();
        $chartData = [];

        foreach ($classes as $schoolClass) {
            // Expected for this class
            $classExpected = 0;
            // Get fees for this class (specific + global)
            // Note: Global fees apply to all, so we include them.
            // Optimization: This loop N+1 is heavy, but fine for < 20 classes.
            
            $studentCountInClass = $schoolClass->students()->count();
            if ($studentCountInClass == 0) continue; // Skip empty classes

            // Sum applicable fees
            foreach ($fees as $fee) {
                if (!$fee->class_id || $fee->class_id == $schoolClass->id) {
                     $amt = $fee->$termKey ?? $fee->amount;
                     if ($amt > 0) $classExpected += ($amt * $studentCountInClass);
                }
            }

            // Generated for this class
            // Sum transactions where student belongs to this class
            $classGenerated = Transaction::where('institution_id', $institutionId)
                ->where('status', 'success')
                ->whereHas('student', function($q) use ($schoolClass) {
                    $q->where('class_id', $schoolClass->id);
                })
                 ->whereHas('fee', function($q) use ($currentSession) {
                    if ($currentSession) {
                         $q->where('session_id', $currentSession->id);
                    }
                })
                ->sum('amount');

            $chartData[] = [
                'name' => $schoolClass->name,
                'paid' => $classGenerated,
                'outstanding' => max(0, $classExpected - $classGenerated)
            ];
        }

        // Sort by name for consistency
        usort($chartData, function($a, $b) { return strcmp($a['name'], $b['name']); });


        $stats = [
            'collection_progress' => $collectionProgress,
            'current_term' => $currentTerm ?: 'N/A',
            'session' => $sessionName,
            'revenue' => [
                'expected' => $expectedRevenue,
                'generated' => $generatedRevenue,
                'outstanding' => $outstandingRevenue, // Added explicitly
                'currency' => 'NGN'
            ],
            'total_students' => Student::where('institution_id', $institutionId)->count(),
            'totalSchools' => \App\Models\Institution::count(), // Global admin stat? or just for this user? keeping as is.
            'adminAccounts' => \App\Models\User::where('institution_id', $institutionId)->count(),
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
                    'payment_method' => ucfirst($t->channel ?? 'Manual'), 
                    'amount' => $t->amount,
                    'status' => ucfirst($t->status),
                    'date' => $t->paid_at ? $t->paid_at->format('M d, Y h:i A') : $t->created_at->format('M d, Y h:i A'),
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'recentTransactions' => $recentTransactions,
            'userName' => auth()->user()->name
        ]);
    }
}
