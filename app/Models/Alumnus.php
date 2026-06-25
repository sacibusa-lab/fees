<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alumnus extends Model
{
    protected $table = 'alumni';

    protected $fillable = [
        'institution_id',
        'original_student_id',
        'last_class_id',
        'admission_number',
        'name',
        'gender',
        'email',
        'phone',
        'graduation_year',
        'graduation_term',
        'graduated_at',
        'notes',
    ];

    protected $casts = [
        'graduated_at' => 'datetime',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function lastClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'last_class_id');
    }
}
