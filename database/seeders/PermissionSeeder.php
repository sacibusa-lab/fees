<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'group_name' => 'Dashboard'],
            
            // Admin Care
            ['name' => 'View Admins', 'group_name' => 'Admin Care'],
            ['name' => 'Create Admin', 'group_name' => 'Admin Care'],
            ['name' => 'Edit Admin', 'group_name' => 'Admin Care'],
            ['name' => 'Delete Admin', 'group_name' => 'Admin Care'],
            ['name' => 'Manage Roles', 'group_name' => 'Admin Care'],
            ['name' => 'Manage Permissions', 'group_name' => 'Admin Care'],

            // Students
            ['name' => 'View Students', 'group_name' => 'Students'],
            ['name' => 'Create Student', 'group_name' => 'Students'],
            ['name' => 'Edit Student', 'group_name' => 'Students'],
            ['name' => 'Delete Student', 'group_name' => 'Students'],

            // Fees
            ['name' => 'View Fees', 'group_name' => 'Fees'],
            ['name' => 'Create Fee', 'group_name' => 'Fees'],
            ['name' => 'Manage Fee Types', 'group_name' => 'Fees'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                [
                    'slug' => \Illuminate\Support\Str::slug($permission['name']),
                    'group_name' => $permission['group_name']
                ]
            );
        }
    }
}
