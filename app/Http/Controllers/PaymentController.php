<?php

namespace App\Http\Controllers;

use App\Models\Fee;
use App\Models\PaymentSummary;
use App\Models\SchoolClass;
use App\Models\Session;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function overview(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        $currentSession = Session::where('institution_id', $institutionId)->where('is_current', true)->first();
        
        if (!$currentSession) {
            return Inertia::render('PaymentsOverview', [
                'expandedStats' => [],
                'paymentBreakdown' => [],
                'sessions' => Session::where('institution_id', $institutionId)->get(),
                'fees' => []
            ]);
        }

        // 1. Calculate Expected Income (All students * Active fees)
        $studentCount = Student::where('institution_id', $institutionId)->count();
        $totalFeesAmount = Fee::where('institution_id', $institutionId)->where('status', 'active')->sum('amount');
        $expectedAmount = $totalFeesAmount * $studentCount;

        // 2. Calculate Total Received (Sum of successful transactions)
        $totalReceivedAmount = \App\Models\Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->sum('amount');

        // 3. Count Completed (Students who paid fully - simplified)
        // For a more complex system, we'd check if specific students' balances are zero
        $completedCount = Student::where('institution_id', $institutionId)->where('payment_status', 'paid')->count();

        $stats = [
            ['label' => 'RECEIVED', 'amount' => '₦' . number_format($totalReceivedAmount), 'count' => $completedCount],
            ['label' => 'EXPECTED', 'amount' => '₦' . number_format($expectedAmount), 'count' => $studentCount],
            ['label' => 'DEBT', 'amount' => '₦' . number_format(max(0, $expectedAmount - $totalReceivedAmount)), 'count' => max(0, $studentCount - $completedCount)],
            ['label' => 'DISCOUNT APPLIED', 'amount' => '₦0', 'count' => 0],
            ['label' => 'EXTRA APPLIED', 'amount' => '₦0', 'count' => 0],
        ];

        // Breakdown per class
        $classes = SchoolClass::where('institution_id', $institutionId)->with(['category'])->get();
        $breakdown = $classes->map(function ($class) use ($institutionId, $currentSession) {
            $classStudentCount = Student::where('class_id', $class->id)->count();
            $classFeesAmount = Fee::where('class_id', $class->id)->where('status', 'active')->sum('amount');
            $classExpected = $classFeesAmount * $classStudentCount;

            $classReceived = \App\Models\Transaction::where('institution_id', $institutionId)
                ->where('status', 'success')
                ->whereHas('student', function($q) use ($class) {
                    $q->where('class_id', $class->id);
                })
                ->sum('amount');

            $classCompleted = Student::where('class_id', $class->id)->where('payment_status', 'paid')->count();

            return [
                'id' => $class->id,
                'title' => $class->name,
                'flatAmount' => (float) $classFeesAmount,
                'expected' => number_format($classExpected) . ' (' . $classStudentCount . ')',
                'totalReceived' => number_format($classReceived) . ' (' . $classCompleted . ')',
                'completed' => number_format($classReceived) . ' (' . $classCompleted . ')',
                'partPayment' => '0 (0)',
                'debt' => number_format(max(0, $classExpected - $classReceived)) . ' (' . max(0, $classStudentCount - $classCompleted) . ')',
                'progress' => (int) ($classExpected > 0 ? ($classReceived / $classExpected) * 100 : 0),
                'discount' => 0.0,
                'extraCharge' => 0.0,
            ];
        });

        return Inertia::render('PaymentsOverview', [
            'initialExpandedStats' => $stats,
            'initialPaymentBreakdown' => $breakdown,
            'sessions' => Session::where('institution_id', $institutionId)->get(),
            'fees' => Fee::where('institution_id', $institutionId)->get(),
        ]);
    }

    public function transactions()
    {
        $institutionId = auth()->user()->institution_id;

        $transactions = \App\Models\Transaction::where('institution_id', $institutionId)
            ->with(['student', 'fee'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'student_name' => $transaction->student->name ?? 'N/A',
                    'fee_title' => $transaction->fee->title ?? 'N/A',
                    'amount' => '₦' . number_format($transaction->amount, 2),
                    'raw_amount' => $transaction->amount,
                    'status' => ucfirst($transaction->status),
                    'payment_method' => ucfirst($transaction->payment_method ?? 'N/A'),
                    'date' => $transaction->created_at->format('M d, Y h:i A'),
                    'paid_at' => $transaction->paid_at ? $transaction->paid_at->format('M d, Y h:i A') : null,
                ];
            });

        return Inertia::render('Transactions', [
            'transactions' => $transactions
        ]);
    }

    public function show(Transaction $transaction)
    {
        $this->authorize('view', $transaction);
        
        $transaction->load(['student.schoolClass', 'fee.session', 'institution']);
        
        $metadata = $transaction->metadata ?? [];
        
        // Format data for the UI as seen in the screenshot
        $details = [
            'transaction_info' => [
                'reference' => $transaction->reference,
                'status' => $transaction->status,
                'amount' => '₦' . number_format($transaction->amount, 2),
                'fee_incurred' => '₦' . number_format($metadata['fee_incurred'] ?? 0, 2),
                'gateway' => $transaction->gateway,
                'channel' => $transaction->channel ?? 'N/A',
                'destination_account' => $metadata['destination_account'] ?? 'N/A',
                'destination_account_name' => $metadata['destination_account_name'] ?? 'N/A',
                'virtual_account_type' => $metadata['virtual_account_type'] ?? 'N/A',
                'method_of_payment' => $metadata['method_of_payment'] ?? 'N/A',
                'started_on' => $transaction->created_at->format('M d, Y'),
                'completed_on' => $transaction->paid_at ? $transaction->paid_at->format('M d, Y') : 'N/A',
                'settlement_status' => $metadata['settlement_status'] ?? 'Pending Settlement',
            ],
            'fee_info' => [
                'purpose' => $transaction->fee->title ?? 'N/A',
                'amount' => '₦' . number_format($transaction->fee->amount ?? 0, 2),
                'session' => $transaction->fee->session->name ?? 'N/A',
                'term' => $transaction->fee->cycle ?? 'N/A',
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
                    'expected' => $transaction->fee->amount ?? 0,
                    'paid' => $transaction->amount,
                    'balance' => max(0, ($transaction->fee->amount ?? 0) - $transaction->amount),
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

        // 2. If not found, try to find by student registration number
        if (!$transaction) {
            $student = \App\Models\Student::where('institution_id', $institutionId)
                ->where('admission_number', $query)
                ->first();

            if ($student) {
                $transaction = \App\Models\Transaction::where('student_id', $student->id)
                    ->with(['student', 'fee.session'])
                    ->orderBy('created_at', 'desc')
                    ->first();
            }
        }

        if (!$transaction) {
            return response()->json(['message' => 'No matching transaction found.'], 404);
        }

        return response()->json([
            'student_name' => $transaction->student->name ?? 'N/A',
            'fee_title' => $transaction->fee->title ?? 'N/A',
            'session' => $transaction->fee->session->name ?? 'N/A',
            'term' => $transaction->fee->cycle ?? 'N/A',
            'reference' => $transaction->reference,
            'date' => $transaction->created_at->format('M d, Y'),
            'amount' => '₦' . number_format($transaction->amount, 2),
            'status' => ucfirst($transaction->status),
        ]);
    }
}
