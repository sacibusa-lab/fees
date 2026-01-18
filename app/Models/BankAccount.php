<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    protected $fillable = ['institution_id', 'bank_name', 'account_number', 'account_name', 'is_active'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
