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
use Illuminate\Support\Str;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $institutionId = auth()->user()->institution_id;

        $sessionId = $request->query('session_id');
        $term = $request->query('term');
        $classId = $request->query('class_id');

        $sessions = Session::where('institution_id', $institutionId)
            ->orderBy('is_current', 'desc')
            ->orderBy('name', 'desc')
            ->get(['id', 'name', 'is_current']);

        $classes = SchoolClass::where('institution_id', $institutionId)
            ->orderBy('name')->get(['id', 'name']);

        if (!$sessionId && $sessions->isNotEmpty()) {
            $current = $sessions->firstWhere('is_current', true) ?? $sessions->first();
            $sessionId = $current->id;
        }
        if (!$term) $term = '1st Term';

        $session = Session::find($sessionId);

        return Inertia::render('Reports', [
            'sessions' => $sessions,
            'classes' => $classes,
            'filters' => [
                'session_id' => $sessionId,
                'term' => $term,
                'class_id' => $classId,
            ],
            'summary' => $this->getSummary($institutionId, $sessionId, $term, $classId),
            'classBreakdown' => $this->getClassBreakdown($institutionId, $sessionId, $term, $classId),
            'trendData' => $this->getTrendData($institutionId),
            'topDefaulters' => $this->getTopDefaulters($institutionId, $sessionId, $term, $classId),
        ]);
    }

    private function getSummary($institutionId, $sessionId, $term, $classId)
    {
        $studentsQuery = Student::where('institution_id', $institutionId)->where('status', 'active');
        if ($classId) $studentsQuery->where('class_id', $classId);
        $totalStudents = $studentsQuery->count();

        // Get active fees for this session
        $fees = Fee::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->where(function ($q) use ($sessionId) {
                $q->where('session_id', $sessionId)->orWhereNull('session_id');
            })
            ->get();

        if ($fees->isEmpty()) {
            $prevSession = Session::where('institution_id', $institutionId)
                ->where('id', '<', $sessionId)->orderBy('id', 'desc')->first();
            if ($prevSession) {
                $fees = Fee::where('institution_id', $institutionId)
                    ->where('session_id', $prevSession->id)->where('status', 'active')->get();
            }
        }

        // Expected revenue
        $expectedTotal = 0;
        $students = $studentsQuery->with('schoolClass')->get();
        foreach ($students as $student) {
            foreach ($fees as $fee) {
                if ($fee->class_id && $fee->class_id != $student->class_id) continue;
                if (!$fee->isActiveForTerm($term)) continue;
                $override = $fee->overrides->where('class_id', $student->class_id)->first();
                $expectedTotal += ($override && $override->status === 'active')
                    ? $override->amount
                    : $fee->getAmountForTerm($term);
            }
        }

        // Actual revenue
        $txQuery = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->where('metadata->term', $term);
        if ($sessionId) {
            $txQuery->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.session_id')) = ?", [(string)$sessionId]);
        }
        if ($classId) {
            $txQuery->whereHas('student', fn($q) => $q->where('class_id', $classId));
        }
        $actualTotal = (float)$txQuery->sum('amount');

        // Discounts
        $discQuery = StudentAdjustment::where('institution_id', $institutionId)
            ->where('session_id', $sessionId)
            ->where(function ($q) use ($term) { $q->where('term', $term)->orWhereNull('term'); });
        if ($classId) $discQuery->whereHas('student', fn($q) => $q->where('class_id', $classId));
        $totalDiscount = abs((float)$discQuery->where('amount', '<', 0)->sum('amount'));
        $totalExtra = (float)$discQuery->where('amount', '>', 0)->sum('amount');

        $collectionRate = $expectedTotal > 0 ? round(($actualTotal / $expectedTotal) * 100, 1) : 0;
        $outstanding = max(0, $expectedTotal - $actualTotal);

        // Students who have fully paid
        $paidCount = 0;
        $partialCount = 0;
        $pendingCount = 0;
        foreach ($students as $student) {
            $studentExpected = 0;
            foreach ($fees as $fee) {
                if ($fee->class_id && $fee->class_id != $student->class_id) continue;
                if (!$fee->isActiveForTerm($term)) continue;
                $override = $fee->overrides->where('class_id', $student->class_id)->first();
                $studentExpected += ($override && $override->status === 'active')
                    ? $override->amount
                    : $fee->getAmountForTerm($term);
            }

            $studentPaid = (float)Transaction::where('institution_id', $institutionId)
                ->where('student_id', $student->id)->where('status', 'success')
                ->where('metadata->term', $term)
                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.session_id')) = ?", [(string)$sessionId])
                ->sum('amount');

            if ($studentExpected > 0 && $studentPaid >= $studentExpected) $paidCount++;
            elseif ($studentPaid > 0) $partialCount++;
            else $pendingCount++;
        }

        return [
            'expected_total' => $expectedTotal,
            'actual_total' => $actualTotal,
            'outstanding' => $outstanding,
            'collection_rate' => $collectionRate,
            'total_students' => $totalStudents,
            'paid_count' => $paidCount,
            'partial_count' => $partialCount,
            'pending_count' => $pendingCount,
            'total_discount' => $totalDiscount,
            'total_extra' => $totalExtra,
        ];
    }

    private function getClassBreakdown($institutionId, $sessionId, $term, $classIdFilter)
    {
        $fees = Fee::where('institution_id', $institutionId)->where('status', 'active')
            ->where(function ($q) use ($sessionId) {
                $q->where('session_id', $sessionId)->orWhereNull('session_id');
            })->with('overrides')->get();

        if ($fees->isEmpty()) {
            $prevSession = Session::where('institution_id', $institutionId)
                ->where('id', '<', $sessionId)->orderBy('id', 'desc')->first();
            if ($prevSession) {
                $fees = Fee::where('institution_id', $institutionId)
                    ->where('session_id', $prevSession->id)->where('status', 'active')
                    ->with('overrides')->get();
            }
        }

        $classes = SchoolClass::where('institution_id', $institutionId)->orderBy('name')->get();
        $breakdown = [];

        foreach ($classes as $class) {
            if ($classIdFilter && $class->id != $classIdFilter) continue;

            $students = Student::where('institution_id', $institutionId)
                ->where('class_id', $class->id)->where('status', 'active')->get();
            $studentCount = $students->count();
            if ($studentCount === 0) continue;

            $expected = 0;
            foreach ($fees as $fee) {
                if ($fee->class_id && $fee->class_id != $class->id) continue;
                if (!$fee->isActiveForTerm($term)) continue;
                $override = $fee->overrides->where('class_id', $class->id)->first();
                $feeAmount = ($override && $override->status === 'active') ? $override->amount : $fee->getAmountForTerm($term);
                $expected += $feeAmount * $studentCount;
            }

            $received = (float)Transaction::where('institution_id', $institutionId)
                ->where('status', 'success')->where('metadata->term', $term)
                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.session_id')) = ?", [(string)$sessionId])
                ->whereHas('student', fn($q) => $q->where('class_id', $class->id))
                ->sum('amount');

            $rate = $expected > 0 ? round(($received / $expected) * 100, 1) : 0;

            $breakdown[] = [
                'class_name' => $class->name,
                'students' => $studentCount,
                'expected' => $expected,
                'received' => $received,
                'outstanding' => max(0, $expected - $received),
                'rate' => $rate,
            ];
        }

        return $breakdown;
    }

    private function getTrendData($institutionId)
    {
        // Monthly collection trend for the last 12 months
        $trend = [];
        for ($i = 11; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();

            $expected = (float)Fee::where('institution_id', $institutionId)
                ->where('status', 'active')->sum('amount');

            $actual = (float)Transaction::where('institution_id', $institutionId)
                ->where('status', 'success')
                ->whereBetween('paid_at', [$monthStart, $monthEnd])
                ->sum('amount');

            $trend[] = [
                'month' => $monthStart->format('M Y'),
                'expected' => $expected,
                'actual' => $actual,
                'rate' => $expected > 0 ? round(($actual / $expected) * 100, 1) : 0,
            ];
        }
        return $trend;
    }

    private function getTopDefaulters($institutionId, $sessionId, $term, $classId)
    {
        $studentsQuery = Student::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->with('schoolClass');

        if ($classId) $studentsQuery->where('class_id', $classId);

        $fees = Fee::where('institution_id', $institutionId)->where('status', 'active')
            ->where(function ($q) use ($sessionId) {
                $q->where('session_id', $sessionId)->orWhereNull('session_id');
            })->with('overrides')->get();

        if ($fees->isEmpty()) {
            $prevSession = Session::where('institution_id', $institutionId)
                ->where('id', '<', $sessionId)->orderBy('id', 'desc')->first();
            if ($prevSession) {
                $fees = Fee::where('institution_id', $institutionId)
                    ->where('session_id', $prevSession->id)->where('status', 'active')
                    ->with('overrides')->get();
            }
        }

        $defaulters = [];
        $students = $studentsQuery->get();

        foreach ($students as $student) {
            $expected = 0;
            foreach ($fees as $fee) {
                if ($fee->class_id && $fee->class_id != $student->class_id) continue;
                if (!$fee->isActiveForTerm($term)) continue;
                $override = $fee->overrides->where('class_id', $student->class_id)->first();
                $expected += ($override && $override->status === 'active')
                    ? $override->amount
                    : $fee->getAmountForTerm($term);
            }

            if ($expected <= 0) continue;

            $paid = (float)Transaction::where('institution_id', $institutionId)
                ->where('student_id', $student->id)->where('status', 'success')
                ->where('metadata->term', $term)
                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.session_id')) = ?", [(string)$sessionId])
                ->sum('amount');

            $outstanding = $expected - $paid;
            if ($outstanding > 0) {
                $defaulters[] = [
                    'id' => $student->id,
                    'name' => $student->name,
                    'admission_no' => $student->admission_number,
                    'class_name' => $student->schoolClass->name ?? 'N/A',
                    'guardian_name' => $student->guardian_name ?? 'N/A',
                    'guardian_phone' => $student->guardian_phone ?? '',
                    'email' => $student->email ?? '',
                    'expected' => $expected,
                    'paid' => $paid,
                    'outstanding' => $outstanding,
                ];
            }
        }

        // Sort by outstanding descending, take top 50
        usort($defaulters, fn($a, $b) => $b['outstanding'] <=> $a['outstanding']);
        return array_slice($defaulters, 0, 50);
    }

    // --- CSV Export ---
    public function exportCsv(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        $type = $request->query('type', 'defaulters'); // defaulters, class-breakdown, summary
        $sessionId = $request->query('session_id');
        $term = $request->query('term', '1st Term');
        $classId = $request->query('class_id');

        $filename = match ($type) {
            'class-breakdown' => 'class_breakdown.csv',
            'summary' => 'collection_summary.csv',
            default => 'top_defaulters.csv',
        };

        $headers = [
            "Content-type" => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate",
        ];

        $callback = function () use ($institutionId, $type, $sessionId, $term, $classId) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF"); // BOM for Excel UTF-8

            if ($type === 'class-breakdown') {
                fputcsv($file, ['Class', 'Students', 'Expected (₦)', 'Received (₦)', 'Outstanding (₦)', 'Collection Rate (%)']);
                $data = $this->getClassBreakdown($institutionId, $sessionId, $term, $classId);
                foreach ($data as $row) {
                    fputcsv($file, [
                        $row['class_name'], $row['students'],
                        number_format($row['expected'], 2),
                        number_format($row['received'], 2),
                        number_format($row['outstanding'], 2),
                        $row['rate'],
                    ]);
                }
            } elseif ($type === 'summary') {
                fputcsv($file, ['Metric', 'Value']);
                $data = $this->getSummary($institutionId, $sessionId, $term, $classId);
                foreach ($data as $key => $val) {
                    fputcsv($file, [Str::title(str_replace('_', ' ', $key)), $val]);
                }
            } else {
                fputcsv($file, ['Name', 'Admission No', 'Class', 'Guardian', 'Phone', 'Expected (₦)', 'Paid (₦)', 'Outstanding (₦)']);
                $data = $this->getTopDefaulters($institutionId, $sessionId, $term, $classId);
                foreach ($data as $row) {
                    fputcsv($file, [
                        $row['name'], $row['admission_no'], $row['class_name'],
                        $row['guardian_name'], $row['guardian_phone'],
                        number_format($row['expected'], 2),
                        number_format($row['paid'], 2),
                        number_format($row['outstanding'], 2),
                    ]);
                }
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
