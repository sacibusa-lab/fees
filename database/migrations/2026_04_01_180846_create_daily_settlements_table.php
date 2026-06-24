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
        Schema::create('daily_settlements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('institution_id');
            $table->date('settlement_date');
            $table->decimal('total_collected', 15, 2)->default(0);
            $table->enum('status', ['awaiting_bank_settlement', 'ready_for_split', 'disbursed'])->default('ready_for_split');
            
            $table->timestamp('disbursed_at')->nullable();
            $table->unsignedBigInteger('disbursed_by')->nullable();
            
            $table->json('split_breakdown')->nullable();

            $table->timestamps();

            // Prevent duplicate entries for the same day/institution
            $table->unique(['institution_id', 'settlement_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_settlements');
    }
};
