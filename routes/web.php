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
        Route::get('/{student}', [StudentController::class, 'show'])->name('students.show');
        Route::get('/export', [StudentController::class, 'export'])->name('students.export');
        Route::get('/template', [StudentController::class, 'downloadTemplate'])->name('students.template');

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

    Route::get('/academic-sessions', [AcademicSessionController::class, 'index'])->name('academic-sessions.index');
    
    Route::middleware('permission:sessions.manage')->group(function () {
        Route::post('/academic-sessions', [AcademicSessionController::class, 'store'])->name('academic-sessions.store');
        Route::post('/academic-sessions/{session}/set-term', [AcademicSessionController::class, 'setTerm'])->name('academic-sessions.set-term');
        Route::post('/academic-sessions/{session}/next-term', [AcademicSessionController::class, 'nextTerm'])->name('academic-sessions.next-term');
        Route::put('/academic-sessions/{session}/toggle-status', [AcademicSessionController::class, 'toggleStatus'])->name('academic-sessions.toggle-status');
    });

    // API-like routes for components
    Route::get('/api/payments/class-detail/{classId}', [PaymentController::class, 'classDetails']);
});
