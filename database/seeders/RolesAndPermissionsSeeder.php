<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Str;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ----------------------------------------------------------------
        // 1. Define all permissions grouped by module
        // ----------------------------------------------------------------
        $permissions = [
            'Dashboard' => [
                ['name' => 'View Dashboard', 'slug' => 'dashboard.view'],
            ],
            'Students' => [
                ['name' => 'View Students',   'slug' => 'students.view'],
                ['name' => 'Manage Students', 'slug' => 'students.manage'],
            ],
            'Fees' => [
                ['name' => 'View Fees',   'slug' => 'fees.view'],
                ['name' => 'Manage Fees', 'slug' => 'fees.manage'],
            ],
            'Payments' => [
                ['name' => 'View Payments',   'slug' => 'payments.view'],
                ['name' => 'Manage Payments', 'slug' => 'payments.manage'],
            ],
            'Settlements' => [
                ['name' => 'View Settlements', 'slug' => 'settlements.view'],
            ],
            'Academic Sessions' => [
                ['name' => 'View Sessions',   'slug' => 'sessions.view'],
                ['name' => 'Manage Sessions', 'slug' => 'sessions.manage'],
            ],
            'Business' => [
                ['name' => 'View Bank Accounts',   'slug' => 'business.view'],
                ['name' => 'Manage Bank Accounts', 'slug' => 'business.manage'],
            ],
            'Settings' => [
                ['name' => 'View Settings', 'slug' => 'settings.view'],
            ],
            'Admin Care' => [
                ['name' => 'Manage Admins', 'slug' => 'admin-care.manage'],
            ],
        ];

        // Upsert permissions (safe to re-run)
        $allPermissionIds = [];
        foreach ($permissions as $group => $items) {
            foreach ($items as $item) {
                $perm = Permission::updateOrCreate(
                    ['slug' => $item['slug']],
                    ['name' => $item['name'], 'group_name' => $group]
                );
                $allPermissionIds[] = $perm->id;
            }
        }

        // ----------------------------------------------------------------
        // 2. Create roles and assign permissions
        // ----------------------------------------------------------------

        // Super Admin — bypasses all checks; gets all permissions anyway for the matrix UI
        $superAdmin = Role::updateOrCreate(
            ['slug' => 'super-admin'],
            [
                'name'           => 'Super Admin',
                'description'    => 'Full system access. Bypasses all permission checks.',
                'is_super_admin' => true,
            ]
        );
        $superAdmin->permissions()->sync($allPermissionIds);

        // Finance Manager — payments, settlements, dashboard
        $financeManager = Role::updateOrCreate(
            ['slug' => 'finance-manager'],
            [
                'name'           => 'Finance Manager',
                'description'    => 'Manages payments and settlements.',
                'is_super_admin' => false,
            ]
        );
        $financeManagerSlugs = [
            'dashboard.view',
            'fees.view',
            'payments.view',
            'payments.manage',
            'settlements.view',
            'students.view',
            'sessions.view',
            'business.view',
        ];
        $financeManager->permissions()->sync(
            Permission::whereIn('slug', $financeManagerSlugs)->pluck('id')
        );

        // Student Manager — students + classes + dashboard
        $studentManager = Role::updateOrCreate(
            ['slug' => 'student-manager'],
            [
                'name'           => 'Student Manager',
                'description'    => 'Manages students and classes.',
                'is_super_admin' => false,
            ]
        );
        $studentManagerSlugs = [
            'dashboard.view',
            'students.view',
            'students.manage',
            'fees.view',
            'payments.view',
            'sessions.view',
        ];
        $studentManager->permissions()->sync(
            Permission::whereIn('slug', $studentManagerSlugs)->pluck('id')
        );

        $this->command->info('✅ Roles and permissions seeded successfully.');
        $this->command->table(
            ['Role', 'Is Super Admin', 'Permissions'],
            Role::with('permissions')->get()->map(fn($r) => [
                $r->name,
                $r->is_super_admin ? 'YES' : 'no',
                $r->permissions->pluck('slug')->implode(', '),
            ])->toArray()
        );
    }
}
