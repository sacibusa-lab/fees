<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Fee;
use App\Models\Session;
use App\Models\SchoolClass;
use App\Models\StudentAdjustment;
use Illuminate\Support\Facades\DB;

class InstallmentController extends Controller
{
    public function index(Request $request)
    {
        $institutionId = auth()->user()->institution_id;

        $sessionId = $request->query('session_id');
        $term = $request->query('term');
        $classId = $request->query('class_id');
        $search = $request->query('search');
        $studentId = $request->query('student_id');

        $sessions = Session::where('institution_id', $institutionId)
            ->orderBy('is_current', 'desc')->orderBy('name', 'desc')
            ->get(['id', 'name', 'is_current']);

        $classes = SchoolClass::where('institution_id', $institutionId)
            ->orderBy('name')->get(['id', 'name']);

        if (!$sessionId && $sessions->isNotEmpty()) {
            $current = $sessions->firstWhere('is_current', true) ?? $sessions->first();
            $sessionId = $current->id;
        }
        if (!$term) $term = '1st Term';

        $studentDetail = null;
        $installments = [];

        if ($studentId) {
            $student = Student::with('schoolClass')
                ->where('institution_id', $institutionId)
                ->find($studentId);

            if ($student) {
                $studentDetail = [
                    'id' => $student->id,
                    'name' => $student->name,
                    'admission_number' => $student->admission_number,
                    'class_name' => $student->schoolClass->name ?? 'N/A',
                    'guardian_name' => $student->guardian_name ?? 'N/A',
                    'guardian_phone' => $student->guardian_phone ?? '',
                ];

                $installments = $this->getStudentInstallments($institutionId, $student, $sessionId, $term);
            }
        }

        // For the student search dropdown
        $studentsQuery = Student::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->with('schoolClass');

        if ($classId) $studentsQuery->where('class_id', $classId);
        if ($search) {
            $studentsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('admission_number', 'like', "%{$search}%");
            });
        }

        $studentList = $studentsQuery->orderBy('name')
            ->take(50)->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'admission_number' => $s->admission_number,
                'class_name' => $s->schoolClass->name ?? 'N/A',
            ]);

        return Inertia::render('InstallmentTracker', [
            'sessions' => $sessions,
            'classes' => $classes,
            'studentList' => $studentList,
            'studentDetail' => $studentDetail,
            'installments' => $installments,
            'filters' => [
                'session_id' => $sessionId,
                'term' => $term,
                'class_id' => $classId,
                'search' => $search,
                'student_id' => $studentId,
            ],
        ]);
    }

    private function getStudentInstallments($institutionId, $student, $sessionId, $term)
    {
        // Get fees for this student's session/class
        $session = Session::find($sessionId);
        if (!$session) return [];

        $fees = Fee::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->where(function ($q) use ($sessionId) {
                $q->where('session_id', $sessionId)->orWhereNull('session_id');
            })
            ->with('overrides')
            ->get();

        // Fallback to previous session fees
        if ($fees->isEmpty()) {
            $prevSession = Session::where('institution_id', $institutionId)
                ->where('id', '<', $sessionId)->orderBy('id', 'desc')->first();
            if ($prevSession) {
                $fees = Fee::where('institution_id', $institutionId)
                    ->where('session_id', $prevSession->id)->where('status', 'active')
                    ->with('overrides')->get();
            }
        }

        $result = [];

        foreach ($fees as $fee) {
            // Skip class-specific fees that don't match
            if ($fee->class_id && $fee->class_id != $student->class_id) continue;
            if (!$fee->isActiveForTerm($term)) continue;

            // Get the fee amount for this student's class
            $override = $fee->overrides->where('class_id', $student->class_id)->first();
            $feeAmount = ($override && $override->status === 'active')
                ? (float)$override->amount
                : (float)$fee->getAmountForTerm($term);

            if ($feeAmount <= 0) continue;

            // Get all transactions (installments) for this student + fee
            $txQuery = Transaction::where('institution_id', $institutionId)
                ->where('student_id', $student->id)
                ->where('status', 'success')
                ->where('metadata->term', $term)
                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.session_id')) = ?", [(string)$sessionId]);

            // Match transactions to this fee: check fee_id column OR metadata fees array
            $txQuery->where(function ($q) use ($fee) {
                $q->where('fee_id', $fee->id)
                  ->orWhereRaw("JSON_SEARCH(metadata, 'one', ?) IS NOT NULL", [$fee->title]);
            });

            $transactions = $txQuery->orderBy('paid_at')->get();

            $totalPaid = (float)$transactions->sum('amount');
            $remaining = max(0, $feeAmount - $totalPaid);

            $result[] = [
                'fee_id' => $fee->id,
                'fee_title' => $fee->title,
                'fee_amount' => $feeAmount,
                'total_paid' => $totalPaid,
                'remaining' => $remaining,
                'status' => $remaining <= 0 ? 'paid' : ($totalPaid > 0 ? 'partial' : 'pending'),
                'payments' => $transactions->map(function ($tx) {
                    $feeList = $tx->metadata['fees'] ?? [];
                    return [
                        'id' => $tx->id,
                        'reference' => $tx->reference,
                        'amount' => (float)$tx->amount,
                        'channel' => $tx->channel ?? 'N/A',
                        'paid_at' => $tx->paid_at ? $tx->paid_at->format('M d, Y h:i A') : $tx->created_at->format('M d, Y h:i A'),
                        'gateway' => $tx->gateway ?? '—',
                    ];
                }),
            ];
        }

        // Add adjustments (discounts/extra charges) as separate entries
        $adjustments = StudentAdjustment::where('institution_id', $institutionId)
            ->where('student_id', $student->id)
            ->where('session_id', $sessionId)
            ->where(function ($q) use ($term) {
                $q->where('term', $term)->orWhereNull('term');
            })
            ->get();

        foreach ($adjustments as $adj) {
            $result[] = [
                'fee_id' => 'adj-' . $adj->id,
                'fee_title' => $adj->description ?? ($adj->amount > 0 ? 'Extra Charge' : 'Discount'),
                'fee_amount' => 0,
                'total_paid' => (float)$adj->amount,
                'remaining' => 0,
                'status' => 'adjustment',
                'is_adjustment' => true,
                'payments' => [],
            ];
        }

        return $result;
    }
}
