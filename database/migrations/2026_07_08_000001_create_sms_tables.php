<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SMS Templates - customizable message templates
        Schema::create('sms_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('institution_id');
            $table->string('name'); // e.g., payment_receipt, payment_reminder
            $table->string('label'); // Human-readable label
            $table->text('message'); // SMS body with placeholders like {name}, {amount}, {balance}, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('institution_id');
        });

        // SMS Logs - track all sent SMS
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('institution_id')->index();
            $table->unsignedBigInteger('student_id')->nullable()->index();
            $table->unsignedBigInteger('sms_template_id')->nullable()->index();
            $table->string('phone');
            $table->text('message');
            $table->string('status'); // sent, failed
            $table->text('provider_response')->nullable();
            $table->string('provider')->default('termii');
            $table->timestamps();
        });

        // Class SMS Settings - per-class/per-section SMS opt-in
        Schema::create('class_sms_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('institution_id')->index();
            $table->unsignedBigInteger('class_id')->index();
            $table->unsignedBigInteger('sub_class_id')->nullable()->index();
            $table->boolean('sms_enabled')->default(true);
            $table->timestamps();

            $table->unique(['institution_id', 'class_id', 'sub_class_id'], 'class_sms_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('sms_templates');
        Schema::dropIfExists('class_sms_settings');
    }
};
