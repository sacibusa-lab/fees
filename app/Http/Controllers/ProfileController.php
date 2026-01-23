<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function edit()
    {
        return Inertia::render('Profile', [
            'user' => Auth::user()->load('institution'),
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();
        $institution = $user->institution;

        $validated = $request->validate([
            'institution_name' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'logo' => 'nullable|image|max:2048', // 2MB max
            'avatar' => 'nullable|image|max:2048',
        ]);

        if ($institution) {
            $institutionData = [
                'name' => $validated['institution_name']
            ];

            if ($request->hasFile('logo')) {
                // Delete old logo if it exists
                if ($institution->logo) {
                    Storage::disk('public')->delete($institution->logo);
                }
                $path = $request->file('logo')->store('logos', 'public');
                $institutionData['logo'] = $path;
            }

            $institution->update($institutionData);
        }
        
        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email']
        ];

        if ($request->hasFile('avatar')) {
            // Delete old avatar if it exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $userData['avatar'] = $path;
        }

        $user->update($userData);

        return back()->with('success', 'Profile updated successfully.');
    }
}
