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
        // Branches - index untuk query aktif
        Schema::table('branches', function (Blueprint $table) {
            $table->index('is_active');
        });

        // Categories - index untuk query aktif
        Schema::table('categories', function (Blueprint $table) {
            $table->index('is_active');
        });

        // Products - index untuk search dan filter
        Schema::table('products', function (Blueprint $table) {
            $table->index('is_active');
            $table->index('name');
            $table->index(['category_id', 'is_active']);
        });

        // Branch Stocks - index untuk query stok rendah
        Schema::table('branch_stocks', function (Blueprint $table) {
            $table->index('quantity');
        });

        // Transfers - index untuk filter status, tanggal, dan cabang
        Schema::table('transfers', function (Blueprint $table) {
            $table->index('status');
            $table->index(['from_branch_id', 'status']);
            $table->index(['to_branch_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        // Transfer Items - composite index
        Schema::table('transfer_items', function (Blueprint $table) {
            $table->index(['transfer_id', 'product_id']);
        });

        // Sales - index untuk laporan dan filter
        Schema::table('sales', function (Blueprint $table) {
            $table->index('sale_date');
            $table->index('payment_method');
            $table->index(['branch_id', 'sale_date']);
            $table->index(['user_id', 'sale_date']);
        });

        // Sale Items - composite index
        Schema::table('sale_items', function (Blueprint $table) {
            $table->index(['sale_id', 'product_id']);
            $table->index('product_id');
        });

        // Stock Movements - index untuk filter tipe dan reference
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index('type');
            $table->index('reference_type');
            $table->index(['reference_type', 'reference_id']);
        });

        // Users - index untuk filter aktif dan cabang
        Schema::table('users', function (Blueprint $table) {
            $table->index('is_active');
            $table->index(['branch_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropIndex(['name']);
            $table->dropIndex(['category_id', 'is_active']);
        });

        Schema::table('branch_stocks', function (Blueprint $table) {
            $table->dropIndex(['quantity']);
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['from_branch_id', 'status']);
            $table->dropIndex(['to_branch_id', 'status']);
            $table->dropIndex(['status', 'created_at']);
        });

        Schema::table('transfer_items', function (Blueprint $table) {
            $table->dropIndex(['transfer_id', 'product_id']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['sale_date']);
            $table->dropIndex(['payment_method']);
            $table->dropIndex(['branch_id', 'sale_date']);
            $table->dropIndex(['user_id', 'sale_date']);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropIndex(['sale_id', 'product_id']);
            $table->dropIndex(['product_id']);
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['reference_type']);
            $table->dropIndex(['reference_type', 'reference_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropIndex(['branch_id', 'is_active']);
        });
    }
};
