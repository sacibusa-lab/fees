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
        Schema::table('fee_beneficiaries', function (Blueprint $table) {
            $table->dropColumn('percentage');
            $table->decimal('amount', 10, 2)->default(0)->after('bank_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fee_beneficiaries', function (Blueprint $table) {
            $table->dropColumn('amount');
            $table->decimal('percentage', 5, 2)->default(0);
        });
    }
};
