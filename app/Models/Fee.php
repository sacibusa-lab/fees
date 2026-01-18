<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    protected $fillable = [
        'institution_id', 'session_id', 'class_id', 'title', 'revenue_code', 
        'cycle', 'type', 'payee_allowed', 'amount', 'charge_bearer', 'status'
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function beneficiaries()
    {
        return $this->hasMany(FeeBeneficiary::class);
    }
}
