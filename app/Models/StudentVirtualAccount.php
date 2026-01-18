<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentVirtualAccount extends Model
{
    protected $fillable = [
        'student_id',
        'institution_id',
        'bank_name',
        'account_number',
        'account_name',
        'customer_code',
        'account_slug',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
