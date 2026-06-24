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
        Schema::table('bank_accounts', function (Blueprint $table) {
            if (!Schema::hasColumn('bank_accounts', 'bank_code')) {
                $table->string('bank_code')->nullable()->after('bank_name');
            }
            if (!Schema::hasColumn('bank_accounts', 'sub_account_code')) {
                $table->string('sub_account_code')->nullable()->after('account_number');
            }
        });

        Schema::table('fee_beneficiaries', function (Blueprint $table) {
            if (!Schema::hasColumn('fee_beneficiaries', 'bank_code')) {
                $table->string('bank_code')->nullable()->after('bank_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropColumn(['bank_code', 'sub_account_code']);
        });

        Schema::table('fee_beneficiaries', function (Blueprint $table) {
            $table->dropColumn('bank_code');
        });
    }
};
