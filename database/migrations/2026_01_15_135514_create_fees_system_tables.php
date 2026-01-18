<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institutions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('portal_id')->unique();
            $table->string('logo')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestamps();
        });

        Schema::create('class_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_category_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('sub_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('sub_class_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('admission_number')->unique();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('gender')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_phone')->nullable();
            $table->text('address')->nullable();
            $table->string('avatar')->nullable();
            $table->enum('payment_status', ['paid', 'pending', 'partial'])->default('pending');
            $table->enum('status', ['active', 'inactive', 'graduated'])->default('active');
            $table->timestamps();
        });

        Schema::create('fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('class_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->string('revenue_code')->nullable();
            $table->enum('cycle', ['termly', 'annually'])->default('termly');
            $table->enum('type', ['compulsory', 'optional'])->default('compulsory');
            $table->enum('payee_allowed', ['students', 'all'])->default('students');
            $table->decimal('amount', 10, 2);
            $table->enum('charge_bearer', ['self', 'institution'])->default('self');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('payment_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('fee_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('reserved', 10, 2)->default(0);
            $table->decimal('expected', 10, 2)->default(0);
            $table->decimal('total_received', 10, 2)->default(0);
            $table->decimal('debt', 10, 2)->default(0);
            $table->decimal('discount_applied', 10, 2)->default(0);
            $table->decimal('extra_applied', 10, 2)->default(0);
            $table->integer('completed_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_summaries');
        Schema::dropIfExists('fees');
        Schema::dropIfExists('students');
        Schema::dropIfExists('sub_classes');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('class_categories');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('institutions');
    }
};
