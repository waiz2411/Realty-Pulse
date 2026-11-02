<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('source')->default('Other');
            $table->string('property_type')->default('Apartment');
            $table->string('interested_property')->nullable();
            $table->string('preferred_location')->nullable();
            $table->string('budget')->nullable();
            $table->string('status')->default('new');
            $table->string('priority')->default('medium');
            $table->date('follow_up_date')->nullable();
            $table->timestamps();

            $table->index(['agent_id', 'status']);
            $table->index('follow_up_date');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
