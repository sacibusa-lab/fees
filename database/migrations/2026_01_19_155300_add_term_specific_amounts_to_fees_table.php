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
            $table->decimal('first_term_amount', 10, 2)->nullable()->after('amount');
            $table->decimal('second_term_amount', 10, 2)->nullable()->after('first_term_amount');
            $table->decimal('third_term_amount', 10, 2)->nullable()->after('second_term_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fees', function (Blueprint $table) {
            $table->dropColumn(['first_term_amount', 'second_term_amount', 'third_term_amount']);
        });
    }
};
