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
        Schema::table('fees', function (Blueprint $table) {
            $table->boolean('first_term_active')->default(true)->after('status');
            $table->boolean('second_term_active')->default(true)->after('first_term_active');
            $table->boolean('third_term_active')->default(true)->after('second_term_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn(['first_term_active', 'second_term_active', 'third_term_active']);
        });
    }
};
