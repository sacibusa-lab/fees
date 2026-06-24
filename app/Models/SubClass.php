<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubClass extends Model
{
    protected $fillable = ['institution_id', 'class_id', 'name'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }
}
