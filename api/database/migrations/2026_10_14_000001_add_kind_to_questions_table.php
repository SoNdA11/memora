<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // `kind` separa cards de questão (multipla escolha) dos flashcards (certo/errado)
        // gerados a partir da análise de questões. Cada tipo tem sua própria aba de revisão.
        Schema::table('questions', function (Blueprint $table) {
            $table->string('kind', 32)->default('question')->after('question_type');
            $table->index(['kind', 'created_at']);
        });

        // Backfill: cards já existentes com tag "flashcard" viram kind=flashcard.
        DB::table('questions')
            ->where('tags', 'like', '%"flashcard"%')
            ->update(['kind' => 'flashcard']);
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex(['kind', 'created_at']);
            $table->dropColumn('kind');
        });
    }
};
