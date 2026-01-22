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
        Schema::table('sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('sessions', 'current_term')) {
                $table->string('current_term')->default('First Term')->after('name');
            }
        });

        // Update fees cycle enum to include one-time
        // Using raw DB statement to ensure compatibility for enum changes
        if (config('database.default') === 'mysql') {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE fees MODIFY COLUMN cycle ENUM('termly', 'annually', 'one-time') DEFAULT 'termly'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('current_term');
        });

        if (config('database.default') === 'mysql') {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE fees MODIFY COLUMN cycle ENUM('termly', 'annually') DEFAULT 'termly'");
        }
    }
};
