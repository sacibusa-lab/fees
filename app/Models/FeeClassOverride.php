<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeeClassOverride extends Model
{
    protected $fillable = ['fee_id', 'class_id', 'amount', 'status'];

    public function fee(): BelongsTo
    {
        return $this->belongsTo(Fee::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }
}
