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
        Schema::table('transfers', function (Blueprint $table) {
            $table->renameColumn('transfer_date', 'requested_at');
        });

        // Change column type from date to timestamp
        Schema::table('transfers', function (Blueprint $table) {
            $table->timestamp('requested_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->date('requested_at')->change();
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->renameColumn('requested_at', 'transfer_date');
        });
    }
};
