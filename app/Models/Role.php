<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'is_super_admin'];

    protected $casts = [
        'is_super_admin' => 'boolean',
    ];

    /**
     * Users assigned to this role.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Permissions granted to this role.
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class);
    }
}
