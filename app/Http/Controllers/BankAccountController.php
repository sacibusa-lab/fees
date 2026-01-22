<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Services\Payment\PaystackProvider;

class BankAccountController extends Controller
{
    protected $paystack;

    public function __construct(PaystackProvider $paystack)
    {
        $this->paystack = $paystack;
    }

    public function index()
    {
        $institutionId = auth()->user()->institution_id;
        $accounts = BankAccount::where('institution_id', $institutionId)
            ->get();
        
        // Pass banks list for the modal
        $banks = $this->paystack->getBanks();

        return Inertia::render('Business/BankAccounts', [
            'accounts' => $accounts,
            'banks' => $banks
        ]);
    }

    public function validateAccount(Request $request)
    {
        $request->validate([
            'account_number' => 'required|string',
            'bank_code' => 'required|string',
        ]);

        $result = $this->paystack->resolveAccountNumber(
            $request->account_number, 
            $request->bank_code
        );

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        $user = auth()->user();

        $validated = $request->validate([
            'bank_name' => 'required|string',
            'bank_code' => 'required|string', // Needed for subaccount creation
            'account_number' => 'required|string',
            'account_name' => 'required|string',
            'type' => 'required|string|in:Main,Sub Account', // Defaulting to 'Sub Account' usually
        ]);

        // If it's a subaccount, create it on Paystack first
        $subAccountCode = null;
        if ($validated['type'] === 'Sub Account') {
            $subAccountResult = $this->paystack->createSubAccount([
                'business_name' => $validated['account_name'], // Or specific business name
                'settlement_bank' => $validated['bank_code'],
                'account_number' => $validated['account_number'],
                'percentage_charge' => 0 // Default
            ]);

            if (!$subAccountResult['status']) {
                return back()->withErrors(['error' => 'Failed to create Paystack Subaccount: ' . $subAccountResult['message']]);
            }

            $subAccountCode = $subAccountResult['subaccount_code'];
        }

        BankAccount::create([
            'institution_id' => $institutionId,
            'bank_name' => $validated['bank_name'],
            'bank_code' => $validated['bank_code'],
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'sub_account_code' => $subAccountCode,
            'is_active' => true
        ]);

        return redirect()->back()->with('success', 'Bank account added successfully');
    }

    public function update(Request $request, BankAccount $bankAccount)
    {
        // ... (Keep existing update logic or minimal updates)
        return redirect()->back()->with('success', 'Update logic not fully implemented yet');
    }

    public function destroy(BankAccount $bankAccount)
    {
        $this->authorize('delete', $bankAccount);
        $bankAccount->delete();

        return redirect()->back()->with('success', 'Bank account deleted successfully');
    }
}
