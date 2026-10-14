<?php

namespace App\Http\Controllers;

use App\Models\PhrasalReview;
use App\Models\PhrasalReviewLog;
use App\Models\PhrasalVerb;
use App\Services\Sm2Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PhrasalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PhrasalVerb::query();

        if ($s = $request->query('search')) {
            $query->where(fn ($q) => $q->where('verb', 'ilike', "%{$s}%")->orWhere('meaning', 'ilike', "%{$s}%"));
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = (int) $request->query('limit', 50);
        if ($limit < 1 || $limit > 200) {
            $limit = 50;
        }

        $total = (clone $query)->count();
        $verbs = $query->orderBy('verb')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $verbs,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => (int) ceil($total / $limit),
        ]);
    }

    public function seed(): JsonResponse
    {
        if (app()->isProduction() && ! env('ALLOW_SEED')) {
            return response()->json(['error' => 'seed desabilitado em produção'], 403);
        }

        $seeds = PhrasalSeeds::all();
        $created = 0;
        $skipped = 0;

        foreach ($seeds as $pv) {
            if (PhrasalVerb::where('verb', $pv['verb'])->exists()) {
                $skipped++;

                continue;
            }

            try {
                DB::transaction(function () use ($pv) {
                    $verb = PhrasalVerb::create($pv);
                    PhrasalReview::create([
                        'phrasal_id' => $verb->id,
                        'ease_factor' => 2.5,
                        'interval' => 0,
                        'repetitions' => 0,
                        'next_review' => now(),
                    ]);
                });
                $created++;
            } catch (\Throwable) {
                $skipped++;
            }
        }

        return response()->json([
            'message' => "{$created} phrasal verbs carregados",
            'created' => $created,
            'skipped' => $skipped,
            'total' => count($seeds),
        ]);
    }

    public function due(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 500);
        if ($limit < 1 || $limit > 2000) {
            $limit = 500;
        }
        $todayEnd = now()->endOfDay();

        return response()->json(
            PhrasalReview::with('phrasal')
                ->where('next_review', '<=', $todayEnd)
                ->orderBy('next_review')
                ->limit($limit)
                ->get()
        );
    }

    public function submit(Request $request, PhrasalReview $review, Sm2Service $sm2): JsonResponse
    {
        $data = $request->validate([
            'rating' => 'nullable|string|in:again,hard,good,easy',
            'correct' => 'nullable|boolean',
            'mode' => 'nullable|string',
            'time_spent' => 'nullable|integer|min:0',
        ]);

        $result = $sm2->applyAnkiRating(
            $data['rating'] ?? 'good',
            (float) $review->ease_factor,
            (int) $review->interval,
            (int) $review->repetitions,
        );

        $now = now();
        $review->update([
            'ease_factor' => $result['ease_factor'],
            'interval' => $result['interval'],
            'repetitions' => $result['repetitions'],
            'next_review' => $result['interval'] > 0 ? $now->copy()->addDays($result['interval']) : $now,
        ]);

        PhrasalReviewLog::create([
            'phrasal_id' => $review->phrasal_id,
            'correct' => (bool) ($data['correct'] ?? false),
            'rating' => $data['rating'] ?? null,
            'mode' => $data['mode'] ?? null,
            'time_spent' => $data['time_spent'] ?? 0,
            'reviewed_at' => $now,
        ]);

        return response()->json([
            'message' => 'revisão registrada',
            'next_review' => $review->next_review,
            'interval' => $result['interval'],
            'ease_factor' => $result['ease_factor'],
            'repetitions' => $result['repetitions'],
        ]);
    }

    public function stats(): JsonResponse
    {
        $total = PhrasalVerb::count();
        $due = PhrasalReview::where('next_review', '<=', now())->count();
        $mastered = PhrasalReview::where('interval', '>=', 21)->count();
        $totalLogs = PhrasalReviewLog::count();
        $correctLogs = PhrasalReviewLog::where('correct', true)->count();
        $todayReviews = PhrasalReviewLog::where('reviewed_at', '>=', now()->startOfDay())->count();

        return response()->json([
            'total' => $total,
            'due' => $due,
            'mastered' => $mastered,
            'total_reviews' => $totalLogs,
            'today_reviews' => $todayReviews,
            'accuracy' => $totalLogs > 0 ? $correctLogs / $totalLogs * 100 : 0,
        ]);
    }
}
