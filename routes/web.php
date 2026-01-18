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

Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::get('/fees', [App\Http\Controllers\FeeController::class, 'index'])->name('fees.index');
    Route::post('/fees', [App\Http\Controllers\FeeController::class, 'store'])->name('fees.store');
    Route::get('/fees/{fee}', [App\Http\Controllers\FeeController::class, 'show'])->name('fees.show'); // New Show Route
    Route::put('/fees/{fee}', [App\Http\Controllers\FeeController::class, 'update'])->name('fees.update');
    Route::delete('/fees/{fee}', [App\Http\Controllers\FeeController::class, 'destroy'])->name('fees.destroy');
    Route::put('/fees/{fee}/toggle-status', [App\Http\Controllers\FeeController::class, 'toggleStatus'])->name('fees.toggle-status');
    Route::post('/fees/{fee}/beneficiaries', [App\Http\Controllers\FeeController::class, 'manageBeneficiaries'])->name('fees.beneficiaries');

    Route::prefix('business')->group(function () {
        Route::get('/bank-accounts', [App\Http\Controllers\BankAccountController::class, 'index'])->name('bank-accounts.index');
        Route::post('/bank-accounts/validate', [App\Http\Controllers\BankAccountController::class, 'validateAccount'])->name('bank-accounts.validate');
        Route::post('/bank-accounts', [App\Http\Controllers\BankAccountController::class, 'store'])->name('bank-accounts.store');
        Route::put('/bank-accounts/{bankAccount}', [App\Http\Controllers\BankAccountController::class, 'update'])->name('bank-accounts.update');
        Route::delete('/bank-accounts/{bankAccount}', [App\Http\Controllers\BankAccountController::class, 'destroy'])->name('bank-accounts.destroy');
    });
    
    Route::prefix('students')->group(function () {
        // Specific routes FIRST
        Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
        Route::put('/classes/{schoolClass}', [ClassController::class, 'update'])->name('classes.update');
        
        Route::get('/sub-classes', [ClassController::class, 'subClasses'])->name('sub-classes.index');
        Route::post('/sub-classes', [ClassController::class, 'store'])->name('sub-classes.store');
        Route::put('/sub-classes/{subClass}', [ClassController::class, 'updateSubClass'])->name('sub-classes.update');
        
        Route::post('/promote', [StudentController::class, 'promote'])->name('students.promote');
        Route::get('/export', [StudentController::class, 'export'])->name('students.export');
        Route::get('/template', [StudentController::class, 'downloadTemplate'])->name('students.template');
        Route::post('/import', [StudentController::class, 'import'])->name('students.import');

        // Root resource routes
        Route::get('/', [StudentController::class, 'index'])->name('students.index');
        Route::post('/', [StudentController::class, 'store'])->name('students.store');
        
        // Wildcard routes LAST (Model Binding)
        Route::put('/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::get('/{student}', [StudentController::class, 'show'])->name('students.show');
    });

    Route::prefix('settings')->group(function () {
        Route::get('/', [App\Http\Controllers\SettingsController::class, 'index'])->name('settings.index');
        Route::get('/global', [App\Http\Controllers\SettingsController::class, 'global'])->name('settings.global');
        Route::post('/global', [App\Http\Controllers\SettingsController::class, 'updateGlobal'])->name('settings.global.update');
        Route::get('/roles', [App\Http\Controllers\SettingsController::class, 'roles'])->name('settings.roles');
        Route::get('/api', [App\Http\Controllers\SettingsController::class, 'api'])->name('settings.api');
        Route::post('/api', [App\Http\Controllers\SettingsController::class, 'updateApi'])->name('settings.api.update');
    });

    Route::get('/payments/overview', [PaymentController::class, 'overview'])->name('payments.overview');
    Route::get('/payments/transactions', [PaymentController::class, 'transactions'])->name('payments.transactions');
    Route::get('/payments/transactions/{transaction}', [PaymentController::class, 'show'])->name('payments.transactions.show');
    Route::get('/academic-sessions', [AcademicSessionController::class, 'index'])->name('academic-sessions.index');

    // API-like routes for components
    Route::get('/api/payments/verify', [PaymentController::class, 'verifyStatus']);
});
