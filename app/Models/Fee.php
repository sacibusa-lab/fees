<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    protected $fillable = [
        'institution_id', 'session_id', 'class_id', 'title', 'revenue_code', 
        'cycle', 'type', 'payee_allowed', 'amount', 'charge_bearer', 'paystack_split_code', 'status',
        'first_term_amount', 'second_term_amount', 'third_term_amount',
        'first_term_active', 'second_term_active', 'third_term_active'
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

    public function overrides()
    {
        return $this->hasMany(FeeClassOverride::class);
    }

    /**
     * Get the appropriate amount for a given term.
     * Falls back to default amount if term-specific amount is not set.
     */
    public function getAmountForTerm($term)
    {
        $term = strtolower($term);
        $termColumn = null;
        if (str_contains($term, 'first') || str_contains($term, '1st')) $termColumn = 'first_term_amount';
        if (str_contains($term, 'second') || str_contains($term, '2nd')) $termColumn = 'second_term_amount';
        if (str_contains($term, 'third') || str_contains($term, '3rd')) $termColumn = 'third_term_amount';

        if ($termColumn && $this->$termColumn !== null) {
            return $this->$termColumn;
        }

        return $this->amount;
    }

    /**
     * Check if fee is active for a given term.
     */
    public function isActiveForTerm($term)
    {
        $term = strtolower($term);
        $termColumn = null;
        if (str_contains($term, 'first') || str_contains($term, '1st')) $termColumn = 'first_term_active';
        if (str_contains($term, 'second') || str_contains($term, '2nd')) $termColumn = 'second_term_active';
        if (str_contains($term, 'third') || str_contains($term, '3rd')) $termColumn = 'third_term_active';

        if ($termColumn) {
            return (bool)$this->$termColumn;
        }

        return true; // Default to active if term not recognized
    }
}
