<?php

namespace App\Http\Controllers;

use App\Models\Fee;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\BankAccount;

class FeeController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;
        $fees = Fee::with(['beneficiaries', 'overrides'])
            ->where('institution_id', $institutionId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($fee) {
                return [
                    'id' => $fee->id,
                    'title' => $fee->title,
                    'revenueCode' => $fee->revenue_code,
                    'cycle' => ucfirst($fee->cycle),
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
            'cycle' => 'required|in:termly,annually',
            'type' => 'required|in:compulsory,optional',
            'payee_allowed' => 'required|in:students,all',
            'amount' => 'required|numeric',
            'charge_bearer' => 'required|in:self,institution',
            'status' => 'required|in:active,inactive',
        ]);

        Fee::create([
            'institution_id' => $institutionId,
            ...$validated
        ]);

        return redirect()->back()->with('success', 'Fee created successfully');
    }

    public function show(Fee $fee)
    {
        $fee->load(['beneficiaries', 'overrides']);
        $institutionId = auth()->user()->institution_id;
        $accounts = BankAccount::where('institution_id', $institutionId)->get();
        $classes = \App\Models\SchoolClass::where('institution_id', $institutionId)->get();

        return Inertia::render('FeeDetails', [
            'fee' => [
                'id' => $fee->id,
                'title' => $fee->title,
                'revenueCode' => $fee->revenue_code,
                'revenue_code' => $fee->revenue_code,
                'cycle' => ucfirst($fee->cycle),
                'type' => ucfirst($fee->type),
                'payeeAllowed' => ucfirst($fee->payee_allowed),
                'payee_allowed' => $fee->payee_allowed,
                'amount' => '₦' . number_format($fee->amount),
                'raw_amount' => $fee->amount,
                'chargeBear' => ucfirst($fee->charge_bearer),
                'charge_bearer' => $fee->charge_bearer,
                'status' => ucfirst($fee->status),
                'beneficiaries' => $fee->beneficiaries,
                'created_at' => $fee->created_at->format('M d, Y'),
                'overrides' => $fee->overrides->map(function($o) {
                    return [
                        'class_id' => $o->class_id,
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
            'cycle' => 'required|in:termly,annually',
            'type' => 'required|in:compulsory,optional',
            'payee_allowed' => 'required|in:students,all',
            'amount' => 'required|numeric',
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
            'beneficiaries.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        // Replace all beneficiaries for this fee (simple sync)
        $fee->beneficiaries()->delete();
        
        foreach ($request->beneficiaries as $ben) {
            $fee->beneficiaries()->create($ben);
        }

        return redirect()->back()->with('success', 'Beneficiaries updated successfully');
    }

    public function manageOverrides(Request $request, Fee $fee)
    {
        $request->validate([
            'overrides' => 'required|array',
            'overrides.*.class_id' => 'required|exists:classes,id',
            'overrides.*.amount' => 'required|numeric|min:0',
            'overrides.*.status' => 'required|in:active,inactive',
        ]);

        // Sync overrides
        $fee->overrides()->delete();
        
        foreach ($request->overrides as $override) {
            $fee->overrides()->create($override);
        }

        return redirect()->back()->with('success', 'Class-specific amounts updated successfully');
    }
}
