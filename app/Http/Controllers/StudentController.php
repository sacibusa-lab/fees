<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\StudentVirtualAccount;
use App\Services\Payment\PaystackProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use App\Models\Fee;
use App\Models\Transaction;
use App\Models\Session;
use App\Models\Alumnus;

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
        // Fetch global subclasses scoped to this institution
        $subClasses = \App\Models\SubClass::where('institution_id', $institutionId)
            ->whereNull('class_id')
            ->get();
        
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
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $student->update([
            'name' => $validated['name'],
            'gender' => $validated['gender'],
            'class_id' => $validated['class_id'],
            'sub_class_id' => $validated['sub_class_id'],
            'phone' => $validated['phone'] ?? $student->phone,
            'email' => $validated['email'] ?? $student->email,
            'guardian_name' => $validated['guardian_name'] ?? $student->guardian_name,
            'guardian_phone' => $validated['guardian_phone'] ?? $student->guardian_phone,
            'address' => $validated['address'] ?? $student->address,
        ]);

        return redirect()->back()->with('success', 'Student updated successfully');
    }

    public function promote(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'target_class_id' => 'required|exists:classes,id',
            'target_sub_class_id' => 'nullable|exists:sub_classes,id',
        ]);

        $updateData = [
            'class_id' => $validated['target_class_id'],
        ];

        if (isset($validated['target_sub_class_id'])) {
            $updateData['sub_class_id'] = $validated['target_sub_class_id'];
        } else {
            $updateData['sub_class_id'] = null;
        }

        Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', Auth::user()->institution_id)
            ->update($updateData);

        return redirect()->back()->with('success', 'Students promoted successfully');
    }

    public function export(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        $query = Student::where('institution_id', $institutionId)->with(['schoolClass', 'subClass']);

        if ($request->has('class_id') && $request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('sub_class_id') && $request->sub_class_id) {
            $query->where('sub_class_id', $request->sub_class_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
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
            fputcsv($file, ['ID', 'Name', 'Admission Number', 'Class', 'Sub Class', 'Gender', 'Phone', 'Email', 'Guardian Name', 'Guardian Phone', 'Address', 'Payment Status']);

            foreach ($students as $student) {
                fputcsv($file, [
                    $student->id,
                    $student->name,
                    $student->admission_number,
                    $student->schoolClass->name ?? 'N/A',
                    $student->subClass->name ?? 'N/A',
                    $student->gender,
                    $student->phone ?? 'N/A',
                    $student->email ?? 'N/A',
                    $student->guardian_name ?? 'N/A',
                    $student->guardian_phone ?? 'N/A',
                    $student->address ?? 'N/A',
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
            fputcsv($file, ['Full Name', 'Admission Number', 'Gender (Male/Female)', 'Phone', 'Email', 'Guardian Name', 'Guardian Phone', 'Address']);
            // Example row
            fputcsv($file, ['John Doe', 'ADM/2026/001', 'Male', '08012345678', 'john@example.com', 'Jane Doe', '08098765432', '123 Main Street, City']);
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
            if (count($row) < 2) continue;

            $student = Student::updateOrCreate(
                ['admission_number' => trim($row[1])],
                [
                    'name' => trim($row[0]),
                    'class_id' => $targetClassId,
                    'sub_class_id' => $targetSubClassId,
                    'gender' => isset($row[2]) ? trim($row[2]) : null,
                    'phone' => isset($row[3]) ? trim($row[3]) : null,
                    'email' => isset($row[4]) ? trim($row[4]) : null,
                    'guardian_name' => isset($row[5]) ? trim($row[5]) : null,
                    'guardian_phone' => isset($row[6]) ? trim($row[6]) : null,
                    'address' => isset($row[7]) ? trim($row[7]) : null,
                    'institution_id' => auth()->user()->institution_id,
                    'payment_status' => 'pending'
                ]
            );

            // Automate DVA Generation
            try {
                if (!$student->virtualAccount) {
                    $this->processDvaGeneration($student);
                }
            } catch (\Exception $e) {
                Log::error("Failed to auto-generate DVA for student {$student->id} during import: " . $e->getMessage());
            }
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
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        if ($request->boolean('auto_reg')) {
            // Generate simple unique ID: STU + Timestamp + Random
            $validated['admission_number'] = 'STU' . date('ymd') . rand(100, 999);
        } else {
             $request->validate(['admission_number' => 'required|string|unique:students,admission_number']);
        }

        $student = Student::create([
             'name' => $validated['name'],
             'gender' => $validated['gender'],
             'class_id' => $validated['class_id'],
             'sub_class_id' => $validated['sub_class_id'],
             'admission_number' => $validated['admission_number'],
             'phone' => $validated['phone'] ?? null,
             'email' => $validated['email'] ?? null,
             'guardian_name' => $validated['guardian_name'] ?? null,
             'guardian_phone' => $validated['guardian_phone'] ?? null,
             'address' => $validated['address'] ?? null,
             'institution_id' => auth()->user()->institution_id,
             'status' => 'active',
             'payment_status' => 'pending',
        ]);

        // Automate DVA Generation
        try {
            $this->processDvaGeneration($student);
        } catch (\Exception $e) {
            Log::error("Failed to auto-generate DVA for student {$student->id}: " . $e->getMessage());
            return redirect()->back()->with('warning', 'Student added, but virtual account generation failed: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Student added and virtual account generated successfully');
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

        // Load ALL sessions (not just current) to show full academic history
        $allSessions = \App\Models\Session::where('institution_id', $student->institution_id)
            ->orderBy('start_date', 'desc')
            ->orderBy('name', 'desc')
            ->get();

        $currentSession = $allSessions->firstWhere('is_current', true) ?? $allSessions->first();

        // Build academic history from sessions where the student has transactions
        // session_id is stored in metadata JSON column, not as a direct column
        $txSessionIds = Transaction::where('institution_id', $student->institution_id)
            ->where('student_id', $student->id)
            ->where('status', 'success')
            ->get()
            ->map(function ($tx) {
                $meta = is_array($tx->metadata) ? $tx->metadata : json_decode($tx->metadata ?? '{}', true);
                return $meta['session_id'] ?? ($tx->fee ? $tx->fee->session_id : null);
            })
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $sessionIdsWithTx = $txSessionIds;

        $academicHistory = $allSessions->filter(function ($s) use ($sessionIdsWithTx) {
            return in_array($s->id, $sessionIdsWithTx);
        })->map(function ($s) {
            return ['session' => $s->name, 'is_current' => $s->is_current];
        })->values()->toArray();

        // If no transaction history, at least show the current session
        if (empty($academicHistory) && $currentSession) {
            $academicHistory[] = [
                'session' => $currentSession->name,
                'class' => $student->schoolClass->name ?? 'N/A',
                'is_current' => true
            ];
        }

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
            'status' => $student->status,
            'academic_history' => $academicHistory,
            'account_numbers' => $accountNumbers,
            'has_vaccount' => (bool)$student->virtualAccount
        ];

        // Calculate Payment Activity for ALL sessions
        $paymentActivity = [];
        foreach ($allSessions as $session) {
            foreach (['1st Term', '2nd Term', '3rd Term'] as $index => $term) {
                // 1. Get fees for this term (for expected calculation)
                $fees = Fee::where('institution_id', $student->institution_id)
                    ->where('session_id', $session->id)
                    ->where('status', 'active')
                    ->with('overrides')
                    ->where(function($q) use ($term) {
                         $termColumn = match($term) {
                             '1st Term' => 'first_term_active',
                             '2nd Term' => 'second_term_active',
                             '3rd Term' => 'third_term_active',
                             default => null
                         };
                         if ($termColumn) $q->where($termColumn, true);
                    })
                    ->get();

                // If no session-specific fees, fall back to global fees (null session_id)
                if ($fees->isEmpty()) {
                    $fees = Fee::where('institution_id', $student->institution_id)
                        ->whereNull('session_id')
                        ->where('status', 'active')
                        ->with('overrides')
                        ->get();
                }

                // If still no fees, fall back to the previous session's fees
                if ($fees->isEmpty()) {
                    $previousSession = \App\Models\Session::where('institution_id', $student->institution_id)
                        ->where('id', '<', $session->id)
                        ->orderBy('id', 'desc')
                        ->first();
                    if ($previousSession) {
                        $fees = Fee::where('institution_id', $student->institution_id)
                            ->where('session_id', $previousSession->id)
                            ->where('status', 'active')
                            ->with('overrides')
                            ->get();
                    }
                }

                $expected = 0;
                foreach ($fees as $fee) {
                    // NOTE: Don't filter by class_id here — the student's class may have
                    // changed since this session. The fees assigned to their old class
                    // should still count toward expected amount.
                    $override = $fee->overrides->where('class_id', $student->class_id)->first();
                    $expected += ($override && $override->status === 'active') ? $override->amount : $fee->getAmountForTerm($term);
                }

                // 2. Get payments for this session+term
                $transactions = Transaction::where('institution_id', $student->institution_id)
                    ->where('student_id', $student->id)
                    ->where('status', 'success')
                    ->where(function($q) use ($session) {
                        // Match by fee's session_id via fee relationship OR by metadata session_id
                        $q->whereHas('fee', function($sq) use ($session) {
                            $sq->where('session_id', $session->id);
                        })->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.session_id')) = ?", [(string)$session->id]);
                    })
                    ->where('metadata->term', $term)
                    ->get();

                $paid = $transactions->sum('amount');
                // Always show the current session's terms even if no data yet
                $isCurrentSession = $session->is_current ?? false;
                if ($paid <= 0 && $expected <= 0 && !$isCurrentSession) continue;

                $lastPayment = $transactions->sortByDesc('paid_at')->first();

                // 3. Determine status
                $status = 'Pending';
                if ($paid >= $expected && $expected > 0) {
                    $status = 'Paid';
                } elseif ($paid > 0) {
                    $status = 'Partial';
                }

                $paymentActivity[] = [
                    'sn' => $index + 1,
                    'session' => $session->name,
                    'term' => $term,
                    'status' => $status,
                    'date' => $lastPayment ? $lastPayment->paid_at->format('M d, Y') : '-',
                    'method' => $lastPayment ? ucfirst($lastPayment->channel ?? 'Manual') : '-',
                    'expected' => $expected,
                    'paid' => $paid,
                    'paid_formatted' => '₦' . number_format($paid, 2)
                ];
            }
        }

        // 4. Detailed Transaction History for ALL sessions
        $allTransactions = Transaction::where('institution_id', $student->institution_id)
            ->where('student_id', $student->id)
            ->where('status', 'success')
            ->orderBy('paid_at', 'desc')
            ->get()
            ->map(function($t) {
                $feeList = $t->metadata['fees'] ?? [];
                if (empty($feeList) && $t->fee) {
                    $feeList = [$t->fee->title];
                }
                // Resolve session name
                $sessionId = $t->metadata['session_id'] ?? null;
                $sessionName = null;
                if ($sessionId) {
                    $session = \App\Models\Session::find($sessionId);
                    $sessionName = $session?->name;
                }

                return [
                    'id' => $t->id,
                    'reference' => $t->reference,
                    'amount' => '₦' . number_format($t->amount, 2),
                    'date' => $t->paid_at ? $t->paid_at->format('M d, Y h:i A') : $t->created_at->format('M d, Y h:i A'),
                    'method' => ucfirst($t->channel ?? 'Manual'),
                    'fees' => implode(', ', $feeList),
                    'session' => $sessionName ?? 'N/A',
                    'term' => $t->metadata['term'] ?? 'N/A'
                ];
            });

        return Inertia::render('StudentProfile', [
            'student' => $formattedStudent,
            'classes' => SchoolClass::where('institution_id', $student->institution_id)->get(),
            'subClasses' => \App\Models\SubClass::where('institution_id', $student->institution_id)
                ->whereNull('class_id')
                ->get(),
            'paymentActivity' => $paymentActivity,
            'allTransactions' => $allTransactions,
            'allSessions' => $allSessions,
            'currentSessionName' => $currentSession ? $currentSession->name : 'N/A'
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

        $result = $this->processDvaGeneration($student);

        if (!$result['status']) {
            return back()->with('error', $result['message']);
        }

        return back()->with('success', 'Virtual Account generated successfully');
    }

    /**
     * Private helper to handle DVA generation logic
     */
    private function processDvaGeneration(Student $student)
    {
        $institutionId = $student->institution_id;

        // 1. Resolve Email
        $email = $student->email;
        if (!$email) {
            $portalId = $student->institution->portal_id ?? 'portal';
            $email = strtolower(str_replace([' ', '/', '\\'], '-', $student->admission_number)) . "@{$portalId}.fees.ng";
        }

        // 2. Resolve Phone
        $phone = $student->phone ?? $student->guardian_phone ?? $student->institution->phone ?? '08000000000';

        // Split name
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
            return ['status' => false, 'message' => $customerResult['message']];
        }

        $customerCode = $customerResult['customer_code'];

        // 4. Create Dedicated Account (no split code — splitting is handled internally via manual settlement)
        $dvaResult = $this->paystack->createDedicatedAccount($customerCode);

        if (!$dvaResult['status']) {
            return ['status' => false, 'message' => $dvaResult['message']];
        }

        // 6. Store DVA details
        StudentVirtualAccount::create([
            'student_id' => $student->id,
            'institution_id' => $institutionId,
            'bank_name' => $dvaResult['bank_name'],
            'account_number' => $dvaResult['account_number'],
            'account_name' => $dvaResult['account_name'],
            'customer_code' => $customerCode,
            'account_slug' => $dvaResult['account_slug']
        ]);

        return ['status' => true];
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $institutionId = auth()->user()->institution_id;

        // Ensure students belong to this institution
        $deleted = Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->delete();

        return redirect()->back()->with('success', "{$deleted} students deleted successfully");
    }

    public function bulkGraduate(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $institutionId = auth()->user()->institution_id;

        // Get students before updating so we have their data for alumni records
        $students = Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->get();

        if ($students->isEmpty()) {
            return redirect()->back()->with('error', 'No students found to graduate.');
        }

        $currentSession = Session::where('institution_id', $institutionId)
            ->where('is_current', true)->first();
        $currentTerm = $currentSession?->current_term;

        $graduated = 0;
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
            $graduated++;
        }

        // Update student status and clear class assignments
        Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->update([
                'status' => 'graduated',
                'class_id' => null,
                'sub_class_id' => null
            ]);

        return redirect()->back()->with('success', "{$graduated} students graduated and archived to alumni successfully");
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

    public function bulkGenerateDva(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $institutionId = auth()->user()->institution_id;
        $students = Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->whereDoesntHave('virtualAccount')
            ->get();

        $successCount = 0;
        $failCount = 0;

        foreach ($students as $student) {
            try {
                $result = $this->processDvaGeneration($student);
                if ($result['status']) {
                    $successCount++;
                } else {
                    $failCount++;
                }
            } catch (\Exception $e) {
                Log::error("Bulk DVA generation failed for student {$student->id}: " . $e->getMessage());
                $failCount++;
            }
        }

        $message = "Virtual accounts generated for {$successCount} students.";
        if ($failCount > 0) {
            $message .= " Failed for {$failCount} students.";
        }

        return redirect()->back()->with($failCount > 0 ? 'warning' : 'success', $message);
    }

    /**
     * Bulk move graduated students to the alumni table
     */
    public function bulkMoveToAlumni(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $institutionId = auth()->user()->institution_id;
        $currentTerm = null;
        $currentSession = \App\Models\Session::where('institution_id', $institutionId)
            ->where('is_current', true)->first();
        $currentTerm = $currentSession?->current_term;

        $students = Student::whereIn('id', $validated['student_ids'])
            ->where('institution_id', $institutionId)
            ->get();

        $moved = 0;

        foreach ($students as $student) {
            \App\Models\Alumnus::create([
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

            $student->delete();
            $moved++;
        }

        return redirect()->back()->with('success', "{$moved} students moved to alumni records.");
    }
}
