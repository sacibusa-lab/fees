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
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('status')->default('active')->after('email');
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete()->after('status');
            $table->string('role')->nullable()->change(); // Make existing role column nullable if not already
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['username', 'status', 'role_id']);
            // $table->string('role')->change(); // Revert logic if needed
        });
    }
};
