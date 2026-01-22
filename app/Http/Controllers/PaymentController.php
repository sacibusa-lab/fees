<?php

namespace App\Http\Controllers;

use App\Models\Fee;
use App\Models\PaymentSummary;
use App\Models\SchoolClass;
use App\Models\Session;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\StudentAdjustment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function overview(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        
        $sessionId = $request->query('session_id');
        $term = $request->query('term');
        $feeId = $request->query('fee_id');

        // Determine Session
        if ($sessionId) {
            $currentSession = Session::where('institution_id', $institutionId)->find($sessionId);
        } else {
            $currentSession = Session::where('institution_id', $institutionId)->where('is_current', true)->first();
        }
        
        if (!$currentSession) {
            return Inertia::render('PaymentsOverview', [
                'initialExpandedStats' => [],
                'initialPaymentBreakdown' => [],
                'sessions' => Session::where('institution_id', $institutionId)->get(),
                'fees' => [],
                'filters' => [
                    'session_id' => null,
                    'term' => $term,
                    'fee_id' => $feeId
                ]
            ]);
        }

        // Determine Term (Normalize)
        if (!$term) {
            $term = '1st Term'; // Default if not provided
        }

        // Determine Fees to include
        // CHANGE: Allow showing ALL active fees for the institution initially, unless specific year/filtering logic implies otherwise.
        // Actually, for "School Fees" we usually want session-bound, but if users want "ALL", we should be broader.
        // Let's keep session filter for now but ensure we include fees that might be cross-session if needed (e.g. one-time).
        // For now, removing the strict session_id check if the user wants to see "everything" might be too broad if we have 10 years of data.
        // But the issue is "filters only school fees".
        
        $activeFeesQuery = Fee::where('institution_id', $institutionId)
            ->where('status', 'active');
        
        // Only filter by session IF the fee is termly/annually. One-time fees should show regardless? 
        // Or simply: If specific fee is not selected, we show key metrics for the current session.
        // The user said "page still filters only school fees". 
        // I suspect this line: ->where('session_id', $currentSession->id) is the culprit if they have fees NOT attached to a session (global fees).
        
        $activeFeesQuery->where(function($q) use ($currentSession) {
             $q->where('session_id', $currentSession->id)
               ->orWhereNull('session_id'); // INCLUDE GLOBAL FEES
        });
        
        if ($feeId && $feeId !== 'all') {
            $activeFeesQuery->where('id', $feeId);
        }
        
        $activeFees = $activeFeesQuery->with('overrides')->get();
        $classes = SchoolClass::where('institution_id', $institutionId)->with(['category'])->get();
        
        $expectedAmount = 0;
        $totalStudentCount = Student::where('institution_id', $institutionId)->count();

        $breakdown = $classes->map(function ($class) use ($institutionId, $activeFees, $currentSession, $term, &$expectedAmount) {
            $classStudentCount = Student::where('class_id', $class->id)->count();
            
            // Calculate total fee for this specific class for the selected term/session
            $classUnitFee = 0;
            foreach ($activeFees as $fee) {
                // Check if fee is active for this term
                if (!$fee->isActiveForTerm($term)) continue;

                $override = $fee->overrides->where('class_id', $class->id)->first();
                if ($override) {
                    if ($override->status === 'active') {
                        $classUnitFee += $override->amount;
                    }
                } else {
                    $classUnitFee += $fee->getAmountForTerm($term);
                }
            }

            $classExpected = $classUnitFee * $classStudentCount;
            $expectedAmount += $classExpected;

            // Get transactions for this class, session, and term
            $transactionsQuery = Transaction::where('institution_id', $institutionId)
                ->where('status', 'success')
                ->whereHas('student', function($q) use ($class) {
                    $q->where('class_id', $class->id);
                });
            
            // We need to filter transactions by session and term in metadata
            $transactionsQuery->where('metadata->session_id', $currentSession->id)
                              ->where('metadata->term', $term);

            // If a specific fee is filtered
            if ($activeFees->count() === 1) {
                $transactionsQuery->where('fee_id', $activeFees->first()->id);
            }

            $classReceived = $transactionsQuery->sum('amount');

            // 1. Unique students who have paid SOMETHING
            $classPayerCount = (clone $transactionsQuery)->distinct('student_id')->count('student_id');

            // 2. Count students who have fully paid the unit fee
            // This is more complex but we can estimate or precisely count if we query by student
            $classCompletedCount = 0;
            if ($classUnitFee > 0) {
                 // Get all unique student IDs for this class
                 $classStudentIds = Student::where('class_id', $class->id)->pluck('id');
                 
                 // Sum payments per student for this context
                 $studentPayments = Transaction::where('institution_id', $institutionId)
                    ->where('status', 'success')
                    ->whereIn('student_id', $classStudentIds)
                    ->where('metadata->session_id', $currentSession->id)
                    ->where('metadata->term', $term);
                 
                 if ($activeFees->count() === 1) {
                    $studentPayments->where('fee_id', $activeFees->first()->id);
                 }

                 $paidTotals = $studentPayments->groupBy('student_id')
                    ->select('student_id', DB::raw('SUM(amount) as total'))
                    ->get();

                 $classCompletedCount = $paidTotals->filter(function($p) use ($classUnitFee) {
                    return $p->total >= $classUnitFee;
                 })->count();
            }

            $classDebtCount = max(0, $classStudentCount - $classCompletedCount);

            return [
                'id' => $class->id,
                'title' => $class->name,
                'flatAmount' => (float) $classUnitFee,
                'expected' => number_format($classExpected) . ' (' . $classStudentCount . ')',
                'totalReceived' => number_format($classReceived) . ' (' . $classPayerCount . ')',
                'completed' => number_format($classReceived * ($classCompletedCount > 0 ? ($classCompletedCount/$classStudentCount) : 0)) . ' (' . $classCompletedCount . ')', // Approximation for value
                'partPayment' => '0 (0)', // Could be refined
                'debt' => number_format(max(0, $classExpected - $classReceived)) . ' (' . $classDebtCount . ')',
                'progress' => (int) ($classExpected > 0 ? ($classReceived / $classExpected) * 100 : 0),
                'discount' => 0.0,
                'extraCharge' => 0.0,
            ];
        });

        // 2. Calculate Total Received (Sum of successful transactions matching filters)
        $totalReceivedQuery = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success');
        
        $totalReceivedQuery->where('metadata->session_id', $currentSession->id)
                           ->where('metadata->term', $term);

        if ($activeFees->count() === 1) {
            $totalReceivedQuery->where('fee_id', $activeFees->first()->id);
        }

        $totalReceivedAmount = $totalReceivedQuery->sum('amount');
        $totalPayerCount = (clone $totalReceivedQuery)->distinct('student_id')->count('student_id');

        // For summary cards, we use the total unique payer count as the 'completed' figure for now
        $completedCount = $totalPayerCount;

        $stats = [
            ['label' => 'RECEIVED', 'amount' => '₦' . number_format($totalReceivedAmount), 'count' => $totalPayerCount],
            ['label' => 'EXPECTED', 'amount' => '₦' . number_format($expectedAmount), 'count' => $totalStudentCount],
            ['label' => 'DEBT', 'amount' => '₦' . number_format(max(0, $expectedAmount - $totalReceivedAmount)), 'count' => max(0, $totalStudentCount - $completedCount)],
            ['label' => 'DISCOUNT APPLIED', 'amount' => '₦0', 'count' => 0],
            ['label' => 'EXTRA APPLIED', 'amount' => '₦0', 'count' => 0],
        ];

        return Inertia::render('PaymentsOverview', [
            'initialExpandedStats' => $stats,
            'initialPaymentBreakdown' => $breakdown,
            'sessions' => Session::where('institution_id', $institutionId)->get(),
            'fees' => Fee::where('institution_id', $institutionId)->where('session_id', $currentSession->id)->get(),
            'filters' => [
                'session_id' => $currentSession->id,
                'term' => $term,
                'fee_id' => $feeId ?: 'all'
            ]
        ]);
    }

    public function transactions()
    {
        $institutionId = auth()->user()->institution_id;

        $transactions = Transaction::where('institution_id', $institutionId)
            ->with(['student', 'fee'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'student_name' => $transaction->student->name ?? 'N/A',
                    'fee_title' => $transaction->fee->title ?? ($transaction->metadata['fees'][0] ?? 'Multi-Fee Payment'),
                    'amount' => '₦' . number_format($transaction->amount, 2),
                    'raw_amount' => $transaction->amount,
                    'status' => ucfirst($transaction->status),
                    'payment_method' => ucfirst($transaction->channel ?? 'N/A'),
                    'date' => $transaction->created_at->format('M d, Y h:i A'),
                    'paid_at' => $transaction->paid_at ? $transaction->paid_at->format('M d, Y h:i A') : null,
                ];
            });

        return Inertia::render('Transactions', [
            'transactions' => $transactions
        ]);
    }

    public function schedule()
    {
        $institutionId = auth()->user()->institution_id;
        $sessions = \App\Models\Session::where('institution_id', $institutionId)
            ->orderBy('is_current', 'desc')
            ->orderBy('name', 'desc')
            ->get();

        $classes = \App\Models\SchoolClass::where('institution_id', $institutionId)
            ->orderBy('name', 'asc')
            ->get();

        // Fetch global subclasses scoped to this institution
        $subClasses = \App\Models\SubClass::where('institution_id', $institutionId)
            ->whereNull('class_id')
            ->get();

        $fees = \App\Models\Fee::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->pluck('title')
            ->unique()
            ->values();

        return Inertia::render('PaymentSchedule', [
            'sessions' => $sessions,
            'classes' => $classes,
            'subClasses' => $subClasses,
            'fees' => $fees
        ]);
    }

    public function bulkModifyAmount(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:add,subtract',
            'description' => 'nullable|string|max:255',
            'session_id' => 'required|exists:sessions,id',
            'term' => 'required|string',
        ]);

        $institutionId = auth()->user()->institution_id;
        $amount = $validated['type'] === 'subtract' ? -$validated['amount'] : $validated['amount'];

        foreach ($validated['student_ids'] as $studentId) {
            StudentAdjustment::create([
                'institution_id' => $institutionId,
                'student_id' => $studentId,
                'session_id' => $validated['session_id'],
                'term' => $validated['term'],
                'amount' => $amount,
                'description' => $validated['description'] ?? ($validated['type'] === 'add' ? 'Manual Addition' : 'Manual Discount'),
            ]);
        }

        return redirect()->back()->with('success', 'Amounts modified successfully');
    }

    public function bulkMarkPaid(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'session_id' => 'required|exists:sessions,id',
            'term' => 'required|string',
            'fee_title' => 'nullable|string'
        ]);

        $institutionId = auth()->user()->institution_id;
        $feeId = null;

        if ($request->fee_title && $request->fee_title !== 'all') {
            $fee = Fee::where('institution_id', $institutionId)
                ->where('session_id', $validated['session_id'])
                ->where('title', $request->fee_title)
                ->first();
            $feeId = $fee?->id;
        }
        
        // Use getNoticeData to calculate totals
        $preview = $this->getNoticeData($request);
        if ($preview instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['message' => 'Invalid session or term selection.'], 400);
        }
        $notices = collect($preview['notices'])->whereIn('student.id', $validated['student_ids']);

        $paymentMode = $request->input('payment_mode', 'full'); // full or partial
        $customAmount = $request->input('amount');
        $description = $request->input('description');

        DB::transaction(function() use ($notices, $institutionId, $validated, $feeId, $paymentMode, $customAmount, $description) {
            foreach ($notices as $notice) {
                // Determine amount to pay
                $amountToPay = 0;
                if ($paymentMode === 'partial' && $customAmount) {
                     $amountToPay = (float) $customAmount;
                } else {
                     $amountToPay = $notice['total_due'];
                }

                if ($amountToPay <= 0) continue;

                Transaction::create([
                    'institution_id' => $institutionId,
                    'student_id' => $notice['student']->id,
                    'fee_id' => $feeId,
                    'reference' => 'MAN-' . strtoupper(Str::random(10)),
                    'amount' => $amountToPay,
                    'status' => 'success',
                    'channel' => 'manual',
                    'paid_at' => now(),
                    'metadata' => [
                        'session_id' => (int)$validated['session_id'],
                        'term' => $validated['term'],
                        'type' => 'manual_bulk_payment',
                        'payment_mode' => $paymentMode,
                        'description' => $description,
                        'fees' => collect($notice['fees'])->pluck('title')->toArray()
                    ]
                ]);
            }
        });

        return redirect()->back()->with('success', 'Payments recorded successfully');
    }

    public function exportSchedule(Request $request)
    {
        $statusFilter = $request->input('status', 'all'); // all, paid, pending, partial
        $preview = $this->getNoticeData($request);
        $notices = collect($preview['notices']);

        // Filtering logic based on transaction status would go here
        // For now, let's just export what we have in the preview
        
        $filename = "payment_schedule_" . Str::slug($preview['session_name'] . "_" . $preview['term']) . ".csv";
        
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($notices) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['S/N', 'Student Name', 'Admission Number', 'Class', 'Subclass', 'Total Due (₦)']);

            foreach ($notices as $index => $notice) {
                fputcsv($file, [
                    $index + 1,
                    $notice['student']->name,
                    $notice['student']->admission_number,
                    $notice['student']->schoolClass->name ?? 'N/A',
                    $notice['student']->subClass->name ?? 'N/A',
                    number_format($notice['total_due'], 2)
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function downloadSchedulePdf(Request $request)
    {
        $data = $this->getNoticeData($request);
        
        if ($data instanceof \Illuminate\Http\RedirectResponse) {
            return $data;
        }

        $pdf = Pdf::loadView('pdf.payment_notice', $data);

        // Sanitize filename: replace slashes and backslashes with underscores
        $filename = "Payment_Schedules_" . str_replace(['/', '\\'], '_', $data['session_name'] . "_" . $data['term']) . ".pdf";

        return $pdf->download($filename);
    }

    public function getSchedulePreview(Request $request)
    {
        $data = $this->getNoticeData($request);

        if ($data instanceof \Illuminate\Http\RedirectResponse) {
            return response()->json(['error' => 'Session and Term are required.'], 400);
        }

        return response()->json($data);
    }

    private function getNoticeData(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        $sessionId = $request->input('session_id');
        $term = $request->input('term');
        
        // Normalize term: 1st Term -> First Term for matching if needed, 
        // but let's keep it consistent with the frontend '1st Term'
        if ($term && str_contains(strtolower($term), '1st')) $term = '1st Term';
        if ($term && str_contains(strtolower($term), '2nd')) $term = '2nd Term';
        if ($term && str_contains(strtolower($term), '3rd')) $term = '3rd Term';

        $classId = $request->input('class_id');
        $subClassId = $request->input('sub_class_id');
        $feeTitle = $request->input('fee_title'); // New filter

        if (!$sessionId || !$term) {
            return redirect()->back()->with('error', 'Session and Term are required.');
        }

        $session = Session::find($sessionId);
        if (!$session) {
            return redirect()->back()->with('error', 'Academic Year (Session) not found.');
        }
        $institution = auth()->user()->institution;

        // Fetch students in this institution with optional filters
        $studentsQuery = Student::where('institution_id', $institutionId);
        
        if ($classId) {
            $studentsQuery->where('class_id', $classId);
        }
        
        if ($subClassId) {
            $studentsQuery->where('sub_class_id', $subClassId);
        }

        $students = $studentsQuery->with(['schoolClass', 'virtualAccount', 'adjustments' => function($q) use ($sessionId, $term) {
                $q->where('session_id', $sessionId)->where('term', $term);
            }])
            ->orderBy('name', 'asc')
            ->get();

        // Fetch active fees for this session/term
        $feesQuery = Fee::where('institution_id', $institutionId)
            ->where(function($q) use ($sessionId) {
                $q->where('session_id', $sessionId)
                  ->orWhereNull('session_id');
            })
            ->where(function($q) use ($term) {
                $termName = strtolower(str_replace(' Term', '', $term));
                // If fee is annually, one-time, or termly, it applies, or if cycle matches term
                $q->whereIn('cycle', ['annually', 'one-time', 'termly', $termName]);
            })
            ->where('status', 'active');
        
        // Filter by term activation status
        $termKey = strtolower($term);
        $termActivationColumn = null;
        if (str_contains($termKey, '1st') || str_contains($termKey, 'first')) $termActivationColumn = 'first_term_active';
        if (str_contains($termKey, '2nd') || str_contains($termKey, 'second')) $termActivationColumn = 'second_term_active';
        if (str_contains($termKey, '3rd') || str_contains($termKey, 'third')) $termActivationColumn = 'third_term_active';
        
        if ($termActivationColumn) {
            $feesQuery->where($termActivationColumn, true);
        }
        
        if ($feeTitle && $feeTitle !== 'all') {
            $feesQuery->where('title', $feeTitle);
        }

        $fees = $feesQuery->with('overrides')->get();

        $notices = $students->map(function ($student) use ($fees, $session, $term) {
            $studentFees = $fees->map(function ($fee) use ($student, $term) {
                // Check if fee is class-specific
                if ($fee->class_id && $fee->class_id != $student->class_id) {
                    return null;
                }

                $override = $fee->overrides->where('class_id', $student->class_id)->first();
                
                // Use term-specific amount if available, otherwise use override or default amount
                if ($override && $override->status === 'active') {
                    $amount = $override->amount;
                } else {
                    $amount = $fee->getAmountForTerm($term);
                }
                
                return [
                    'id' => $fee->id,
                    'title' => $fee->title,
                    'amount' => $amount,
                    'status' => 'pending'
                ];
            })->toArray();

            // Append adjustments to student fees
            foreach ($student->adjustments as $adj) {
                $studentFees[] = [
                    'id' => 'adj-' . $adj->id,
                    'title' => $adj->description ?: ($adj->amount > 0 ? 'Additional Charge' : 'Discount'),
                    'amount' => (float)$adj->amount,
                    'status' => 'applied',
                    'is_adjustment' => true
                ];
            }

            // Calculate Total Paid for this session/term
            $totalPaid = \App\Models\Transaction::where('institution_id', $session->institution_id)
                ->where('student_id', $student->id)
                ->where('status', 'success')
                ->where('metadata->session_id', $session->id)
                ->where('metadata->term', $term)
                ->sum('amount');

            $totalDue = collect($studentFees)->sum('amount');
            $balance = $totalDue - $totalPaid;

            return [
                'student' => $student,
                'fees' => $studentFees,
                'total_due' => $balance > 0 ? $balance : 0, // Show balance as due amount
                'original_total' => $totalDue,
                'total_paid' => $totalPaid,
                'session' => $session->name,
                'term' => $term,
            ];
        })->filter(function($notice) {
            // Filter out students who have fully paid (balance <= 0) OR have no fees
            // User requested: "if someone has fuly paid, let them not show"
            return count($notice['fees']) > 0 && $notice['total_due'] > 0; 
        })->values();

        return [
            'notices' => $notices,
            'institution' => $institution,
            'session_name' => $session->name,
            'term' => $term,
            'fee_title' => $feeTitle // For branding/filename context
        ];
    }

    public function show(Transaction $transaction)
    {
        if ($transaction->institution_id !== auth()->user()->institution_id) {
             abort(403);
        }
        
        $transaction->load(['student.schoolClass', 'fee.session', 'institution']);
        
        $metadata = $transaction->metadata ?? [];
        
        // Calculate Expected Amount Logic
        $expectedAmount = 0;
        if ($transaction->fee && $transaction->student) {
            $fee = $transaction->fee;
            $student = $transaction->student;
            $term = $metadata['term'] ?? null;

            // 1. Check for Class Override
            $override = $fee->overrides->where('class_id', $student->class_id)->first();
            
            if ($override && $override->status === 'active') {
                $expectedAmount = $override->amount;
            } else {
                // 2. Check for Term Specific Amount if term is known
                if ($term) {
                    $expectedAmount = $fee->getAmountForTerm($term);
                } else {
                    // 3. Fallback to default amount
                    $expectedAmount = $fee->amount;
                }
            }
        }

        // Format data for the UI as seen in the screenshot
        $details = [
            'transaction_info' => [
                'reference' => $transaction->reference,
                'status' => $transaction->status,
                'amount' => '₦' . number_format($transaction->amount, 2),
                // 'fee_incurred' removed
                'gateway' => $transaction->gateway,
                'channel' => $transaction->channel ?? 'N/A',
                'destination_account' => $metadata['destination_account'] ?? 'N/A',
                'destination_account_name' => $metadata['destination_account_name'] ?? 'N/A',
                'virtual_account_type' => $metadata['virtual_account_type'] ?? 'N/A',
                'method_of_payment' => $metadata['method_of_payment'] ?? 'N/A',
                'started_on' => $transaction->created_at->format('M d, Y'),
                'completed_on' => $transaction->paid_at ? $transaction->paid_at->format('M d, Y') : 'N/A',
                // 'settlement_status' removed
            ],
            'fee_info' => [
                'purpose' => $transaction->fee->title ?? 'N/A',
                'amount' => '₦' . number_format($expectedAmount, 2),
                'session' => $transaction->fee->session->name ?? 'N/A',
                'term' => $metadata['term'] ?? ($transaction->fee ? ucwords(str_replace('-', ' ', $transaction->fee->cycle)) : 'N/A'),
            ],
            'student_info' => [
                'name' => $transaction->student->name ?? 'N/A',
                'reg_number' => $transaction->student->admission_number ?? 'N/A',
                'class' => $transaction->student->schoolClass->name ?? 'N/A',
                'email' => $transaction->student->email ?? 'N/A',
                'phone' => $transaction->student->guardian_phone ?? 'N/A',
            ],
            // For the tabs at the bottom
            'payment_history' => [
                [
                    'sn' => 1,
                    'expected' => '₦' . number_format($expectedAmount, 2),
                    'paid' => '₦' . number_format($transaction->amount, 2),
                    'balance' => '₦' . number_format(max(0, $expectedAmount - $transaction->amount), 2),
                    'date' => $transaction->created_at->format('d/m/y, h:i A'),
                ]
            ],
            'beneficiaries' => $transaction->fee ? $transaction->fee->beneficiaries()->with('bankAccount')->get() : [],
        ];

        return Inertia::render('TransactionDetail', [
            'transaction' => $details
        ]);
    }

    public function verifyStatus(Request $request)
    {
        $query = $request->query('query');
        $institutionId = auth()->user()->institution_id;

        if (!$query) {
            return response()->json(['message' => 'Please provide a reference or registration number.'], 400);
        }

        // 1. Try to find by transaction reference
        $transaction = \App\Models\Transaction::where('institution_id', $institutionId)
            ->where('reference', $query)
            ->with(['student', 'fee.session'])
            ->first();

        if ($transaction) {
            return response()->json([
                'type' => 'single',
                'data' => [
                    'student_name' => $transaction->student->name ?? 'N/A',
                    'fee_title' => $transaction->fee->title ?? 'N/A',
                    'session' => $transaction->fee->session->name ?? 'N/A',
                    'term' => $transaction->fee ? ucwords(str_replace('-', ' ', $transaction->fee->cycle)) : 'N/A',
                    'reference' => $transaction->reference,
                    'date' => $transaction->created_at->format('M d, Y'),
                    'amount' => '₦' . number_format($transaction->amount, 2),
                    'status' => ucfirst($transaction->status),
                ]
            ]);
        }

        // 2. If not found, try to find by student registration number
        $student = \App\Models\Student::where('institution_id', $institutionId)
            ->where('admission_number', $query)
            ->first();

        if ($student) {
             // Get current session
             $currentSession = \App\Models\Session::where('institution_id', $institutionId)
                ->where('is_current', true)
                ->first();

            if (!$currentSession) {
                 return response()->json(['message' => 'No active session found.'], 404);
            }

            // Get all successful transactions for this session
            $transactions = \App\Models\Transaction::where('institution_id', $institutionId)
                ->where('student_id', $student->id)
                ->where('status', 'success')
                ->where(function($q) use ($currentSession) {
                    $q->where('metadata->session_id', $currentSession->id)
                      ->orWhere('metadata->session_id', (string)$currentSession->id);
                })
                ->with(['fee'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($t) {
                     return [
                        'reference' => $t->reference,
                        'fee_title' => $t->fee->title ?? ($t->metadata['fees'][0] ?? 'N/A'),
                        'amount' => '₦' . number_format($t->amount, 2),
                        'date' => $t->created_at->format('M d, Y'),
                        'term' => $t->metadata['term'] ?? 'N/A',
                        'status' => ucfirst($t->status)
                     ];
                })
                ->values();

            return response()->json([
                'type' => 'list',
                'student_name' => $student->name,
                'session' => $currentSession->name,
                'data' => $transactions
            ]);
        }

        return response()->json(['message' => 'No matching record found.'], 404);
    }

    /**
     * Get detailed payment status for all students in a class for a specific fee
     */
    public function classDetails(Request $request, $classId)
    {
        $institutionId = auth()->user()->institution_id;
        $feeId = $request->query('fee_id');

        if (!$feeId) {
            return response()->json(['message' => 'Fee ID is required'], 400);
        }

        $fee = Fee::where('institution_id', $institutionId)->with('overrides')->find($feeId);
        if (!$fee) {
            return response()->json(['message' => 'Fee not found'], 404);
        }

        $class = SchoolClass::where('institution_id', $institutionId)->find($classId);
        if (!$class) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        // Determine the expected amount for this class (handle override)
        $override = $fee->overrides->where('class_id', $classId)->first();
        $expectedAmount = $override && $override->status === 'active' ? $override->amount : $fee->amount;

        $students = Student::where('class_id', $classId)
            ->with(['subClass'])
            ->get()
            ->map(function ($student) use ($institutionId, $feeId, $expectedAmount) {
                $totalPaid = Transaction::where('institution_id', $institutionId)
                    ->where('student_id', $student->id)
                    ->where('fee_id', $feeId)
                    ->where('status', 'success')
                    ->sum('amount');

                $status = 'pending';
                if ($totalPaid >= $expectedAmount) {
                    $status = 'paid';
                } elseif ($totalPaid > 0) {
                    $status = 'partial';
                }

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'reg_no' => $student->admission_number,
                    'sub_class' => $student->subClass->name ?? 'N/A',
                    'status' => $status,
                    'paid' => $totalPaid,
                    'expected' => $expectedAmount,
                ];
            });

        return response()->json([
            'class_name' => $class->name,
            'fee_title' => $fee->title,
            'students' => $students
        ]);
    }
}
