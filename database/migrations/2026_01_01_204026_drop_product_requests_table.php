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
        Schema::dropIfExists('product_requests');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('product_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('sku', 50);
            $table->string('name');
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('color', 50)->nullable();
            $table->string('size', 50)->nullable();
            $table->decimal('price', 15, 2);
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('pending');
            $table->text('request_notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }
};
