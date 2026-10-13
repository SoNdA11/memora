<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('theory_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('topic');
            $table->string('title');
            $table->text('content');
            $table->string('source')->nullable();
            $table->text('tags')->default('[]');
            $table->string('notebooklm_url')->nullable();
            $table->boolean('completed')->default(false);
            $table->boolean('current')->default(false);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index('subject_id');
        });

        Schema::create('annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
            $table->index('question_id');
        });

        Schema::create('exam_dates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('date', 16);
            $table->text('description')->nullable();
            $table->string('url')->nullable();
            $table->timestamps();
        });

        Schema::create('exam_analyses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('exam_org')->nullable();
            $table->integer('year')->nullable();
            $table->string('role')->nullable();
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_analyses');
        Schema::dropIfExists('exam_dates');
        Schema::dropIfExists('annotations');
        Schema::dropIfExists('theory_entries');
    }
};
