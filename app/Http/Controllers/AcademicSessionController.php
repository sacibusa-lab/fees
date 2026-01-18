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
}
