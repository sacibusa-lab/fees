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
        Schema::table('sub_classes', function (Blueprint $table) {
            $table->foreignId('institution_id')->nullable()->after('id')->constrained()->onDelete('cascade');
        });

        // Recover institution_id from students table for existing global subclasses
        DB::statement("
            UPDATE sub_classes 
            SET institution_id = (
                SELECT students.institution_id 
                FROM students 
                WHERE students.sub_class_id = sub_classes.id 
                LIMIT 1
            )
            WHERE institution_id IS NULL
        ");

        // For any orphans (subclasses with no students), assign the first available institution_id
        // This is a safety measure for the current environment
        $firstInstitution = DB::table('institutions')->first();
        if ($firstInstitution) {
            DB::table('sub_classes')
                ->whereNull('institution_id')
                ->update(['institution_id' => $firstInstitution->id]);
        }

        // Now make it non-nullable if we want strict scoping, but for now let's keep it nullable if there's any chance of failure
        // Actually, let's keep it nullable for safety but we'll scope queries.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sub_classes', function (Blueprint $table) {
            $table->dropForeign(['institution_id']);
            $table->dropColumn('institution_id');
        });
    }
};
