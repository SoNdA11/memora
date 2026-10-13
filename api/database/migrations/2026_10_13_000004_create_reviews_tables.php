<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->unique()->constrained()->cascadeOnDelete();
            $table->float('ease_factor')->default(2.5);
            $table->integer('interval')->default(0);
            $table->integer('repetitions')->default(0);
            $table->timestamp('next_review')->nullable();
            $table->timestamps();
            $table->index('next_review');
        });

        Schema::create('review_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->boolean('correct')->default(false);
            $table->string('selected_answer')->nullable();
            $table->integer('time_spent')->default(0);
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['question_id', 'reviewed_at']);
            $table->index('reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_logs');
        Schema::dropIfExists('reviews');
    }
};
