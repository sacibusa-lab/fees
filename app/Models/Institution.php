<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    protected $fillable = ['name', 'portal_id', 'logo', 'address', 'phone', 'email', 'status'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }
}
