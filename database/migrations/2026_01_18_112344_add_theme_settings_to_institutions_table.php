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
        Schema::table('institutions', function (Blueprint $table) {
            $table->string('primary_color')->default('#E91E63')->after('email');
            $table->string('sidebar_color')->default('#FFFFFF')->after('primary_color');
            $table->string('secondary_color')->default('#3B82F6')->after('sidebar_color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('institutions', function (Blueprint $table) {
            $table->dropColumn(['primary_color', 'sidebar_color', 'secondary_color']);
        });
    }
};
