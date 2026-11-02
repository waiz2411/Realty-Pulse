<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->foreignId('agent_id')->constrained('users')->onDelete('cascade');
            $table->string('activity_type');
            $table->string('description');
            $table->string('old_value')->nullable();
            $table->string('new_value')->nullable();
            $table->timestamps();

            $table->index('lead_id');
            $table->index('agent_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_activities');
    }
};
