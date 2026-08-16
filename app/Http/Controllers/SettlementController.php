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

        // All sessions for the institution
        $sessions = Session::where('institution_id', $institutionId)->orderBy('id')->get();

        // The active / current session (fall back to the first session)
        $activeSession = $sessions->where('is_current', true)->first() ?? $sessions->first();
        $activeSessionId = $activeSession?->id;

        // Selected session (defaults to the active/current session)
        $selectedSessionId = $request->integer('session', $activeSessionId);
        $selectedSession = $sessions->where('id', $selectedSessionId)->first() ?? $activeSession;
        $selectedSessionId = $selectedSession?->id;
        $selectedSessionName = $selectedSession?->name ?? 'General';

        // Successful transactions belonging to the selected session
        $transactions = Transaction::where('institution_id', $institutionId)
            ->where('status', 'success')
            ->orderBy('paid_at', 'desc')
            ->get()
            ->filter(function ($tx) use ($selectedSessionId) {
                return ($tx->metadata['session_id'] ?? null) == $selectedSessionId;
            })
            ->values();

        $grouped = [];

        foreach ($transactions as $tx) {
            $term = $tx->metadata['term'] ?? 'Other Term';
            $date = $tx->paid_at->format('Y-m-d');
            $month = $tx->paid_at->format('F Y');

            if (!isset($grouped[$selectedSessionName][$term])) $grouped[$selectedSessionName][$term] = [];
            if (!isset($grouped[$selectedSessionName][$term][$month])) $grouped[$selectedSessionName][$term][$month] = [];
            if (!isset($grouped[$selectedSessionName][$term][$month][$date])) {
                $grouped[$selectedSessionName][$term][$month][$date] = [
                    'date' => $date,
                    'total_collected' => 0,
                    'status' => 'ready_for_split',
                    'disbursed_at' => null,
                    'disbursed_by' => null
                ];
            }

            $grouped[$selectedSessionName][$term][$month][$date]['total_collected'] += (float)$tx->amount;
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

        // Pre-load fees + beneficiaries referenced by the session's transactions
        // so the split computation below runs without per-transaction queries.
        $feeIds = [];
        foreach ($transactions as $tx) {
            if ($tx->fee_id) {
                $feeIds[] = $tx->fee_id;
            }
            $meta = is_array($tx->metadata) ? $tx->metadata : json_decode($tx->metadata ?? '{}', true);
            if (!empty($meta['fee_id'])) {
                $feeIds[] = $meta['fee_id'];
            }
        }
        $feeIds = array_values(array_unique(array_filter($feeIds)));

        $feesMap = Fee::whereIn('id', $feeIds)->get()->keyBy('id');
        $beneficiariesByFee = FeeBeneficiary::whereIn('fee_id', $feeIds)
            ->get()
            ->groupBy('fee_id');

        // Per-term and overall-session statistics computed from ALL successful
        // collections in the selected session (not just disbursed), so the active
        // session shows its cards even before batches are marked as disbursed.
        $termStats = [];
        $sessionStats = [
            $selectedSessionName => [
                'total_collected' => 0,
                'total_zenith' => 0,
                'total_keystone' => 0,
                'total_it' => 0,
            ],
        ];

        $transactionsByTerm = $transactions->groupBy(function ($tx) {
            return $tx->metadata['term'] ?? 'Other Term';
        });

        foreach ($transactionsByTerm as $term => $termTxs) {
            $split = $this->computeSplitForTransactions($institutionId, $termTxs, $feesMap, $beneficiariesByFee);

            $termStats[$selectedSessionName][$term] = [
                'total_collected' => $split['total_collected'],
                'total_zenith' => $split['total_zenith'],
                'total_keystone' => $split['total_keystone'],
                'total_it' => $split['total_it'],
            ];

            $sessionStats[$selectedSessionName]['total_collected'] += $split['total_collected'];
            $sessionStats[$selectedSessionName]['total_zenith'] += $split['total_zenith'];
            $sessionStats[$selectedSessionName]['total_keystone'] += $split['total_keystone'];
            $sessionStats[$selectedSessionName]['total_it'] += $split['total_it'];
        }

        return Inertia::render('Business/Settlements', [
            'groupedSettlements' => $grouped,
            'termStats' => $termStats,
            'sessionStats' => $sessionStats,
            'sessions' => $sessions->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'is_current' => $s->is_current,
                ];
            })->values()->all(),
            'selectedSessionId' => $selectedSessionId,
        ]);
    }

    /**
     * Compute the expected split (Zenith / Keystone / IT remainder) for a set of
     * successful transactions, mirroring the logic used when a daily batch is
     * disbursed. Pre-loaded fees/beneficiaries are passed in to avoid N+1 queries.
     */
    private function computeSplitForTransactions($institutionId, $transactions, $feesMap, $beneficiariesByFee)
    {
        $totalCollected = 0;
        $payouts = [];
        $totalAllocated = 0;

        foreach ($transactions as $tx) {
            $totalCollected += (float)$tx->amount;

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
                    if ($resolvedFee && !$feesMap->has($feeId)) {
                        $feesMap->put($feeId, $resolvedFee);
                        $beneficiariesByFee[$feeId] = FeeBeneficiary::where('fee_id', $feeId)->get();
                    }
                }
            }

            if (!$feeId) {
                continue;
            }

            // Determine IT maintenance fee for this transaction
            $feeRecord = $tx->fee ?? $feesMap->get($feeId);
            $itFeeForTx = $feeRecord && $feeRecord->it_fee !== null
                ? (float)$feeRecord->it_fee
                : 100;

            $txAmount = (float)$tx->amount;
            $totalFeesForTx = 0;
            if ($tx->channel !== 'manual') {
                $totalFeesForTx = $itFeeForTx;
            }

            $beneficiaries = $beneficiariesByFee[$feeId] ?? collect();

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
                            'amount' => 0,
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

        // Extract Zenith / Keystone / IT amounts
        $totalZenith = 0;
        $totalKeystone = 0;
        foreach ($payouts as $payout) {
            $bank = strtolower($payout['bank_name'] ?? '');
            if (strpos($bank, 'zenith') !== false) {
                $totalZenith += (float)$payout['amount'];
            } elseif (strpos($bank, 'keystone') !== false) {
                $totalKeystone += (float)$payout['amount'];
            }
        }

        return [
            'total_collected' => $totalCollected,
            'total_zenith' => $totalZenith,
            'total_keystone' => $totalKeystone,
            'total_it' => max(0, $totalCollected - $totalAllocated),
        ];
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
