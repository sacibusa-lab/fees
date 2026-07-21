<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ClassController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\FeeController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\BankAccountController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AcademicSessionController;
use App\Http\Controllers\SettlementController;
use App\Http\Controllers\ScholarshipController;
use App\Http\Controllers\BulkOperationsController;
use App\Http\Controllers\AlumniController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SmsController;

Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Fees
    Route::get('/fees', [App\Http\Controllers\FeeController::class, 'index'])->name('fees.index');
    Route::get('/fees/{fee}', [App\Http\Controllers\FeeController::class, 'show'])->name('fees.show');
    
    Route::middleware('permission:fees.manage')->group(function () {
        Route::post('/fees', [App\Http\Controllers\FeeController::class, 'store'])->name('fees.store');
        Route::put('/fees/{fee}', [App\Http\Controllers\FeeController::class, 'update'])->name('fees.update');
        Route::delete('/fees/{fee}', [App\Http\Controllers\FeeController::class, 'destroy'])->name('fees.destroy');
        Route::post('/fees/{fee}/toggle-status', [FeeController::class, 'toggleStatus'])->name('fees.toggle-status');
        Route::post('/fees/{fee}/beneficiaries', [FeeController::class, 'manageBeneficiaries'])->name('fees.beneficiaries');
        Route::post('/fees/{fee}/overrides', [FeeController::class, 'manageOverrides'])->name('fees.overrides');
        Route::post('/fees/{fee}/sync-splits', [FeeController::class, 'syncSplits'])->name('fees.sync-splits');
    });

    // Business
    Route::prefix('business')->group(function () {
        Route::get('/bank-accounts', [App\Http\Controllers\BankAccountController::class, 'index'])->name('bank-accounts.index');
        
        Route::middleware('permission:business.manage')->group(function () {
            Route::post('/bank-accounts/validate', [App\Http\Controllers\BankAccountController::class, 'validateAccount'])->name('bank-accounts.validate');
            Route::post('/bank-accounts', [App\Http\Controllers\BankAccountController::class, 'store'])->name('bank-accounts.store');
            Route::put('/bank-accounts/{bankAccount}', [App\Http\Controllers\BankAccountController::class, 'update'])->name('bank-accounts.update');
            Route::delete('/bank-accounts/{bankAccount}', [App\Http\Controllers\BankAccountController::class, 'destroy'])->name('bank-accounts.destroy');
        });
    });
    
    // Students Hub
    Route::prefix('students')->group(function () {
        Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
        Route::get('/sub-classes', [ClassController::class, 'subClasses'])->name('sub-classes.index');
        Route::get('/', [StudentController::class, 'index'])->name('students.index');
        Route::get('/export', [StudentController::class, 'export'])->name('students.export');
        Route::get('/template', [StudentController::class, 'downloadTemplate'])->name('students.template');
        Route::get('/{student}', [StudentController::class, 'show'])->name('students.show');

        Route::middleware('permission:students.manage')->group(function () {
            Route::put('/classes/{schoolClass}', [ClassController::class, 'update'])->name('classes.update');
            Route::post('/sub-classes', [ClassController::class, 'store'])->name('sub-classes.store');
            Route::put('/sub-classes/{subClass}', [ClassController::class, 'updateSubClass'])->name('sub-classes.update');
            Route::post('/promote', [StudentController::class, 'promote'])->name('students.promote');
            Route::post('/import', [StudentController::class, 'import'])->name('students.import');
            Route::delete('/bulk-delete', [StudentController::class, 'bulkDelete'])->name('students.bulk-delete');
            Route::post('/bulk-graduate', [StudentController::class, 'bulkGraduate'])->name('students.bulk-graduate');
            Route::post('/bulk-generate-dva', [StudentController::class, 'bulkGenerateDva'])->name('students.bulk-generate-dva');
            Route::post('/', [StudentController::class, 'store'])->name('students.store');
            Route::put('/{student}', [StudentController::class, 'update'])->name('students.update');
            Route::post('/{student}/virtual-account', [StudentController::class, 'generateVirtualAccount'])->name('students.virtual-account');
            Route::delete('/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
        });
    });

    // Settings
    Route::prefix('settings')->middleware('permission:settings.view')->group(function () {
        Route::get('/', [App\Http\Controllers\SettingsController::class, 'index'])->name('settings.index');
        Route::get('/global', [App\Http\Controllers\SettingsController::class, 'global'])->name('settings.global');
        Route::post('/global', [App\Http\Controllers\SettingsController::class, 'updateGlobal'])->name('settings.global.update');
        Route::get('/api', [App\Http\Controllers\SettingsController::class, 'api'])->name('settings.api');
        Route::get('/webhooks', [App\Http\Controllers\SettingsController::class, 'webhooks'])->name('settings.webhooks');
        Route::post('/api', [App\Http\Controllers\SettingsController::class, 'updateApi'])->name('settings.api.update');
    });

    // Admin Care
    Route::prefix('admin-care')->middleware('permission:admin-care.manage')->group(function () {
        Route::get('/all-admins', [App\Http\Controllers\AdminCareController::class, 'index'])->name('admin-care.admins');
        Route::post('/all-admins', [App\Http\Controllers\AdminCareController::class, 'storeAdmin'])->name('admin-care.admins.store');
        Route::get('/roles', [App\Http\Controllers\AdminCareController::class, 'roles'])->name('admin-care.roles');
        Route::post('/roles', [App\Http\Controllers\AdminCareController::class, 'storeRole'])->name('admin-care.roles.store');
        Route::put('/roles/{role}', [App\Http\Controllers\AdminCareController::class, 'updateRole'])->name('admin-care.roles.update');
        Route::delete('/roles/{role}', [App\Http\Controllers\AdminCareController::class, 'deleteRole'])->name('admin-care.roles.delete');
        Route::get('/permissions', [App\Http\Controllers\AdminCareController::class, 'permissions'])->name('admin-care.permissions');
        Route::post('/permissions', [App\Http\Controllers\AdminCareController::class, 'updatePermissions'])->name('admin-care.permissions.update');
    });

    // Profile Routes
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');

    Route::middleware('permission:payments.view')->group(function () {
        Route::get('/payments/overview', [PaymentController::class, 'overview'])->name('payments.overview');
        Route::get('/payments/schedule', [PaymentController::class, 'schedule'])->name('payments.schedule');
        Route::get('/payments/schedule/preview', [PaymentController::class, 'getSchedulePreview'])->name('payments.schedule.preview');
        Route::get('/payments/schedule/export', [PaymentController::class, 'exportSchedule'])->name('payments.schedule.export');
        Route::get('/payments/schedule/download', [PaymentController::class, 'downloadSchedulePdf'])->name('payments.schedule.download');
        Route::get('/payments/gateway', [App\Http\Controllers\PaymentGatewayController::class, 'index'])->name('payments.gateway');
    });

    Route::middleware('permission:payments.manage')->group(function () {
        Route::post('/payments/schedule/bulk-modify', [PaymentController::class, 'bulkModifyAmount'])->name('payments.schedule.bulk-modify');
        Route::post('/payments/schedule/bulk-mark-paid', [PaymentController::class, 'bulkMarkPaid'])->name('payments.schedule.bulk-mark-paid');
        Route::get('/api/payments/verify', [PaymentController::class, 'verifyStatus']);
    });
    
    Route::get('/payments/transactions', [PaymentController::class, 'transactions'])->name('payments.transactions');
    Route::get('/payments/transactions/{transaction}', [PaymentController::class, 'show'])->name('payments.transactions.show');
    
    Route::get('/settlements', [SettlementController::class, 'index'])->name('settlements.index');
    Route::get('/api/settlements/{date}', [SettlementController::class, 'show'])->name('settlements.show');
    
    Route::post('/settlements/mark-disbursed', [SettlementController::class, 'markAsDisbursed'])
        ->middleware('permission:payments.manage')
        ->name('settlements.disburse');

    // Scholarships & Bursaries
    Route::middleware('permission:students.manage')->group(function () {
        Route::get('/scholarships', [ScholarshipController::class, 'index'])->name('scholarships.index');
        Route::post('/scholarships', [ScholarshipController::class, 'store'])->name('scholarships.store');
        Route::post('/scholarships/{scholarship}/update', [ScholarshipController::class, 'update'])->name('scholarships.update');
        Route::post('/scholarships/{scholarship}/approve', [ScholarshipController::class, 'approve'])->name('scholarships.approve');
        Route::post('/scholarships/{scholarship}/reject', [ScholarshipController::class, 'reject'])->name('scholarships.reject');
        Route::delete('/scholarships/{scholarship}', [ScholarshipController::class, 'destroy'])->name('scholarships.destroy');
    });

    // Bulk Operations Dashboard
    Route::middleware('permission:students.manage')->group(function () {
        Route::get('/bulk-operations', [BulkOperationsController::class, 'index'])->name('bulk-operations.index');
        Route::post('/bulk-operations/promote', [BulkOperationsController::class, 'promote'])->name('bulk-operations.promote');
        Route::post('/bulk-operations/graduate', [BulkOperationsController::class, 'graduate'])->name('bulk-operations.graduate');
        Route::post('/bulk-operations/generate-dva', [BulkOperationsController::class, 'generateVirtualAccounts'])->name('bulk-operations.generate-dva');
        Route::post('/bulk-operations/set-payment-status', [BulkOperationsController::class, 'setPaymentStatus'])->name('bulk-operations.set-payment-status');
        Route::post('/bulk-operations/apply-fee', [BulkOperationsController::class, 'applyFeeToClass'])->name('bulk-operations.apply-fee');
    });

    // Alumni Management
    Route::middleware('permission:students.manage')->group(function () {
        Route::get('/alumni', [AlumniController::class, 'index'])->name('alumni.index');
        Route::post('/alumni/{id}/restore', [AlumniController::class, 'restore'])->name('alumni.restore');
        Route::delete('/alumni/{id}', [AlumniController::class, 'destroy'])->name('alumni.destroy');
        Route::post('/students/bulk-move-to-alumni', [App\Http\Controllers\StudentController::class, 'bulkMoveToAlumni'])->name('students.bulk-move-to-alumni');
    });

    // SMS Notifications
    Route::middleware('permission:students.manage')->group(function () {
        Route::get('/sms', [SmsController::class, 'index'])->name('sms.index');
        Route::get('/sms/logs', [SmsController::class, 'logs'])->name('sms.logs');
        Route::post('/sms/toggle', [SmsController::class, 'toggleEnabled'])->name('sms.toggle');
        Route::post('/sms/templates/save', [SmsController::class, 'saveTemplate'])->name('sms.templates.save');
        Route::delete('/sms/templates/{id}', [SmsController::class, 'deleteTemplate'])->name('sms.templates.delete');
        Route::post('/sms/class-settings', [SmsController::class, 'updateClassSettings'])->name('sms.class-settings');
        Route::post('/sms/send-bulk', [SmsController::class, 'sendBulk'])->name('sms.send-bulk');
        Route::post('/sms/send-reminders', [SmsController::class, 'sendPaymentReminders'])->name('sms.send-reminders');
        Route::get('/sms/students', [SmsController::class, 'getStudents'])->name('sms.students');
    });

    // API: Get student count for a class (used by SMS bulk send)
    Route::get('/api/students/count', function (\Illuminate\Http\Request $request) {
        $classId = $request->query('class_id');
        $subClassId = $request->query('sub_class_id');
        $status = $request->query('status', 'active');
        $institutionId = auth()->user()?->institution_id;
        if (!$institutionId || !$classId) return response()->json(['count' => 0]);
        $query = \App\Models\Student::where('institution_id', $institutionId)
            ->where('class_id', $classId);
        if ($subClassId) $query->where('sub_class_id', $subClassId);
        if ($status) $query->where('status', $status);
        return response()->json(['count' => $query->count()]);
    })->middleware('auth');

    // Inventory Management (Storekeeper Module)
    Route::middleware('permission:inventory.manage')->group(function () {
        Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('/inventory/categories', [InventoryController::class, 'storeCategory'])->name('inventory.categories.store');
        Route::delete('/inventory/categories/{id}', [InventoryController::class, 'deleteCategory'])->name('inventory.categories.delete');
        Route::post('/inventory/items', [InventoryController::class, 'storeItem'])->name('inventory.items.store');
        Route::post('/inventory/items/{id}', [InventoryController::class, 'updateItem'])->name('inventory.items.update');
        Route::post('/inventory/stock/add', [InventoryController::class, 'addStock'])->name('inventory.stock.add');
        Route::post('/inventory/stock/issue', [InventoryController::class, 'issueItem'])->name('inventory.stock.issue');
    });

    Route::get('/academic-sessions', [AcademicSessionController::class, 'index'])->name('academic-sessions.index');
    
    Route::middleware('permission:sessions.manage')->group(function () {
        Route::post('/academic-sessions', [AcademicSessionController::class, 'store'])->name('academic-sessions.store');
        Route::post('/academic-sessions/{session}/set-term', [AcademicSessionController::class, 'setTerm'])->name('academic-sessions.set-term');
        Route::post('/academic-sessions/{session}/next-term', [AcademicSessionController::class, 'nextTerm'])->name('academic-sessions.next-term');
        Route::put('/academic-sessions/{session}/toggle-status', [AcademicSessionController::class, 'toggleStatus'])->name('academic-sessions.toggle-status');
    });

    // Collection Reports
    Route::middleware('permission:payments.view')->group(function () {
        Route::get('/reports', [App\Http\Controllers\ReportsController::class, 'index'])->name('reports.index');
        Route::get('/reports/export', [App\Http\Controllers\ReportsController::class, 'exportCsv'])->name('reports.export');
        Route::get('/installments', [App\Http\Controllers\InstallmentController::class, 'index'])->name('installments.index');
    });

    // API-like routes for components
    Route::get('/api/payments/class-detail/{classId}', [PaymentController::class, 'classDetails']);
});
