<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index()
    {
        $students = Student::with(['schoolClass', 'subClass', 'institution'])->latest()->get();
        $classes = SchoolClass::all();
        $subClasses = \App\Models\SubClass::all();
        
        // Fetch current session for context (assuming single active session)
        $currentSession = \App\Models\Session::where('is_current', true)->first();

        // Map to match the frontend expected format
        $formattedStudents = $students->map(function ($student) use ($currentSession) {
            return [
                'id' => $student->id,
                'name' => $student->name,
                'admission_number' => $student->admission_number,
                'class_name' => $student->schoolClass->name ?? 'N/A',
                'class_id' => $student->class_id,
                'sub_class_name' => $student->subClass->name ?? 'N/A',
                'sub_class_id' => $student->sub_class_id,
                'gender' => $student->gender,
                'phone' => $student->guardian_phone ?? 'N/A',
                'payment_status' => $student->payment_status,
                'avatar' => $student->avatar,
                // Extra fields for Details Modal
                'school_name' => $student->institution->name ?? 'N/A',
                'added_on' => $student->created_at->format('M d, Y, h:i A'),
                'session_added' => $currentSession ? $currentSession->name : 'N/A', // approximate
                'academic_history' => [
                    ['class' => $student->schoolClass->name ?? 'N/A', 'session' => $currentSession ? $currentSession->name : 'N/A']
                ],
                // Mocking account numbers for now as VirtualAccount model is not yet established
                'account_numbers' => [
                    [
                        'number' => '7722665489',
                        'name' => 'ST AUGUSTINES COLLEGE IBUSA',
                        'bank' => 'Globus Bank'
                    ]
                ]
            ];
        });

        return Inertia::render('StudentsHub', [
            'initialStudents' => $formattedStudents,
            'initialClasses' => $classes,
            'initialSubClasses' => $subClasses
        ]);
    }

    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'gender' => 'required|string|in:Male,Female',
            'class_id' => 'required|exists:classes,id',
            'sub_class_id' => 'required|exists:sub_classes,id',
        ]);

        $student->update([
            'name' => $validated['name'],
            'gender' => $validated['gender'],
            'class_id' => $validated['class_id'],
            'sub_class_id' => $validated['sub_class_id'],
        ]);

        return redirect()->back()->with('success', 'Student updated successfully');
    }

    public function promote(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'target_class_id' => 'required|exists:classes,id',
        ]);

        Student::whereIn('id', $validated['student_ids'])->update([
            'class_id' => $validated['target_class_id'],
            // Optionally reset sub_class_id if moving to a new class structure
            // 'sub_class_id' => null 
        ]);

        return redirect()->back()->with('success', 'Students promoted successfully');
    }

    public function export(Request $request)
    {
        $query = Student::with(['schoolClass', 'subClass']);

        if ($request->has('class_id') && $request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('sub_class_id') && $request->sub_class_id) {
            $query->where('sub_class_id', $request->sub_class_id);
        }

        $students = $query->get();
        $csvFileName = 'students_export_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($students) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Name', 'Admission Number', 'Class', 'Sub Class', 'Gender', 'Guardian Phone', 'Payment Status']);

            foreach ($students as $student) {
                fputcsv($file, [
                    $student->id,
                    $student->name,
                    $student->admission_number,
                    $student->schoolClass->name ?? 'N/A',
                    $student->subClass->name ?? 'N/A',
                    $student->gender,
                    $student->guardian_phone ?? 'N/A',
                    $student->payment_status
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function downloadTemplate()
    {
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=students_import_template.csv",
        ];

        $callback = function() {
            $file = fopen('php://output', 'w');
            // Headers matches the columns we expect
            fputcsv($file, ['Full Name', 'Admission Number', 'Gender (Male/Female)']);
            // Example row
            fputcsv($file, ['John Doe', 'ADM/2026/001', 'Male']);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
            'class_id' => 'required|exists:classes,id',
            'sub_class_id' => 'required|exists:sub_classes,id',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        
        // Skip header row
        fgetcsv($handle);

        $targetClassId = $request->class_id;
        $targetSubClassId = $request->sub_class_id;

        while (($row = fgetcsv($handle)) !== false) {
            // Basic mapping: Name, RegNo, Gender
            // New CSV format: Name, RegNo, Gender
            if (count($row) < 2) continue; // Minimum Name and RegNo

            Student::updateOrCreate(
                ['admission_number' => trim($row[1])], // Unique key: Reg No
                [
                    'name' => trim($row[0]),
                    'class_id' => $targetClassId,
                    'sub_class_id' => $targetSubClassId,
                    'gender' => isset($row[2]) ? trim($row[2]) : null,
                    'guardian_phone' => null, // Not in CSV anymore
                    'institution_id' => 1,
                    'payment_status' => 'pending'
                ]
            );
        }

        fclose($handle);

        return redirect()->back()->with('success', 'Students imported successfully');
    }

    public function store(Request $request) 
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'gender' => 'required|string|in:Male,Female',
            'class_id' => 'required|exists:classes,id',
            'sub_class_id' => 'required|exists:sub_classes,id',
            'auto_reg' => 'boolean',
            'admission_number' => 'nullable|string|unique:students,admission_number',
        ]);

        if ($request->boolean('auto_reg')) {
            // Generate simple unique ID: STU + Timestamp + Random
            $validated['admission_number'] = 'STU' . date('ymd') . rand(100, 999);
        } else {
             $request->validate(['admission_number' => 'required|string|unique:students,admission_number']);
        }

        Student::create([
             'name' => $validated['name'],
             'gender' => $validated['gender'],
             'class_id' => $validated['class_id'],
             'sub_class_id' => $validated['sub_class_id'],
             'admission_number' => $validated['admission_number'],
             'institution_id' => 1, // Hardcoded for now
             'status' => 'active',
             'payment_status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Student added successfully');
    }

    public function show(Student $student)
    {
        $student->load(['schoolClass', 'subClass', 'institution']);
        
        // Fetch current session for context
        $currentSession = \App\Models\Session::where('is_current', true)->first();

        // Format student data similar to index but single
        $formattedStudent = [
            'id' => $student->id,
            'name' => $student->name,
            'admission_number' => $student->admission_number,
            'class_name' => $student->schoolClass->name ?? 'N/A',
            'class_id' => $student->class_id,
            'sub_class_name' => $student->subClass->name ?? 'N/A',
            'sub_class_id' => $student->sub_class_id,
            'gender' => $student->gender,
            'phone' => $student->guardian_phone ?? 'N/A',
            'payment_status' => $student->payment_status,
            'avatar' => $student->avatar,
            'school_name' => $student->institution->name ?? 'N/A',
            'added_on' => $student->created_at->format('M d, Y, h:i A'),
            'session_added' => $currentSession ? $currentSession->name : 'N/A',
            'academic_history' => [
                ['class' => $student->schoolClass->name ?? 'N/A', 'session' => $currentSession->name ?? 'N/A']
            ],
             'account_numbers' => [
                [
                    'number' => '7722665489',
                    'name' => 'ST AUGUSTINES COLLEGE IBUSA',
                    'bank' => 'Globus Bank'
                ]
            ]
        ];

        return Inertia::render('StudentProfile', [
            'student' => $formattedStudent,
            'classes' => SchoolClass::all(),
            'subClasses' => \App\Models\SubClass::all()
        ]);
    }
}
