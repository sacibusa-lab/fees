<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\SubClass;
use App\Models\Fee;
use App\Models\Session;
use App\Models\Transaction;
use App\Models\Alumnus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class BulkOperationsController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        $classes = SchoolClass::where('institution_id', $institutionId)->get(['id', 'name']);
        $subClasses = SubClass::where('institution_id', $institutionId)->get(['id', 'name', 'class_id']);
        $sessions = Session::where('institution_id', $institutionId)->get(['id', 'name', 'is_current']);
        $fees = Fee::where('institution_id', $institutionId)->get(['id', 'title', 'class_id']);

        $stats = [
            'total_students' => Student::where('institution_id', $institutionId)->count(),
            'active_students' => Student::where('institution_id', $institutionId)
                ->where('payment_status', '!=', 'inactive')->count(),
            'classes_count' => $classes->count(),
            'unpaid_students' => Student::where('institution_id', $institutionId)
                ->where('payment_status', 'pending')->count(),
        ];

        $students = Student::where('institution_id', $institutionId)
            ->where('payment_status', '!=', 'inactive')
            ->with('schoolClass', 'subClass')
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'admission_number' => $s->admission_number,
                'class_id' => $s->class_id,
                'sub_class_id' => $s->sub_class_id,
                'class_name' => $s->schoolClass?->name ?? 'N/A',
                'sub_class_name' => $s->subClass?->name ?? null,
            ]);

        return Inertia::render('BulkOperations', [
            'classes' => $classes,
            'subClasses' => $subClasses,
            'sessions' => $sessions,
            'fees' => $fees,
            'students' => $students,
            'stats' => $stats,
        ]);
    }

    /**
     * Bulk promote students to a target class
     */
    public function promote(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'target_class_id' => 'required|exists:classes,id',
            'target_sub_class_id' => 'nullable|exists:sub_classes,id',
        ]);

        $institutionId = auth()->user()->institution_id;

        $updateData = ['class_id' => $validated['target_class_id']];
        if (isset($validated['target_sub_class_id'])) {
            $updateData['sub_class_id'] = $validated['target_sub_class_id'];
        } else {
            $updateData['sub_class_id'] = null;
        }

        $count = Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->update($updateData);

        return redirect()->back()->with('success', "{$count} students promoted successfully.");
    }

    /**
     * Bulk graduate students (mark as graduated and archive to alumni)
     */
    public function graduate(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $institutionId = auth()->user()->institution_id;

        $students = Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->get();

        if ($students->isEmpty()) {
            return redirect()->back()->with('error', 'No students found to graduate.');
        }

        $currentSession = Session::where('institution_id', $institutionId)
            ->where('is_current', true)->first();
        $currentTerm = $currentSession?->current_term;

        $count = 0;
        foreach ($students as $student) {
            Alumnus::create([
                'institution_id' => $institutionId,
                'original_student_id' => $student->id,
                'last_class_id' => $student->class_id,
                'admission_number' => $student->admission_number,
                'name' => $student->name,
                'gender' => $student->gender,
                'email' => $student->email,
                'phone' => $student->phone,
                'graduation_year' => now()->format('Y'),
                'graduation_term' => $currentTerm,
                'graduated_at' => now(),
            ]);
            $count++;
        }

        Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->update([
                'status' => 'graduated',
                'class_id' => null,
                'sub_class_id' => null
            ]);

        return redirect()->back()->with('success', "{$count} students graduated and archived to alumni.");
    }

    /**
     * Bulk generate virtual accounts for students
     */
    public function generateVirtualAccounts(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $institutionId = auth()->user()->institution_id;
        $paystack = app(\App\Services\Payment\PaystackProvider::class);

        $students = Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->whereDoesntHave('virtualAccount')
            ->get();

        $generated = 0;
        $errors = 0;

        foreach ($students as $student) {
            try {
                $paystack->createVirtualAccount($student);
                $generated++;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("DVA generation failed for {$student->id}: " . $e->getMessage());
                $errors++;
            }
        }

        $msg = "{$generated} virtual accounts generated.";
        if ($errors > 0) $msg .= " {$errors} failed.";

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Bulk set payment status for students in a class
     */
    public function setPaymentStatus(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'status' => 'required|in:paid,pending,partial',
        ]);

        $institutionId = auth()->user()->institution_id;

        $count = Student::where('institution_id', $institutionId)
            ->where('class_id', $validated['class_id'])
            ->update(['payment_status' => $validated['status']]);

        return redirect()->back()->with('success', "Payment status updated to '{$validated['status']}' for {$count} students.");
    }

    /**
     * Bulk apply fee to class (activate fee for all students in a class)
     */
    public function applyFeeToClass(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'fee_id' => 'required|exists:fees,id',
            'action' => 'required|in:activate,deactivate',
        ]);

        $fee = Fee::findOrFail($validated['fee_id']);
        
        // If the fee is class-specific, apply it
        $fee->update(['status' => $validated['action'] === 'activate' ? 'active' : 'inactive']);

        $actionText = $validated['action'] === 'activate' ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "Fee '{$fee->title}' {$actionText} successfully.");
    }
}
