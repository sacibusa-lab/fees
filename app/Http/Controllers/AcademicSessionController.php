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
                    'year' => $session->name,
                    'term' => $session->current_term ?? '1st Term',
                    'status' => $session->is_current ? 'active' : 'inactive',
                    'start_date' => $session->start_date ? $session->start_date->format('Y-m-d') : null,
                    'end_date' => $session->end_date ? $session->end_date->format('Y-m-d') : null,
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
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $institutionId = auth()->user()->institution_id;

        // If this is the first session, make it current.
        $hasSessions = \App\Models\Session::where('institution_id', $institutionId)->exists();

        \App\Models\Session::create([
            'institution_id' => $institutionId,
            'name' => $request->year,
            'current_term' => '1st Term',
            'is_current' => !$hasSessions,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return redirect()->back()->with('success', 'Academic session created successfully.');
    }

    public function setTerm(Request $request, \App\Models\Session $session)
    {
        $request->validate([
            'term' => 'required|string|in:1st Term,2nd Term,3rd Term',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $session->update([
            'current_term' => $request->term,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return redirect()->back()->with('success', "Active term set to {$request->term}.");
    }

    public function nextTerm(Request $request, \App\Models\Session $session)
    {
        $request->validate([
            'payment_action' => 'required|in:keep,waive'
        ]);

        $currentTerm = $session->current_term ?? 'First Term';
        
        // Determine next term
        $nextTerm = match($currentTerm) {
            '1st Term' => '2nd Term',
            '2nd Term' => '3rd Term',
            '3rd Term' => '1st Term', // Loop back or handle differently
            default => '1st Term'
        };

        // Handle payment action if needed
        if ($request->payment_action === 'waive') {
            // Logic to waive outstanding payments could go here
            // For now, just a placeholder
        }

        // Update the session's current term. Clear dates for new term (user must set them)
        // Or keep them? Usually new term = new dates.
        $session->update([
            'current_term' => $nextTerm,
            'start_date' => null,
            'end_date' => null,
        ]);

        return redirect()->back()->with('success', "Successfully moved to {$nextTerm}.");
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

    // Add explicit update method if user wants to edit dates separately without changing term
    public function update(Request $request, \App\Models\Session $session)
    {
         $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);
        
        $session->update([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);
        
        return redirect()->back()->with('success', 'Session dates updated.');
    }
}
