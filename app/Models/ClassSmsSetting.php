<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassSmsSetting extends Model
{
    protected $fillable = [
        'institution_id',
        'class_id',
        'sub_class_id',
        'sms_enabled',
    ];

    protected $casts = [
        'sms_enabled' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subClass()
    {
        return $this->belongsTo(SubClass::class, 'sub_class_id');
    }

    /**
     * Check if SMS is enabled for a given class and optional sub-class
     */
    public static function isEnabledFor($institutionId, $classId, $subClassId = null): bool
    {
        // Check class-level setting first
        $classSetting = static::where('institution_id', $institutionId)
            ->where('class_id', $classId)
            ->whereNull('sub_class_id')
            ->first();

        if ($classSetting && !$classSetting->sms_enabled) {
            return false;
        }

        // Check sub-class level setting if applicable
        if ($subClassId) {
            $subClassSetting = static::where('institution_id', $institutionId)
                ->where('class_id', $classId)
                ->where('sub_class_id', $subClassId)
                ->first();

            if ($subClassSetting) {
                return $subClassSetting->sms_enabled;
            }
        }

        return true; // Default to enabled if no setting exists
    }
}
