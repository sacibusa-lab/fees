<?php

namespace App\Http\Controllers;

use App\Models\PaymentSummary;
use App\Models\Student;
use App\Models\Fee;
use App\Models\Transaction;
use App\Models\SchoolClass;
use App\Models\Session as AcademicSession;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;
        
        // 1. Get Current Session and Term
        $currentSession = AcademicSession::where('institution_id', $institutionId)
            ->where('is_current', true)
            ->first();

        $sessionName = $currentSession ? $currentSession->name : 'N/A';
        $currentTerm = $currentSession ? $currentSession->current_term : 'N/A'; 
        $termKey = 'first_term_amount';
        if ($currentTerm) {
            $t = strtolower($currentTerm);
            if (str_contains($t, 'second') || str_contains($t, '2nd')) $termKey = 'second_term_amount';
            if (str_contains($t, 'third') || str_contains($t, '3rd')) $termKey = 'third_term_amount';
        }

        $allFees = Fee::where('institution_id', $institutionId)
            ->where('session_id', $currentSession?->id)
            ->get();

        // 2. Expected Revenue
        $expectedRevenue = 0;
        foreach ($allFees as $fee) {
            $amount = $fee->$termKey ?? $fee->amount; 
            if (!$amount || $amount <= 0) continue;
            $studentQuery = Student::where('institution_id', $institutionId)
                ->where('payment_status', '!=', 'inactive');
            if ($fee->class_id) {
                $studentQuery->where('class_id', $fee->class_id);
            }
            $expectedRevenue += ($studentQuery->count() * $amount);
        }
        
        // 3. Generated Revenue (session-scoped)
        $generatedRevenue = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->whereHas('fee', function($q) use ($currentSession) {
                if ($currentSession) $q->where('session_id', $currentSession->id);
            })
            ->sum('amount');

        $outstandingRevenue = max(0, $expectedRevenue - $generatedRevenue);
        
        $collectionProgress = 0;
        if ($expectedRevenue > 0) {
            $collectionProgress = round(($generatedRevenue / $expectedRevenue) * 100);
            if ($collectionProgress > 100) $collectionProgress = 100;
        }

        // 4. Per-Class Breakdown (Paid vs Outstanding) with Progress %
        $classes = SchoolClass::where('institution_id', $institutionId)->get();
        $chartData = [];
        $classProgressData = [];

        foreach ($classes as $schoolClass) {
            $classExpected = 0;
            $studentCountInClass = $schoolClass->students()->count();
            if ($studentCountInClass == 0) continue;

            foreach ($allFees as $fee) {
                if (!$fee->class_id || $fee->class_id == $schoolClass->id) {
                     $amt = $fee->$termKey ?? $fee->amount;
                     if ($amt > 0) $classExpected += ($amt * $studentCountInClass);
                }
            }

            $classGenerated = Transaction::where('institution_id', $institutionId)
                ->where('status', 'success')
                ->whereHas('student', fn($q) => $q->where('class_id', $schoolClass->id))
                ->whereHas('fee', function($q) use ($currentSession) {
                    if ($currentSession) $q->where('session_id', $currentSession->id);
                })
                ->sum('amount');

            $chartData[] = [
                'name' => $schoolClass->name,
                'paid' => $classGenerated,
                'outstanding' => max(0, $classExpected - $classGenerated)
            ];

            $pct = $classExpected > 0 ? round(($classGenerated / $classExpected) * 100) : 0;
            $classProgressData[] = [
                'name' => $schoolClass->name,
                'expected' => $classExpected,
                'collected' => $classGenerated,
                'percentage' => min($pct, 100),
                'student_count' => $studentCountInClass,
            ];
        }
        usort($chartData, fn($a, $b) => strcmp($a['name'], $b['name']));
        usort($classProgressData, fn($a, $b) => strcmp($a['name'], $b['name']));

        // 5. Month-over-Month Collection Trends (last 12 months)
        $monthlyTrend = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->where('paid_at', '>=', Carbon::now()->subMonths(11)->startOfMonth())
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '%Y-%m') as month"),
                DB::raw('SUM(amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        // Fill in missing months with zeroes
        $monthlyTrendData = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->format('Y-m');
            $label = Carbon::now()->subMonths($i)->format('M');
            $entry = $monthlyTrend->get($month);
            $monthlyTrendData[] = [
                'month' => $label,
                'total' => (float)($entry->total ?? 0),
                'count' => (int)($entry->count ?? 0),
            ];
        }

        // 6. Top Defaulters (students with no transactions in current session / largest outstanding)
        $studentsWithPayment = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->whereHas('fee', fn($q) => $q->where('session_id', $currentSession?->id))
            ->distinct('student_id')
            ->pluck('student_id');

        $topDefaulters = Student::where('institution_id', $institutionId)
            ->where('payment_status', '!=', 'inactive')
            ->whereNotIn('id', $studentsWithPayment)
            ->with('schoolClass')
            ->limit(10)
            ->get()
            ->map(fn($s) => [
                'name' => $s->name,
                'class' => $s->schoolClass?->name ?? 'N/A',
                'admission_no' => $s->admission_number,
            ]);

        // 7. Fee Type Breakdown
        $feeBreakdown = Fee::where('institution_id', $institutionId)
            ->where('session_id', $currentSession?->id)
            ->where('status', 'active')
            ->withCount(['beneficiaries'])
            ->get()
            ->map(function ($fee) use ($termKey, $institutionId, $currentSession) {
                $amount = $fee->$termKey ?? $fee->amount;
                $collected = Transaction::where('institution_id', $institutionId)
                    ->where('status', 'success')
                    ->where('fee_id', $fee->id)
                    ->whereHas('fee', fn($q) => $q->where('session_id', $currentSession?->id))
                    ->sum('amount');
                return [
                    'title' => $fee->title,
                    'type' => $fee->type ?? 'tuition',
                    'amount' => (float)$amount,
                    'collected' => (float)$collected,
                    'beneficiaries_count' => $fee->beneficiaries_count,
                ];
            });

        // 8. Quick Stats: Today & This Week collections
        $todayCollection = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->whereDate('paid_at', Carbon::today())
            ->sum('amount');

        $weekCollection = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->whereBetween('paid_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->sum('amount');

        $todayCount = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->whereDate('paid_at', Carbon::today())
            ->count();

        // 9. Student stats
        $totalStudents = Student::where('institution_id', $institutionId)->count();
        $activeStudents = Student::where('institution_id', $institutionId)
            ->where('payment_status', '!=', 'inactive')
            ->count();

        $stats = [
            'collection_progress' => $collectionProgress,
            'current_term' => $currentTerm ?: 'N/A',
            'session' => $sessionName,
            'revenue' => [
                'expected' => $expectedRevenue,
                'generated' => $generatedRevenue,
                'outstanding' => $outstandingRevenue,
                'currency' => 'NGN'
            ],
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'today_collection' => (float)$todayCollection,
            'today_count' => $todayCount,
            'week_collection' => (float)$weekCollection,
        ];

        // Recent transactions
        $recentTransactions = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->with(['student', 'fee'])
            ->orderBy('paid_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'payer' => $t->student->name ?? 'External Payee',
                'fee' => $t->fee->title ?? 'General Payment',
                'payment_method' => ucfirst($t->channel ?? 'Manual'), 
                'amount' => $t->amount,
                'status' => ucfirst($t->status),
                'date' => $t->paid_at ? $t->paid_at->format('M d, Y h:i A') : $t->created_at->format('M d, Y h:i A'),
            ]);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'classProgressData' => $classProgressData,
            'monthlyTrendData' => $monthlyTrendData,
            'topDefaulters' => $topDefaulters,
            'feeBreakdown' => $feeBreakdown,
            'recentTransactions' => $recentTransactions,
            'userName' => auth()->user()->name
        ]);
    }
}
