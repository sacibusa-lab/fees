<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailySettlement extends Model
{
    protected $fillable = [
        'institution_id',
        'settlement_date',
        'total_collected',
        'status',
        'disbursed_at',
        'disbursed_by',
        'split_breakdown'
    ];

    protected $casts = [
        'settlement_date' => 'date',
        'disbursed_at' => 'datetime',
        'split_breakdown' => 'json'
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function disbursedBy()
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }
}
