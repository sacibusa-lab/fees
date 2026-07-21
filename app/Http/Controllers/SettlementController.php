<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Transaction;
use App\Models\DailySettlement;
use App\Models\Fee;
use App\Models\BankAccount;
use App\Models\FeeBeneficiary;
use App\Models\Session;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SettlementController extends Controller
{
    public function index(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        
        // Fetch all successful transactions for the institution
        $transactions = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->orderBy('paid_at', 'desc')
            ->get();

        // Get session names for labeling
        $sessions = Session::where('institution_id', $institutionId)->get()->pluck('name', 'id')->toArray();

        $grouped = [];

        foreach ($transactions as $tx) {
            $sessionId = $tx->metadata['session_id'] ?? 'global';
            $sessionName = $sessions[$sessionId] ?? ($sessionId === 'global' ? 'General' : 'Unknown Session');
            $term = $tx->metadata['term'] ?? 'Other Term';
            $date = $tx->paid_at->format('Y-m-d');
            $month = $tx->paid_at->format('F Y');

            if (!isset($grouped[$sessionName])) $grouped[$sessionName] = [];
            if (!isset($grouped[$sessionName][$term])) $grouped[$sessionName][$term] = [];
            if (!isset($grouped[$sessionName][$term][$month])) $grouped[$sessionName][$term][$month] = [];
            if (!isset($grouped[$sessionName][$term][$month][$date])) {
                $grouped[$sessionName][$term][$month][$date] = [
                    'date' => $date,
                    'total_collected' => 0,
                    'status' => 'ready_for_split',
                    'disbursed_at' => null,
                    'disbursed_by' => null
                ];
            }

            $grouped[$sessionName][$term][$month][$date]['total_collected'] += (float)$tx->amount;
        }

        // Fetch all settlement statuses for these dates
        $settlementDates = [];
        foreach ($grouped as $sName => $terms) {
            foreach ($terms as $tName => $months) {
                foreach ($months as $mName => $days) {
                    foreach ($days as $date => $entry) {
                        $settlementDates[] = $date;
                    }
                }
            }
        }

        $dbSettlements = DailySettlement::where('institution_id', $institutionId)
            ->whereIn('settlement_date', array_unique($settlementDates))
            ->with(['disbursedBy'])
            ->get()
            ->keyBy(function ($item) {
                return $item->settlement_date->format('Y-m-d');
            });

        // Final enrichment with status labels
        foreach ($grouped as $sName => &$terms) {
            foreach ($terms as $tName => &$months) {
                foreach ($months as $mName => &$days) {
                    // Sort days within a month descending
                    krsort($days);
                    
                    foreach ($days as $date => &$entry) {
                        $dbSettlement = $dbSettlements[$date] ?? null;
                        
                        $status = 'ready_for_split';
                        if (Carbon::parse($date)->isToday()) {
                            $status = 'awaiting_bank_settlement';
                        } elseif ($dbSettlement && $dbSettlement->status === 'disbursed') {
                            $status = 'disbursed';
                        }

                        $entry['status'] = $status;
                        $entry['disbursed_at'] = $dbSettlement?->disbursed_at;
                        $entry['disbursed_by'] = $dbSettlement?->disbursedBy?->name;
                    }
                }
            }
        }

        // Calculate Global Statistics for Disbursed Settlements
        $stats = [
            'total_collected' => 0,
            'total_zenith' => 0,
            'total_keystone' => 0,
            'total_it' => 0,
        ];

        $disbursedSettlements = DailySettlement::where('institution_id', $institutionId)
            ->where('status', 'disbursed')
            ->get();

        foreach ($disbursedSettlements as $s) {
            $stats['total_collected'] += (float)$s->total_collected;
            $breakdown = $s->split_breakdown;
            
            if (isset($breakdown['payouts'])) {
                foreach ($breakdown['payouts'] as $payout) {
                    $bank = strtolower($payout['bank_name'] ?? '');
                    if (strpos($bank, 'zenith') !== false) {
                        $stats['total_zenith'] += (float)$payout['amount'];
                    } elseif (strpos($bank, 'keystone') !== false) {
                        $stats['total_keystone'] += (float)$payout['amount'];
                    }
                }
            }
            
            if (isset($breakdown['remainder'])) {
                $stats['total_it'] += (float)($breakdown['remainder']['amount'] ?? 0);
            }
        }

        return Inertia::render('Business/Settlements', [
            'groupedSettlements' => $grouped,
            'stats' => $stats
        ]);
    }

    public function show($date, Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        
        // Get all success transactions for this date
        $transactions = Transaction::where('institution_id', $institutionId)
            ->whereDate('paid_at', $date)
            ->where('status', 'success')
            ->with(['student', 'fee'])
            ->get();

        $totalCollected = $transactions->sum('amount');
        
        // Pre-load all unique fees referenced by these transactions to avoid N+1
        $feeIds = $transactions->pluck('fee_id')->filter()->unique()->values()->toArray();
        $feesMap = Fee::whereIn('id', $feeIds)->get()->keyBy('id');
        
        // Calculate splits across all these transactions
        $payouts = [];
        $totalAllocated = 0;

        foreach ($transactions as $tx) {
            // Priority: fee_id column, then metadata['fee_id'], then search by title
            $feeId = $tx->fee_id;
            $metadata = is_array($tx->metadata) ? $tx->metadata : json_decode($tx->metadata ?? '{}', true);
            
            if (!$feeId) {
                $feeId = $metadata['fee_id'] ?? null;
            }

            // Final fallback: try to resolve by title from metadata if still null
            if (!$feeId) {
                $feeTitle = $metadata['fee_title'] ?? ($metadata['fees'][0] ?? null);
                if ($feeTitle) {
                    $resolvedFee = Fee::where('institution_id', $institutionId)
                        ->where('title', $feeTitle)
                        ->first();
                    $feeId = $resolvedFee?->id;
                }
            }

            // Determine IT maintenance fee for this transaction
            // First try the already-loaded $tx->fee relationship, then fallback to DB
            $feeRecord = $tx->fee ?? ($feeId ? ($feesMap[$feeId] ?? Fee::find($feeId)) : null);
            $itFeeForTx = $feeRecord && $feeRecord->it_fee !== null
                ? (float)$feeRecord->it_fee
                : 100;

            // Deduct only the IT Maintenance fee (Paystack fee is lumped into IT fee)
            $txAmount = (float)$tx->amount;
            $totalFeesForTx = 0;
            if ($tx->channel !== 'manual') {
                $totalFeesForTx = $itFeeForTx;
            }
            
            if ($feeId) {
                // Find fee beneficiaries
                $beneficiaries = FeeBeneficiary::where('fee_id', $feeId)->get();
                
                if ($beneficiaries->isNotEmpty()) {
                    // Identify the "lesser" beneficiary (lowest amount) to bear the fees
                    $lesserBen = $beneficiaries->sortBy('amount')->first();
                    $totalBenAmount = $beneficiaries->sum('amount');
                    $isPartial = $txAmount < $totalBenAmount;

                    foreach ($beneficiaries as $ben) {
                        $bankKey = "{$ben->bank_name}-{$ben->account_number}";
                        if (!isset($payouts[$bankKey])) {
                            $payouts[$bankKey] = [
                                'account_name' => $ben->account_name,
                                'account_number' => $ben->account_number,
                                'bank_name' => $ben->bank_name,
                                'amount' => 0
                            ];
                        }
                        
                        if ($isPartial) {
                            $grossShare = $totalBenAmount > 0 
                                ? ($ben->amount / $totalBenAmount) * $txAmount 
                                : 0;
                        } else {
                            $grossShare = (float)$ben->amount;
                        }

                        // Deduct fees strictly from the lesser beneficiary's share
                        if ($ben->id === $lesserBen->id) {
                            $netShare = max(0, $grossShare - $totalFeesForTx);
                        } else {
                            $netShare = $grossShare;
                        }

                        $payouts[$bankKey]['amount'] += $netShare;
                        $totalAllocated += $netShare;
                    }
                }
            }
        }

        $remainder = $totalCollected - $totalAllocated;

        return response()->json([
            'date' => $date,
            'total_collected' => $totalCollected,
            'transactions' => $transactions->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'student_name' => $tx->student ? $tx->student->name : 'External Payee',
                    'amount' => $tx->amount,
                    'paid_at' => $tx->paid_at
                ];
            }),
            'payouts' => array_values($payouts),
            'remainder' => [
                'label' => 'IT Maintenance',
                'amount' => $remainder
            ]
        ]);
    }

    public function markAsDisbursed(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'total_collected' => 'required|numeric',
            'split_breakdown' => 'nullable|array'
        ]);

        $institutionId = auth()->user()->institution_id;
        
        DailySettlement::updateOrCreate(
            ['institution_id' => $institutionId, 'settlement_date' => $request->date],
            [
                'total_collected' => $request->total_collected,
                'status' => 'disbursed',
                'disbursed_at' => now(),
                'disbursed_by' => auth()->id(),
                'split_breakdown' => $request->split_breakdown
            ]
        );

        return redirect()->back()->with('success', 'Batch marked as disbursed successfully.');
    }
}
