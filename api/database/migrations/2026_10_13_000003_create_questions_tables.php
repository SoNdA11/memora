<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('topic');
            $table->text('text');
            $table->text('alternatives');
            $table->string('correct_answer');
            $table->string('question_type', 32)->default('multipla_escolha');
            $table->text('explanation')->nullable();
            $table->string('source')->nullable();
            $table->text('tags')->default('[]');
            $table->boolean('favorite')->default(false);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'subject_id']);
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('question_notebooks', function (Blueprint $table) {
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('notebook_id')->constrained()->cascadeOnDelete();
            $table->primary(['question_id', 'notebook_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_notebooks');
        Schema::dropIfExists('questions');
    }
};
