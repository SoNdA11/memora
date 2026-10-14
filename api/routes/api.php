<?php

use App\Http\Controllers\AnnotationController;
use App\Http\Controllers\EditalController;
use App\Http\Controllers\ExamAnalysisController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\NotebookController;
use App\Http\Controllers\PhrasalController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TheoryController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    try {
        DB::select('select 1');

        return response()->json(['status' => 'ok', 'db' => 'up']);
    } catch (Throwable) {
        return response()->json(['status' => 'ok', 'db' => 'fail'], 503);
    }
});

Route::middleware('throttle:120,1')->group(function () {
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::post('/subjects', [SubjectController::class, 'store']);
    Route::put('/subjects/{subject}', [SubjectController::class, 'update']);
    Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);
    Route::post('/subjects/merge', [SubjectController::class, 'merge']);

    Route::get('/questions', [QuestionController::class, 'index']);
    Route::post('/questions', [QuestionController::class, 'store']);
    Route::get('/questions/{question}', [QuestionController::class, 'show']);
    Route::put('/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);
    Route::post('/questions/{question}/favorite', [QuestionController::class, 'toggleFavorite']);

    Route::get('/topics', [QuestionController::class, 'topics']);

    Route::get('/notebooks', [NotebookController::class, 'index']);
    Route::post('/notebooks', [NotebookController::class, 'store']);
    Route::get('/notebooks/{notebook}', [NotebookController::class, 'show']);
    Route::put('/notebooks/{notebook}', [NotebookController::class, 'update']);
    Route::delete('/notebooks/{notebook}', [NotebookController::class, 'destroy']);
    Route::post('/notebooks/{notebook}/questions', [NotebookController::class, 'attach']);
    Route::delete('/notebooks/{notebook}/questions/{qid}', [NotebookController::class, 'detach']);

    Route::get('/reviews/today', [ReviewController::class, 'today']);
    Route::get('/reviews/logs', [ReviewController::class, 'logs']);
    Route::post('/reviews/{question}', [ReviewController::class, 'submit']);

    Route::get('/stats', [ReviewController::class, 'stats']);
    Route::get('/stats/detailed', [StatsController::class, 'detailed']);

    Route::get('/theory', [TheoryController::class, 'index']);
    Route::get('/subjects/{subject}/theory', [TheoryController::class, 'bySubject']);
    Route::get('/theory/{theory}', [TheoryController::class, 'show']);
    Route::post('/subjects/{subject}/theory', [TheoryController::class, 'store']);
    Route::put('/theory/{theory}', [TheoryController::class, 'update']);
    Route::delete('/theory/{theory}', [TheoryController::class, 'destroy']);

    Route::get('/questions/{question}/annotations', [AnnotationController::class, 'index']);
    Route::post('/questions/{question}/annotations', [AnnotationController::class, 'store']);
    Route::put('/annotations/{annotation}', [AnnotationController::class, 'update']);
    Route::delete('/annotations/{annotation}', [AnnotationController::class, 'destroy']);

    Route::get('/reviews/calendar', [ReviewController::class, 'calendar']);
    Route::get('/stats/heatmap', [ReviewController::class, 'heatmap']);

    Route::get('/theory/{theory}/pdf', [TheoryController::class, 'exportPdf']);
    Route::patch('/theory/{theory}/toggle', [TheoryController::class, 'toggle']);
    Route::patch('/theory/{theory}/current', [TheoryController::class, 'toggleCurrent']);

    Route::get('/edital/graph', [EditalController::class, 'graph']);
    Route::get('/edital/topics', [EditalController::class, 'topics']);
    Route::post('/edital/link', [EditalController::class, 'link']);
    Route::delete('/edital/link', [EditalController::class, 'unlink']);

    Route::get('/exams', [ExamController::class, 'index']);
    Route::post('/exams', [ExamController::class, 'store']);
    Route::put('/exams/{exam}', [ExamController::class, 'update']);
    Route::delete('/exams/{exam}', [ExamController::class, 'destroy']);

    Route::get('/exam-analyses', [ExamAnalysisController::class, 'index']);
    Route::post('/exam-analyses', [ExamAnalysisController::class, 'store']);
    Route::get('/exam-analyses/{examAnalysis}', [ExamAnalysisController::class, 'show']);
    Route::put('/exam-analyses/{examAnalysis}', [ExamAnalysisController::class, 'update']);
    Route::delete('/exam-analyses/{examAnalysis}', [ExamAnalysisController::class, 'destroy']);

    Route::get('/phrasal-verbs', [PhrasalController::class, 'index']);
    Route::get('/phrasal-verbs/reviews/today', [PhrasalController::class, 'due']);
    Route::post('/phrasal-verbs/reviews/{review}', [PhrasalController::class, 'submit']);
    Route::get('/phrasal-verbs/stats', [PhrasalController::class, 'stats']);

    // Operações pesadas (bulk/seed): throttle mais restritivo.
    Route::middleware('throttle:15,1')->group(function () {
        Route::post('/questions/bulk', [QuestionController::class, 'bulk']);
        Route::post('/theory/seed', [TheoryController::class, 'seed']);
        Route::post('/edital/seed', [EditalController::class, 'seed']);
        Route::post('/phrasal-verbs/seed', [PhrasalController::class, 'seed']);
    });
});
