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
        // Mock data to match screenshot for visual verification first
        // Ideally fetch from DB: Session::all()
        
        $sessions = [
            [
                'id' => 1,
                'year' => '2025/2026',
                'term' => 'First Term',
                'status' => 'active', // active, inactive
            ]
        ];

        return Inertia::render('AcademicSessions/Index', [
            'sessions' => $sessions
        ]);
    }
}
