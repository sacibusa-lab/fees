<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->nullable()->constrained()->onDelete('set null');
            $table->string('reference')->unique();
            $table->string('gateway_reference')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('NGN');
            $table->string('channel')->nullable(); // card, bank, ussd
            $table->string('gateway')->default('paystack');
            $table->enum('status', ['pending', 'success', 'failed', 'abandoned'])->default('pending');
            $table->json('metadata')->nullable(); // Store fee_ids, session_id etc
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
