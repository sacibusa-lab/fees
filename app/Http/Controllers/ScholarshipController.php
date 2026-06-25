<?php

namespace App\Http\Controllers;

use App\Models\Scholarship;
use App\Models\Student;
use App\Models\Session;
use App\Models\StudentAdjustment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ScholarshipController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        $scholarships = Scholarship::where('institution_id', $institutionId)
            ->with(['student', 'student.schoolClass', 'session', 'approvedBy'])
            ->latest()
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'student_name' => $s->student->name ?? 'Deleted Student',
                'student_id' => $s->student_id,
                'class_name' => $s->student->schoolClass->name ?? 'N/A',
                'admission_no' => $s->student->admission_number ?? 'N/A',
                'session_id' => $s->session_id,
                'session_name' => $s->session->name ?? 'N/A',
                'type' => $s->type,
                'type_label' => ucfirst($s->type),
                'amount' => (float)$s->amount,
                'term' => $s->term ?? 'All Terms',
                'description' => $s->description,
                'status' => $s->status,
                'approved_by' => $s->approvedBy?->name,
                'approved_at' => $s->approved_at?->format('M d, Y h:i A'),
                'created_at' => $s->created_at->format('M d, Y'),
            ]);

        $students = Student::where('institution_id', $institutionId)
            ->where('payment_status', '!=', 'inactive')
            ->with('schoolClass')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'class_name' => $s->schoolClass->name ?? 'N/A',
                'admission_number' => $s->admission_number,
            ]);

        $sessions = Session::where('institution_id', $institutionId)
            ->get(['id', 'name', 'is_current']);

        $stats = [
            'total_approved' => Scholarship::where('institution_id', $institutionId)
                ->where('status', 'approved')->sum('amount'),
            'total_pending' => Scholarship::where('institution_id', $institutionId)
                ->where('status', 'pending')->sum('amount'),
            'pending_count' => Scholarship::where('institution_id', $institutionId)
                ->where('status', 'pending')->count(),
            'approved_count' => Scholarship::where('institution_id', $institutionId)
                ->where('status', 'approved')->count(),
        ];

        return Inertia::render('Scholarships', [
            'scholarships' => $scholarships,
            'students' => $students,
            'sessions' => $sessions,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'session_id' => 'nullable|exists:sessions,id',
            'type' => 'required|in:scholarship,bursary',
            'amount' => 'required|numeric|min:1',
            'term' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ]);

        $institutionId = auth()->user()->institution_id;

        // Default to current session if not specified
        if (!$validated['session_id']) {
            $currentSession = Session::where('institution_id', $institutionId)
                ->where('is_current', true)->first();
            $validated['session_id'] = $currentSession?->id;
        }

        $created = 0;
        foreach ($validated['student_ids'] as $studentId) {
            $student = Student::find($studentId);
            if (!$student || $student->institution_id !== $institutionId) continue;

            Scholarship::create([
                'institution_id' => $institutionId,
                'student_id' => $studentId,
                'session_id' => $validated['session_id'],
                'type' => $validated['type'],
                'amount' => $validated['amount'],
                'term' => $validated['term'],
                'description' => $validated['description'],
                'status' => 'pending',
            ]);
            $created++;
        }

        $label = ucfirst($validated['type']);
        return redirect()->back()->with('success', "{$label} created for {$created} student(s). Pending approval.");
    }

    public function update(Request $request, Scholarship $scholarship)
    {
        $institutionId = auth()->user()->institution_id;
        if ($scholarship->institution_id !== $institutionId) {
            return redirect()->back()->with('error', 'Unauthorized.');
        }

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'session_id' => 'nullable|exists:sessions,id',
            'type' => 'required|in:scholarship,bursary',
            'amount' => 'required|numeric|min:1',
            'term' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ]);

        $student = Student::findOrFail($validated['student_id']);
        if ($student->institution_id !== $institutionId) {
            return redirect()->back()->with('error', 'Student does not belong to your institution.');
        }

        if (!$validated['session_id']) {
            $currentSession = Session::where('institution_id', $institutionId)
                ->where('is_current', true)->first();
            $validated['session_id'] = $currentSession?->id;
        }

        $wasApproved = $scholarship->status === 'approved';
        $oldStudentId = $scholarship->student_id;
        $oldSessionId = $scholarship->session_id;
        $oldAmount = $scholarship->amount;

        $scholarship->update($validated);

        // If it was already approved, sync the student adjustment to reflect changes
        if ($wasApproved) {
            // Find existing adjustment by matching the old scholarship values
            $adjustment = StudentAdjustment::where('institution_id', $institutionId)
                ->where('student_id', $oldStudentId)
                ->where('session_id', $oldSessionId)
                ->where('amount', -abs($oldAmount))
                ->first();

            if ($adjustment) {
                $adjustment->update([
                    'student_id' => $scholarship->student_id,
                    'session_id' => $scholarship->session_id,
                    'term' => $scholarship->term,
                    'amount' => -abs($scholarship->amount),
                    'description' => ucfirst($scholarship->type) . ': ' . ($validated['description'] ?? 'Awarded'),
                ]);
            }
        }

        return redirect()->back()->with('success', ucfirst($scholarship->type) . ' updated successfully.');
    }

    public function approve(Scholarship $scholarship)
    {
        $institutionId = auth()->user()->institution_id;
        if ($scholarship->institution_id !== $institutionId) {
            return redirect()->back()->with('error', 'Unauthorized.');
        }

        if ($scholarship->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending items can be approved.');
        }

        DB::transaction(function () use ($scholarship) {
            $scholarship->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Create a negative adjustment (discount) on the student's account
            StudentAdjustment::create([
                'institution_id' => $scholarship->institution_id,
                'student_id' => $scholarship->student_id,
                'session_id' => $scholarship->session_id,
                'term' => $scholarship->term,
                'amount' => -abs($scholarship->amount), // negative = discount
                'description' => ucfirst($scholarship->type) . ': ' . ($scholarship->description ?? 'Awarded'),
            ]);
        });

        return redirect()->back()->with('success', ucfirst($scholarship->type) . ' approved and applied as discount.');
    }

    public function reject(Scholarship $scholarship)
    {
        $institutionId = auth()->user()->institution_id;
        if ($scholarship->institution_id !== $institutionId) {
            return redirect()->back()->with('error', 'Unauthorized.');
        }

        if ($scholarship->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending items can be rejected.');
        }

        $scholarship->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', ucfirst($scholarship->type) . ' rejected.');
    }

    public function destroy(Scholarship $scholarship)
    {
        $institutionId = auth()->user()->institution_id;
        if ($scholarship->institution_id !== $institutionId) {
            return redirect()->back()->with('error', 'Unauthorized.');
        }

        $scholarship->delete();
        return redirect()->back()->with('success', 'Deleted successfully.');
    }
}
