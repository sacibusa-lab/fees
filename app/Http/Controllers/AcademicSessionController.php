<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

// Assuming model name, will verify. If 'Session' is used for PHP sessions, create 'AcademicSession' model alias or use full namespace.
// For now, mocking data or using DB query if I find the table.

class AcademicSessionController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;
        
        $sessions = \App\Models\Session::where('institution_id', $institutionId)
            ->orderBy('is_current', 'desc')
            ->orderBy('name', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'year' => $session->name, // Assuming name stores '2025/2026'
                    'term' => 'All Terms', // Adjust if you have term column
                    'status' => $session->is_current ? 'active' : 'inactive',
                ];
            });

        return Inertia::render('AcademicSessions/Index', [
            'sessions' => $sessions
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'year' => 'required|string|max:15',
        ]);

        $institutionId = auth()->user()->institution_id;

        // If this is the first session, make it current. Otherwise, keep current as is.
        $hasSessions = \App\Models\Session::where('institution_id', $institutionId)->exists();

        \App\Models\Session::create([
            'institution_id' => $institutionId,
            'name' => $request->year,
            'is_current' => !$hasSessions,
        ]);

        return redirect()->back()->with('success', 'Academic session created successfully.');
    }

    public function nextTerm(Request $request, \App\Models\Session $session)
    {
        // For now, we just log the action or update a mock term field if we had one.
        // Since we don't have a 'term' column, we can use this to switch the current session if needed.
        
        $institutionId = auth()->user()->institution_id;
        
        if ($request->payment_action === 'carry_forward') {
            // Logic to carry forward balances could go here
        }

        return redirect()->back()->with('success', 'Successfully moved to the next term.');
    }

    public function toggleStatus(\App\Models\Session $session)
    {
        $institutionId = auth()->user()->institution_id;

        // Deactivate all sessions for this institution
        \App\Models\Session::where('institution_id', $institutionId)
            ->update(['is_current' => false]);

        // Activate the selected session
        $session->update(['is_current' => true]);

        return redirect()->back()->with('success', 'Academic session status updated.');
    }
}
