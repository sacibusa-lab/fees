<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    protected $fillable = ['institution_id', 'class_id', 'sub_class_id', 'admission_number', 'name', 'gender', 'payment_status', 'avatar'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subClass(): BelongsTo
    {
        return $this->belongsTo(SubClass::class, 'sub_class_id');
    }
}
