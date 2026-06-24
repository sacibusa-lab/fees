<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSummary extends Model
{
    protected $fillable = [
        'institution_id', 'session_id', 'fee_id', 'reserved', 'expected',
        'total_received', 'debt', 'discount_applied', 'extra_applied', 'completed_count'
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function fee()
    {
        return $this->belongsTo(Fee::class);
    }
}
