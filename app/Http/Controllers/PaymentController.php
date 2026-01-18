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
                'sessions' => [],
                'fees' => []
            ]);
        }

        // Aggregate Stats
        $summaries = PaymentSummary::where('institution_id', $institutionId)
            ->where('session_id', $currentSession->id)
            ->get();

        $stats = [
            ['label' => 'RECEIVED', 'amount' => '₦' . number_format($summaries->sum('total_received')), 'count' => $summaries->sum('completed_count')],
            ['label' => 'EXPECTED', 'amount' => '₦' . number_format($summaries->sum('expected')), 'count' => $summaries->sum('reserved')], // In the ref, count for expected is total students reserved
            ['label' => 'DEBT', 'amount' => '₦' . number_format($summaries->sum('debt')), 'count' => $summaries->sum('reserved') - $summaries->sum('completed_count')],
            ['label' => 'DISCOUNT APPLIED', 'amount' => '₦' . number_format($summaries->sum('discount_applied')), 'count' => 0],
            ['label' => 'EXTRA APPLIED', 'amount' => '₦' . number_format($summaries->sum('extra_applied')), 'count' => 0],
        ];

        // Breakdown per class
        $classes = SchoolClass::where('institution_id', $institutionId)->with(['category'])->get();
        $breakdown = $classes->map(function ($class) use ($institutionId, $currentSession) {
            $classSummary = PaymentSummary::where('institution_id', $institutionId)
                ->where('session_id', $currentSession->id)
                ->whereHas('fee', function ($query) use ($class) {
                    $query->where('class_id', $class->id);
                })
                ->first();

            $fee = Fee::where('class_id', $class->id)->where('session_id', $currentSession->id)->first();

            return [
                'id' => $class->id,
                'title' => $class->name,
                'flatAmount' => (float) ($fee->amount ?? 0),
                'expected' => number_format($classSummary->expected ?? 0) . ' (' . ($classSummary->reserved ?? 0) . ')',
                'totalReceived' => number_format($classSummary->total_received ?? 0) . ' (' . ($classSummary->completed_count ?? 0) . ')',
                'completed' => number_format($classSummary->total_received ?? 0) . ' (' . ($classSummary->completed_count ?? 0) . ')', // Simplified for demo
                'partPayment' => '0 (0)',
                'debt' => number_format($classSummary->debt ?? 0) . ' (' . (($classSummary->reserved ?? 0) - ($classSummary->completed_count ?? 0)) . ')',
                'progress' => (int) ($classSummary && $classSummary->expected > 0 ? ($classSummary->total_received / $classSummary->expected) * 100 : 0),
                'discount' => (float) ($classSummary->discount_applied ?? 0),
                'extraCharge' => (float) ($classSummary->extra_applied ?? 0),
            ];
        });

        return Inertia::render('PaymentsOverview', [
            'initialExpandedStats' => $stats,
            'initialPaymentBreakdown' => $breakdown,
            'sessions' => Session::where('institution_id', $institutionId)->get(),
            'fees' => Fee::where('institution_id', $institutionId)->where('session_id', $currentSession->id)->get(),
        ]);
    }
}
