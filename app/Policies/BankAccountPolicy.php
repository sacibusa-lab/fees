<?php

namespace App\Policies;

use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BankAccountPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BankAccount $bankAccount): bool
    {
        return $user->institution_id === $bankAccount->institution_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, BankAccount $bankAccount): bool
    {
        return $user->institution_id === $bankAccount->institution_id;
    }

    public function delete(User $user, BankAccount $bankAccount): bool
    {
        return $user->institution_id === $bankAccount->institution_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, BankAccount $bankAccount): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, BankAccount $bankAccount): bool
    {
        return false;
    }
}
