<?php

namespace App\Http\Controllers;

use App\Models\Fee;
use App\Models\BankAccount;
use App\Services\Payment\PaystackProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class FeeController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;
        $fees = Fee::with(['beneficiaries', 'overrides.schoolClass'])
            ->where('institution_id', $institutionId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($fee) {
                return [
                    'id' => $fee->id,
                    'title' => $fee->title,
                    'revenueCode' => $fee->revenue_code,
                    'cycle' => ucwords(str_replace('-', ' ', $fee->cycle)),
                    'type' => ucfirst($fee->type),
                    'payeeAllowed' => ucfirst($fee->payee_allowed),
                    'amount' => $fee->amount > 0 ? '₦' . number_format($fee->amount) : 'N/A',
                    'raw_amount' => $fee->amount,
                    'chargeBear' => ucfirst($fee->charge_bearer),
                    'status' => ucfirst($fee->status),
                    'beneficiaries' => $fee->beneficiaries,
                    'overrides' => $fee->overrides->map(function($o) {
                        return [
                            'class_id' => $o->class_id,
                            'class_name' => $o->schoolClass->name ?? 'Unknown Class',
                            'amount' => $o->amount,
                            'status' => $o->status,
                        ];
                    })
                ];
            });
            
        $accounts = BankAccount::where('institution_id', $institutionId)->get();
        $classes = \App\Models\SchoolClass::where('institution_id', $institutionId)->get();

        return Inertia::render('FeesManagement', [
            'fees' => $fees,
            'feeCount' => $fees->count(),
            'bankAccounts' => $accounts,
            'classes' => $classes
        ]);
    }

    public function store(Request $request)
    {
        // ... (Keep existing store logic)
        $institutionId = auth()->user()->institution_id;
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'revenue_code' => 'required|string|max:255',
            'cycle' => 'required|in:termly,annually,one-time',
            'type' => 'required|in:compulsory,optional',
            'payee_allowed' => 'required|in:students,all',
            'amount' => 'required|numeric',
            'class_id' => 'nullable|exists:classes,id', // Added class targeting
            'first_term_amount' => 'nullable|numeric',
            'second_term_amount' => 'nullable|numeric',
            'third_term_amount' => 'nullable|numeric',
            'first_term_active' => 'nullable|boolean',
            'second_term_active' => 'nullable|boolean',
            'third_term_active' => 'nullable|boolean',
            'charge_bearer' => 'required|in:self,institution',
            'status' => 'required|in:active,inactive',
        ]);

        $currentSession = \App\Models\Session::where('institution_id', $institutionId)
            ->where('is_current', true)
            ->first();

        Fee::create([
            'institution_id' => $institutionId,
            'session_id' => $currentSession ? $currentSession->id : null,
            ...$validated
        ]);

        return redirect()->back()->with('success', 'Fee created successfully');
    }

    public function show(Fee $fee)
    {
        $fee->load(['beneficiaries', 'overrides.schoolClass']);
        $institutionId = auth()->user()->institution_id;
        $accounts = BankAccount::where('institution_id', $institutionId)->get();
        $classes = \App\Models\SchoolClass::where('institution_id', $institutionId)->get();

        return Inertia::render('FeeDetails', [
            'fee' => [
                'id' => $fee->id,
                'title' => $fee->title,
                'revenueCode' => $fee->revenue_code,
                'revenue_code' => $fee->revenue_code,
                'cycle' => ucwords(str_replace('-', ' ', $fee->cycle)),
                'type' => ucfirst($fee->type),
                'payeeAllowed' => ucfirst($fee->payee_allowed),
                'payee_allowed' => $fee->payee_allowed,
                'amount' => '₦' . number_format($fee->amount),
                'raw_amount' => $fee->amount,
                'first_term_amount' => $fee->first_term_amount,
                'second_term_amount' => $fee->second_term_amount,
                'third_term_amount' => $fee->third_term_amount,
                'first_term_active' => $fee->first_term_active,
                'second_term_active' => $fee->second_term_active,
                'third_term_active' => $fee->third_term_active,
                'chargeBear' => ucfirst($fee->charge_bearer),
                'charge_bearer' => $fee->charge_bearer,
                'status' => ucfirst($fee->status),
                'beneficiaries' => $fee->beneficiaries,
                'created_at' => $fee->created_at->format('M d, Y'),
                'overrides' => $fee->overrides->map(function($o) {
                    return [
                        'class_id' => $o->class_id,
                        'class_name' => $o->schoolClass->name ?? 'Unknown Class',
                        'amount' => $o->amount,
                        'status' => $o->status,
                    ];
                })
            ],
            'bankAccounts' => $accounts,
            'classes' => $classes
        ]);
    }

    public function update(Request $request, Fee $fee)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'revenue_code' => 'required|string|max:255',
            'cycle' => 'required|in:termly,annually,one-time',
            'type' => 'required|in:compulsory,optional',
            'payee_allowed' => 'required|in:students,all',
            'amount' => 'required|numeric',
            'class_id' => 'nullable|exists:classes,id',
            'first_term_amount' => 'nullable|numeric',
            'second_term_amount' => 'nullable|numeric',
            'third_term_amount' => 'nullable|numeric',
            'first_term_active' => 'nullable|boolean',
            'second_term_active' => 'nullable|boolean',
            'third_term_active' => 'nullable|boolean',
            'charge_bearer' => 'required|in:self,institution',
            'status' => 'required|in:active,inactive',
        ]);

        $fee->update($validated);

        return redirect()->back()->with('success', 'Fee updated successfully');
    }

    public function destroy(Fee $fee)
    {
        $fee->delete();
        return redirect()->back()->with('success', 'Fee deleted successfully');
    }

    public function toggleStatus(Fee $fee)
    {
        $newStatus = $fee->status === 'active' ? 'inactive' : 'active';
        $fee->update(['status' => $newStatus]);
        
        return redirect()->back()->with('success', 'Fee status updated');
    }

    public function manageBeneficiaries(Request $request, Fee $fee)
    {
        $request->validate([
            'beneficiaries' => 'required|array',
            'beneficiaries.*.account_name' => 'required|string',
            'beneficiaries.*.account_number' => 'required|string',
            'beneficiaries.*.bank_name' => 'required|string',
            'beneficiaries.*.bank_code' => 'required|string', // Added bank_code
            'beneficiaries.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        $institutionId = auth()->user()->institution_id;
        
        // 1. Save beneficiaries to DB
        $fee->beneficiaries()->delete();
        $totalPercentage = 0;
        
        foreach ($request->beneficiaries as $ben) {
            $fee->beneficiaries()->create($ben);
            $totalPercentage += $ben['percentage'];
        }

        // 2. Sync with Paystack Split Group
        if ($totalPercentage > 0) {
            $paystack = app(PaystackProvider::class);
            
            $subaccounts = [];
            foreach ($request->beneficiaries as $ben) {
                // We need the subaccount_code. If not present (legacy or new manual entry), 
                // we should either find it or create it.
                // For simplicity, let's assume the user picks from existing BankAccounts that have subaccount_code
                $account = BankAccount::where('institution_id', $institutionId)
                    ->where('account_number', $ben['account_number'])
                    ->first();
                
                if ($account && $account->sub_account_code) {
                    $subaccounts[] = [
                        'subaccount' => $account->sub_account_code,
                        'share' => $ben['percentage']
                    ];
                }
            }

            // If some percentage is left over, it goes to the institution's main account
            // Paystack Split Groups automatically send the residue to the integration account 
            // OR we can explicitly add a subaccount for the residue.
            
            if (!empty($subaccounts)) {
                if ($fee->paystack_split_code) {
                    // Update: Paystack Split Groups don't support direct subaccount updates via 'update' endpoint 
                    // in a way that replaces everything easily. 
                    // Usually we might need to recreate or carefully add/remove.
                    // For now, let's create a new one to ensure consistency or use a "sync" logic if implemented.
                    // Re-creating is safer for "instant" automation.
                }

                // Determine bearer_type from fee's charge_bearer
                $bearerType = $fee->charge_bearer === 'institution' ? 'integration' : 'account';

                $splitData = [
                    'name' => "Fee Split: " . $fee->title,
                    'subaccounts' => $subaccounts,
                    'bearer_type' => $bearerType,
                ];

                $result = $paystack->createSplitGroup($splitData);

                if ($result['status']) {
                    $fee->update(['paystack_split_code' => $result['split_code']]);
                } else {
                    Log::error("Failed to create Paystack split group", ['error' => $result['message']]);
                    return redirect()->back()->with('error', 'Beneficiaries saved, but Paystack sync failed: ' . $result['message']);
                }
            }
        }

        return redirect()->back()->with('success', 'Beneficiaries updated and synced with Paystack');
    }

    public function manageOverrides(Request $request, Fee $fee)
    {
        $request->validate([
            'overrides' => 'nullable|array', // Allow empty array to delete all overrides
            'overrides.*.class_id' => 'required|exists:classes,id',
            'overrides.*.amount' => 'required|numeric|min:0',
            'overrides.*.status' => 'required|in:active,inactive',
        ]);

        // Delete all existing overrides
        $fee->overrides()->delete();
        
        // Create new overrides if any are provided
        if ($request->has('overrides') && is_array($request->overrides)) {
            foreach ($request->overrides as $override) {
                $fee->overrides()->create($override);
            }
        }

        return redirect()->back()->with('success', 'Class-specific amounts updated successfully');
    }
}
