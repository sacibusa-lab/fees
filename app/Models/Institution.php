<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    protected $fillable = [
        'name', 'portal_id', 'logo', 'favicon', 'address', 'phone', 'email', 'status',
        'primary_color', 'sidebar_color', 'secondary_color'
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function virtualAccounts(): HasMany
    {
        return $this->hasMany(StudentVirtualAccount::class);
    }
}
