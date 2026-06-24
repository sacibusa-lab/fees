<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    protected $fillable = [
        'institution_id', 'event_type', 'reference', 'payload', 
        'status', 'error_message', 'processed_at'
    ];

    protected $casts = [
        'payload' => 'array',
        'processed_at' => 'datetime'
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
