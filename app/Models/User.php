<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'pin',
        'status',
        'role_id',
        'password',
        'avatar',
        'institution_id',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function assignedRole()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Check if the user has a specific permission by slug.
     * Super admin roles bypass all checks.
     */
    public function hasPermission(string $slug): bool
    {
        $role = $this->relationLoaded('assignedRole')
            ? $this->assignedRole
            : $this->assignedRole()->first();

        if (!$role) {
            return false;
        }

        // Super admin bypasses all checks
        if ($role->is_super_admin) {
            return true;
        }

        $permissions = $role->relationLoaded('permissions')
            ? $role->permissions
            : $role->permissions()->get();

        return $permissions->pluck('slug')->contains($slug);
    }

    /**
     * Return all permission slugs for the user's role.
     */
    public function getPermissionSlugs(): array
    {
        $role = $this->relationLoaded('assignedRole')
            ? $this->assignedRole
            : $this->assignedRole()->with('permissions')->first();

        if (!$role) {
            return [];
        }

        // Super admin has all permissions
        if ($role->is_super_admin) {
            return \App\Models\Permission::pluck('slug')->toArray();
        }

        $permissions = $role->relationLoaded('permissions')
            ? $role->permissions
            : $role->permissions()->get();

        return $permissions->pluck('slug')->toArray();
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
