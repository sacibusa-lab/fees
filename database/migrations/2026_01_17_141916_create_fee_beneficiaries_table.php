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
        Schema::create('fee_beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_id')->constrained()->onDelete('cascade');
            $table->string('account_name');
            $table->string('account_number');
            $table->string('bank_name');
            $table->decimal('percentage', 5, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_beneficiaries');
    }
};
