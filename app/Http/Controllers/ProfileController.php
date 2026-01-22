<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

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
            // Add other fields if necessary
        ]);

        if ($institution) {
            $institution->update([
                'name' => $validated['institution_name']
            ]);
        }
        
        // Optionally update user details if requested
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email']
        ]);

        return back()->with('success', 'Profile updated successfully.');
    }
}
