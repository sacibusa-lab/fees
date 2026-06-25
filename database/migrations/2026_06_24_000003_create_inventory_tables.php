<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Categories
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('institution_id')->index();
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Items
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('institution_id')->index();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('name');
            $table->string('sku')->nullable()->unique();
            $table->text('description')->nullable();
            $table->integer('quantity_in_stock')->default(0);
            $table->integer('reorder_level')->default(5);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->string('unit')->default('pcs');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('category_id');
        });

        // Transactions (stock in / stock out)
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('institution_id')->index();
            $table->unsignedBigInteger('item_id')->index();
            $table->string('type'); // 'in' (purchase/add) or 'out' (issued)
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2)->nullable(); // price at time of transaction
            $table->decimal('total_amount', 15, 2)->nullable();
            $table->unsignedBigInteger('student_id')->nullable()->index(); // who received (if type=out)
            $table->string('issued_to_name')->nullable(); // fallback if student_id not set
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_categories');
    }
};
