<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\StudentVirtualAccount;
use App\Services\Payment\PaystackProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    protected $paystack;

    public function __construct(PaystackProvider $paystack)
    {
        $this->paystack = $paystack;
    }

    public function index()
    {
        $institutionId = auth()->user()->institution_id;
        
        $students = Student::where('institution_id', $institutionId)
            ->with(['schoolClass', 'subClass', 'institution', 'virtualAccount'])
            ->latest()
            ->get();
            
        $classes = SchoolClass::where('institution_id', $institutionId)->get();
        $subClasses = \App\Models\SubClass::whereHas('schoolClass', function($q) use ($institutionId) {
            $q->where('institution_id', $institutionId);
        })->get();
        
        // Fetch main bank account for student profile
        $mainAccount = \App\Models\BankAccount::where('institution_id', $institutionId)
            ->where('is_active', true)
            ->first();

        // Fetch current session for context
        $currentSession = \App\Models\Session::where('institution_id', $institutionId)
            ->where('is_current', true)
            ->first();

        // Map to match the frontend expected format
        $formattedStudents = $students->map(function ($student) use ($currentSession, $mainAccount) {
            $accountNumbers = $student->virtualAccount ? [
                [
                    'number' => $student->virtualAccount->account_number,
                    'name' => $student->virtualAccount->account_name,
                    'bank' => $student->virtualAccount->bank_name,
                    'is_dva' => true
                ]
            ] : ($mainAccount ? [
                [
                    'number' => $mainAccount->account_number,
                    'name' => $mainAccount->account_name,
                    'bank' => $mainAccount->bank_name,
                    'is_dva' => false
                ]
            ] : []);

            return [
                'id' => $student->id,
                'name' => $student->name,
                'admission_number' => $student->admission_number,
                'class_name' => $student->schoolClass->name ?? 'N/A',
                'class_id' => $student->class_id,
                'sub_class_name' => $student->subClass->name ?? 'N/A',
                'sub_class_id' => $student->sub_class_id,
                'gender' => $student->gender,
                'phone' => $student->phone ?? 'N/A',
                'guardian_phone' => $student->guardian_phone ?? 'N/A',
                'email' => $student->email,
                'payment_status' => $student->payment_status,
                'avatar' => $student->avatar,
                // Extra fields for Details Modal
                'school_name' => $student->institution->name ?? 'N/A',
                'added_on' => $student->created_at->format('M d, Y, h:i A'),
                'session_added' => $currentSession ? $currentSession->name : 'N/A',
                'academic_history' => [
                    ['class' => $student->schoolClass->name ?? 'N/A', 'session' => $currentSession ? $currentSession->name : 'N/A']
                ],
                'account_numbers' => $accountNumbers,
                'has_vaccount' => (bool)$student->virtualAccount
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
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $student->update([
            'name' => $validated['name'],
            'gender' => $validated['gender'],
            'class_id' => $validated['class_id'],
            'sub_class_id' => $validated['sub_class_id'],
            'phone' => $validated['phone'] ?? $student->phone,
            'email' => $validated['email'] ?? $student->email,
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
            fputcsv($file, ['Full Name', 'Admission Number', 'Gender (Male/Female)', 'Phone', 'Email']);
            // Example row
            fputcsv($file, ['John Doe', 'ADM/2026/001', 'Male', '08012345678', 'john@example.com']);
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
                    'phone' => isset($row[3]) ? trim($row[3]) : null,
                    'email' => isset($row[4]) ? trim($row[4]) : null,
                    'guardian_phone' => null, // Legacy field
                    'institution_id' => auth()->user()->institution_id,
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
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
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
             'phone' => $validated['phone'] ?? null,
             'email' => $validated['email'] ?? null,
             'institution_id' => auth()->user()->institution_id,
             'status' => 'active',
             'payment_status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Student added successfully');
    }

    public function show(Student $student)
    {
        $student->load(['schoolClass', 'subClass', 'institution', 'virtualAccount']);
        
        $currentSession = \App\Models\Session::where('institution_id', $student->institution_id)
            ->where('is_current', true)
            ->first();

        $mainAccount = \App\Models\BankAccount::where('institution_id', $student->institution_id)
            ->where('is_active', true)
            ->first();

        // Account numbers priority: 1. Student DVA, 2. Institution Main Account
        $accountNumbers = $student->virtualAccount ? [
            [
                'number' => $student->virtualAccount->account_number,
                'name' => $student->virtualAccount->account_name,
                'bank' => $student->virtualAccount->bank_name,
                'is_dva' => true
            ]
        ] : ($mainAccount ? [
            [
                'number' => $mainAccount->account_number,
                'name' => $mainAccount->account_name,
                'bank' => $mainAccount->bank_name,
                'is_dva' => false
            ]
        ] : []);

        $formattedStudent = [
            'id' => $student->id,
            'name' => $student->name,
            'admission_number' => $student->admission_number,
            'email' => $student->email,
            'class_name' => $student->schoolClass->name ?? 'N/A',
            'class_id' => $student->class_id,
            'sub_class_name' => $student->subClass->name ?? 'N/A',
            'sub_class_id' => $student->sub_class_id,
            'gender' => $student->gender,
            'phone' => $student->phone ?? 'N/A',
            'guardian_phone' => $student->guardian_phone ?? 'N/A',
            'payment_status' => $student->payment_status,
            'avatar' => $student->avatar,
            'school_name' => $student->institution->name ?? 'N/A',
            'added_on' => $student->created_at->format('M d, Y, h:i A'),
            'session_added' => $currentSession ? $currentSession->name : 'N/A',
            'academic_history' => [
                ['class' => $student->schoolClass->name ?? 'N/A', 'session' => $currentSession->name ?? 'N/A']
            ],
            'account_numbers' => $accountNumbers,
            'has_vaccount' => (bool)$student->virtualAccount
        ];

        return Inertia::render('StudentProfile', [
            'student' => $formattedStudent,
            'classes' => SchoolClass::where('institution_id', $student->institution_id)->get(),
            'subClasses' => \App\Models\SubClass::whereHas('schoolClass', function($q) use ($student) {
                $q->where('institution_id', $student->institution_id);
            })->get()
        ]);
    }

    public function generateVirtualAccount(Student $student)
    {
        $institutionId = auth()->user()->institution_id;
        
        if ($student->institution_id !== $institutionId) {
            abort(403);
        }

        if ($student->virtualAccount) {
            return back()->with('error', 'Student already has a virtual account');
        }

        // 1. Resolve Email (Paystack requires an email)
        $email = $student->email;
        if (!$email) {
            $portalId = $student->institution->portal_id ?? 'portal';
            $email = strtolower(str_replace([' ', '/', '\\'], '-', $student->admission_number)) . "@{$portalId}.fees.ng";
            Log::info("Generating VA with placeholder email: {$email}", ['student_id' => $student->id]);
        }

        // 2. Resolve Phone (DVA requires a phone number on the customer)
        $phone = $student->phone ?? $student->guardian_phone ?? $student->institution->phone ?? '08000000000';

        // Split name for Paystack
        $nameParts = explode(' ', $student->name, 2);
        $firstName = $nameParts[0];
        $lastName = $nameParts[1] ?? 'Student';

        // 3. Create or Find Paystack Customer
        $customerResult = $this->paystack->createCustomer([
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => $phone
        ]);

        if (!$customerResult['status']) {
            return back()->with('error', $customerResult['message']);
        }

        $customerCode = $customerResult['customer_code'];

        // 2. Assign Dedicated Virtual Account
        $dvaResult = $this->paystack->createDedicatedAccount($customerCode);

        if (!$dvaResult['status']) {
            return back()->with('error', $dvaResult['message']);
        }

        // 3. Store DVA details
        StudentVirtualAccount::create([
            'student_id' => $student->id,
            'institution_id' => $institutionId,
            'bank_name' => $dvaResult['bank_name'],
            'account_number' => $dvaResult['account_number'],
            'account_name' => $dvaResult['account_name'],
            'customer_code' => $customerCode,
            'account_slug' => $dvaResult['account_slug']
        ]);

        return back()->with('success', 'Virtual Account generated successfully');
    }

    public function destroy(Student $student)
    {
        $institutionId = auth()->user()->institution_id;
        
        // Ensure the student belongs to the same institution
        if ($student->institution_id !== $institutionId) {
             abort(403);
        }

        $student->delete();

        return redirect()->route('students.index')->with('success', 'Student profile deleted successfully');
    }
}
