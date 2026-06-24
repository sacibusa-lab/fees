<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    protected $fillable = ['institution_id', 'bank_name', 'bank_code', 'account_number', 'account_name', 'sub_account_code', 'is_active'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
