<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeBeneficiary extends Model
{
    protected $fillable = ['fee_id', 'account_name', 'account_number', 'bank_name', 'bank_code', 'percentage'];

    public function fee()
    {
        return $this->belongsTo(Fee::class);
    }
}
