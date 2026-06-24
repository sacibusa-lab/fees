<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Make class_id nullable to allow global subclasses
        Schema::table('sub_classes', function (Blueprint $table) {
            $table->unsignedBigInteger('class_id')->nullable()->change();
        });

        // Get all subclasses grouped by their institution (via class)
        $subclasses = DB::table('sub_classes')
            ->join('classes', 'sub_classes.class_id', '=', 'classes.id')
            ->select('sub_classes.*', 'classes.institution_id')
            ->get()
            ->groupBy('institution_id');

        foreach ($subclasses as $institutionId => $institutionSubclasses) {
            // Group by name to find duplicates
            $byName = $institutionSubclasses->groupBy('name');

            foreach ($byName as $name => $duplicates) {
                if ($duplicates->count() > 1) {
                    // Keep the first one
                    $keepId = $duplicates->first()->id;
                    $deleteIds = $duplicates->skip(1)->pluck('id')->toArray();

                    // Update students pointing to duplicate subclasses
                    DB::table('students')
                        ->whereIn('sub_class_id', $deleteIds)
                        ->update(['sub_class_id' => $keepId]);

                    // Delete duplicate subclasses
                    DB::table('sub_classes')
                        ->whereIn('id', $deleteIds)
                        ->delete();
                }
            }
        }

        // Set class_id to null for all remaining subclasses to make them global
        DB::table('sub_classes')->update(['class_id' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: We cannot fully reverse this migration as we've deleted duplicate records
        // We can only make class_id non-nullable again, but this will fail if there are null values
        Schema::table('sub_classes', function (Blueprint $table) {
            $table->unsignedBigInteger('class_id')->nullable(false)->change();
        });
    }
};
