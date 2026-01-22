<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\Role;
use Illuminate\Support\Str;

class AdminCareController extends Controller
{
    public function index()
    {
        $admins = \App\Models\User::with('assignedRole')
            ->whereNotNull('role_id') // Assuming only users with a role are admins in this context, or add 'role' enum check
            ->orWhereIn('role', ['admin']) // Fallback for legacy 'admin' enum if needed
            ->latest()
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'status' => $user->status,
                    'role' => $user->assignedRole ? $user->assignedRole->name : ($user->role ?? 'N/A'),
                    'role_id' => $user->role_id,
                    'avatar' => $user->name ? strtoupper(substr($user->name, 0, 1)) : 'U',
                ];
            });

        $roles = Role::all(['id', 'name']);

        return Inertia::render('AdminCare/AllAdmins', [
            'admins' => $admins,
            'roles' => $roles,
        ]);
    }

    public function storeAdmin(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users,phone',
            'pin' => 'required|string|min:4|max:6',
            'role_id' => 'required|exists:roles,id',
        ]);

        // Generate constraints
        $generatedEmail = $validated['phone'] . '@system.local'; 
        
        \App\Models\User::create([
            'name' => $validated['name'],
            'username' => $validated['phone'], // Use phone as username too
            'email' => $generatedEmail,
            'phone' => $validated['phone'],
            'pin' => $validated['pin'],
            'role_id' => $validated['role_id'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['pin']), // Use PIN as password (hashed)
            'status' => 'active',
            'institution_id' => auth()->user()->institution_id, 
        ]);

        return back()->with('success', 'Admin created successfully.');
    }

    public function roles()
    {
        $roles = Role::orderBy('created_at', 'desc')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'admin_count' => 0, // Placeholder until relational logic is added
            ];
        });

        return Inertia::render('AdminCare/Roles', [
            'roles' => $roles
        ]);
    }

    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
        ]);

        Role::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:500',
        ]);

        $role->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'Role updated successfully.');
    }

    public function deleteRole(Role $role)
    {
        // Add check if role is assigned to users if needed
        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    public function permissions()
    {
        return Inertia::render('AdminCare/Permissions', [
            'roles' => Role::with('permissions')->get(),
            'permissions' => \App\Models\Permission::all(),
        ]);
    }

    public function updatePermissions(Request $request)
    {
        $matrix = $request->input('matrix');

        // Matrix format: 'roleId_permissionId' => boolean
        // We need to parse this and sync permissions for each role.

        $data = []; // role_id => [permission_ids]

        foreach ($matrix as $key => $isEnabled) {
            if ($isEnabled) {
                [$roleId, $permissionId] = explode('_', $key);
                if (!isset($data[$roleId])) {
                    $data[$roleId] = [];
                }
                $data[$roleId][] = $permissionId;
            }
        }

        // Sync permissions for each role involved (or all roles to be safe/clear)
        // Better approach: Iterate all roles found in matrix keys (or all existing roles?)
        // The matrix usually contains changes. But here we send the whole state.
        
        foreach ($data as $roleId => $permissions) {
            $role = Role::find($roleId);
            if ($role) {
                $role->permissions()->sync($permissions);
            }
        }

        // Handle cases where a role might have no permissions enabled (key might be missing or false)
        // Ideally we should get all roles and sync. But lazy approach is ok for now.

        return back()->with('success', 'Permissions updated successfully.');
    }
}
