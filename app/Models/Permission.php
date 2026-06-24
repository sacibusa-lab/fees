<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = ['name', 'slug', 'group_name'];

    /**
     * Roles that have this permission.
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}
