<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('edital_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('edital_items')->cascadeOnDelete();
            $table->string('module')->nullable();
            $table->string('subject')->nullable();
            $table->string('code', 32)->nullable();
            $table->text('title')->nullable();
            $table->timestamps();
        });

        Schema::create('edital_theory_links', function (Blueprint $table) {
            $table->foreignId('edital_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('theory_entry_id')->constrained()->cascadeOnDelete();
            $table->primary(['edital_item_id', 'theory_entry_id']);
        });

        Schema::create('phrasal_verbs', function (Blueprint $table) {
            $table->id();
            $table->string('verb')->unique();
            $table->string('meaning');
            $table->text('example')->nullable();
            $table->text('example_pt')->nullable();
            $table->timestamps();
        });

        Schema::create('phrasal_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('phrasal_id')->unique()->constrained('phrasal_verbs')->cascadeOnDelete();
            $table->float('ease_factor')->default(2.5);
            $table->integer('interval')->default(0);
            $table->integer('repetitions')->default(0);
            $table->timestamp('next_review')->nullable();
            $table->timestamps();
        });

        Schema::create('phrasal_review_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('phrasal_id')->constrained('phrasal_verbs')->cascadeOnDelete();
            $table->boolean('correct')->default(false);
            $table->string('rating', 16)->nullable();
            $table->string('mode', 32)->nullable();
            $table->integer('time_spent')->default(0);
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['phrasal_id', 'reviewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phrasal_review_logs');
        Schema::dropIfExists('phrasal_reviews');
        Schema::dropIfExists('phrasal_verbs');
        Schema::dropIfExists('edital_theory_links');
        Schema::dropIfExists('edital_items');
    }
};
