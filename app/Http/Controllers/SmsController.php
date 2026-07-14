<?php

namespace App\Http\Controllers;

use App\Models\SmsTemplate;
use App\Models\SmsLog;
use App\Models\ClassSmsSetting;
use App\Models\SchoolClass;
use App\Models\SubClass;
use App\Models\Student;
use App\Models\Session;
use App\Models\Fee;
use App\Services\Sms\SmsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SmsController extends Controller
{
    protected SmsService $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * SMS Dashboard / Settings page
     */
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        $templates = SmsTemplate::where('institution_id', $institutionId)->get();

        // Auto-create default templates if none exist for this institution
        if ($templates->isEmpty()) {
            $defaults = [
                [
                    'name' => 'payment_receipt',
                    'label' => 'Payment Receipt',
                    'message' => "Dear {name},\n\nYour {fee} payment of ₦{amount} for {term} has been received.\nStatus: {status}\nTotal Fee: ₦{total}\nAmount Paid: ₦{amount}\nBalance: ₦{balance}\n\nThank you.",
                ],
                [
                    'name' => 'payment_reminder',
                    'label' => 'Payment Reminder',
                    'message' => "Dear {guardian},\n\nThis is a reminder that the {fee} of ₦{amount} for {term} for {name} is due.\n\nPlease make payment at your earliest convenience to avoid disruption.\n\nThank you.",
                ],
            ];
            foreach ($defaults as $default) {
                SmsTemplate::create(array_merge($default, ['institution_id' => $institutionId]));
            }
            $templates = SmsTemplate::where('institution_id', $institutionId)->get();
        }

        $classes = SchoolClass::where('institution_id', $institutionId)->with(['subClasses'])->get();
        $subClasses = SubClass::where('institution_id', $institutionId)->get();
        $classSmsSettings = ClassSmsSetting::where('institution_id', $institutionId)->get();
        $recentLogs = SmsLog::where('institution_id', $institutionId)
            ->with('student')
            ->latest()
            ->limit(20)
            ->get();
        $fees = Fee::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->with('schoolClass')
            ->get(['id', 'title', 'class_id', 'amount']);

        return Inertia::render('Sms/Index', [
            'templates' => $templates,
            'classes' => $classes,
            'subClasses' => $subClasses,
            'classSmsSettings' => $classSmsSettings,
            'recentLogs' => $recentLogs,
            'fees' => $fees,
            'smsEnabled' => config('sms.enabled', false),
            'smsProvider' => config('sms.default', 'termii'),
        ]);
    }

    /**
     * Update SMS global enabled/disabled status
     */
    public function toggleEnabled(Request $request)
    {
        // This is stored in .env - we'll store it in the institution DB instead
        $institutionId = auth()->user()->institution_id;
        $institution = auth()->user()->institution;

        $enabled = $request->boolean('enabled', false);

        // Store in institution settings or a settings table
        // For now, we store in a json column or we use a simple approach
        $settings = $institution->settings ?? [];
        $settings['sms_enabled'] = $enabled;
        $institution->update(['settings' => $settings]);

        return redirect()->back()->with('success', 'SMS ' . ($enabled ? 'enabled' : 'disabled') . ' successfully.');
    }

    /**
     * Save/update SMS templates
     */
    public function saveTemplate(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:sms_templates,id',
            'name' => 'required|string|max:100',
            'label' => 'required|string|max:200',
            'message' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $institutionId = auth()->user()->institution_id;

        if (!empty($validated['id'])) {
            $template = SmsTemplate::where('institution_id', $institutionId)
                ->findOrFail($validated['id']);
            $template->update($validated);
        } else {
            SmsTemplate::create(array_merge($validated, [
                'institution_id' => $institutionId,
            ]));
        }

        return redirect()->back()->with('success', 'SMS template saved successfully.');
    }

    /**
     * Delete an SMS template
     */
    public function deleteTemplate($id)
    {
        $institutionId = auth()->user()->institution_id;
        SmsTemplate::where('institution_id', $institutionId)
            ->where('id', $id)
            ->delete();

        return redirect()->back()->with('success', 'SMS template deleted.');
    }

    /**
     * Update class SMS settings
     */
    public function updateClassSettings(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.class_id' => 'required|exists:classes,id',
            'settings.*.sub_class_id' => 'nullable|exists:sub_classes,id',
            'settings.*.sms_enabled' => 'required|boolean',
        ]);

        $institutionId = auth()->user()->institution_id;

        foreach ($validated['settings'] as $setting) {
            ClassSmsSetting::updateOrCreate(
                [
                    'institution_id' => $institutionId,
                    'class_id' => $setting['class_id'],
                    'sub_class_id' => $setting['sub_class_id'] ?? null,
                ],
                [
                    'sms_enabled' => $setting['sms_enabled'],
                ]
            );
        }

        return redirect()->back()->with('success', 'Class SMS settings updated.');
    }

    /**
     * Send bulk SMS to selected students (optionally filtered by class/section)
     */
    public function sendBulk(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'sub_class_id' => 'nullable|exists:sub_classes,id',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
            'message' => 'required|string|max:1600',
            'send_to_guardian' => 'boolean',
        ]);

        $institutionId = auth()->user()->institution_id;

        $query = Student::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->where('class_id', $validated['class_id'])
            ->with('schoolClass');

        if (!empty($validated['sub_class_id'])) {
            $query->where('sub_class_id', $validated['sub_class_id']);
        }

        // If specific student IDs provided, filter by those
        if (!empty($validated['student_ids'])) {
            $query->whereIn('id', $validated['student_ids']);
        }

        $students = $query->get();

        if ($students->isEmpty()) {
            return redirect()->back()->with('error', 'No active students found in the selected class.');
        }

        $sent = 0;
        $failed = 0;

        foreach ($students as $student) {
            // Check if SMS is enabled for this class
            if (!$this->smsService->isEnabledForStudent($student)) {
                $failed++;
                continue;
            }

            $phone = $student->phone;

            // Optionally send to guardian phone instead
            if (!empty($validated['send_to_guardian']) && !empty($student->guardian_phone)) {
                $phone = $student->guardian_phone;
            }

            if (empty($phone)) {
                $failed++;
                continue;
            }

            // Parse message with student data
            $parsed = str_replace(
                ['{name}', '{admission}', '{class}', '{guardian}'],
                [$student->name, $student->admission_number, $student->schoolClass?->name ?? 'N/A', $student->guardian_name ?? 'Parent'],
                $validated['message']
            );

            $result = $this->smsService->send(
                $phone,
                $parsed,
                $institutionId,
                $student->id
            );

            if ($result) {
                $sent++;
            } else {
                $failed++;
            }
        }

        $message = "SMS sent to {$sent} recipients.";
        if ($failed > 0) {
            $message .= " {$failed} failed.";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * API: Get students for a class/section (for bulk SMS selection)
     */
    public function getStudents(Request $request)
    {
        $institutionId = auth()->user()->institution_id;

        $students = Student::where('institution_id', $institutionId)
            ->where('status', 'active')
            ->when($request->class_id, fn($q, $v) => $q->where('class_id', $v))
            ->when($request->sub_class_id, fn($q, $v) => $q->where('sub_class_id', $v))
            ->with('schoolClass')
            ->orderBy('name')
            ->get(['id', 'name', 'admission_number', 'class_id', 'sub_class_id', 'phone', 'guardian_name', 'guardian_phone']);

        return response()->json($students);
    }

    /**
     * Send payment reminder SMS to students with pending payments
     */
    public function sendPaymentReminders(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'nullable|exists:classes,id',
            'sub_class_id' => 'nullable|exists:sub_classes,id',
            'fee_id' => 'required|exists:fees,id',
        ]);

        $institutionId = auth()->user()->institution_id;

        $query = Student::where('institution_id', $institutionId)
            ->where('payment_status', 'pending')
            ->where('status', 'active')
            ->with('schoolClass');

        if (!empty($validated['class_id'])) {
            $query->where('class_id', $validated['class_id']);
        }
        if (!empty($validated['sub_class_id'])) {
            $query->where('sub_class_id', $validated['sub_class_id']);
        }

        $students = $query->get();
        $fee = Fee::find($validated['fee_id']);
        $session = Session::where('institution_id', $institutionId)
            ->where('is_current', true)->first();
        $term = $session?->current_term ?? '1st Term';

        $sent = 0;
        $skipped = 0;

        foreach ($students as $student) {
            if (!$this->smsService->isEnabledForStudent($student)) {
                $skipped++;
                continue;
            }

            $phone = $student->guardian_phone ?: $student->phone;
            if (empty($phone)) {
                $skipped++;
                continue;
            }

            $amountDue = $fee ? $fee->getAmountForTerm($term) : 0;

            $result = $this->smsService->sendPaymentReminder(
                $institutionId,
                $student->id,
                $phone,
                $student->name,
                $student->guardian_name ?? 'Parent/Guardian',
                $amountDue,
                $fee?->title ?? 'School Fees',
                $term,
                'ASAP'
            );

            if ($result) {
                $sent++;
            } else {
                $skipped++;
            }
        }

        return redirect()->back()->with('success', "Payment reminders sent to {$sent} parents. {$skipped} skipped.");
    }

    /**
     * View SMS logs
     */
    public function logs()
    {
        $institutionId = auth()->user()->institution_id;

        $logs = SmsLog::where('institution_id', $institutionId)
            ->with('student', 'template')
            ->latest()
            ->paginate(50);

        return Inertia::render('Sms/Logs', [
            'logs' => $logs,
        ]);
    }
}
