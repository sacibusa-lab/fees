<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolClass extends Model
{
    protected $table = 'classes';
    protected $fillable = ['institution_id', 'class_category_id', 'name'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ClassCategory::class, 'class_category_id');
    }

    public function subClasses(): HasMany
    {
        return $this->hasMany(SubClass::class, 'class_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
