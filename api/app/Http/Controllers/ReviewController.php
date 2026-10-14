<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Review;
use App\Models\ReviewLog;
use App\Services\Sm2Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReviewController extends Controller
{
    public function today(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 500);
        if ($limit < 1 || $limit > 2000) {
            $limit = 500;
        }

        // Cacheia a base (até 2000) sob chave única; o limite é aplicado em memória
        // para não multiplicar chaves nem estourar memória com pendências grandes.
        $base = Cache::remember('reviews:today:'.now()->format('Y-m-d-H'), 300, function () {
            $todayEnd = now()->endOfDay();

            return Review::with(['question', 'question.subject', 'question.notebooks'])
                ->where('next_review', '<=', $todayEnd)
                ->orderBy('next_review')
                ->limit(2000)
                ->get();
        });

        return response()->json($base->take($limit)->values());
    }

    public function submit(Request $request, Question $question, Sm2Service $sm2): JsonResponse
    {
        $data = $request->validate([
            'correct' => 'required|boolean',
            'selected_answer' => 'nullable|string|max:5',
            'time_spent' => 'nullable|integer|min:0|max:86400',
        ]);

        $review = Review::where('question_id', $question->id)->first();
        if (! $review) {
            return response()->json(['error' => 'revisão não encontrada'], 404);
        }

        $result = $sm2->calculateNextReview(
            (bool) $data['correct'],
            (float) $review->ease_factor,
            (int) $review->interval,
            (int) $review->repetitions,
        );

        $now = now();
        $review->update([
            'ease_factor' => $result['ease_factor'],
            'interval' => $result['interval'],
            'repetitions' => $result['repetitions'],
            'next_review' => $now->copy()->addDays($result['interval']),
        ]);

        ReviewLog::create([
            'question_id' => $review->question_id,
            'correct' => (bool) $data['correct'],
            'selected_answer' => $data['selected_answer'] ?? null,
            'time_spent' => $data['time_spent'] ?? 0,
            'reviewed_at' => $now,
        ]);

        Cache::forget('reviews:today:'.$now->format('Y-m-d-H'));
        Cache::forget('stats:detailed');
        Cache::forget('stats:heatmap:'.$now->year);

        return response()->json([
            'message' => 'revisão registrada',
            'next_review' => $review->next_review,
            'interval' => $result['interval'],
            'ease_factor' => $result['ease_factor'],
            'repetitions' => $result['repetitions'],
        ]);
    }

    public function logs(Request $request): JsonResponse
    {
        $query = ReviewLog::with(['question', 'question.subject']);

        if ($s = $request->query('subject_id')) {
            $query->whereHas('question', fn ($q) => $q->where('subject_id', $s));
        }
        if ($request->query('correct') === 'true') {
            $query->where('correct', true);
        } elseif ($request->query('correct') === 'false') {
            $query->where('correct', false);
        }
        if (($days = $request->query('days')) && (int) $days > 0) {
            $query->where('reviewed_at', '>=', now()->subDays((int) $days));
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = (int) $request->query('limit', 30);
        if ($limit < 1 || $limit > 100) {
            $limit = 30;
        }

        $total = (clone $query)->count();
        $logs = $query->orderByDesc('reviewed_at')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $logs,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => (int) ceil($total / $limit),
        ]);
    }

    public function stats(): JsonResponse
    {
        $todayStart = now()->startOfDay();

        $totalReviews = ReviewLog::count();
        $todayReviews = ReviewLog::where('reviewed_at', '>=', $todayStart)->count();
        $correctReviews = ReviewLog::where('correct', true)->count();
        $todayCorrect = ReviewLog::where('reviewed_at', '>=', $todayStart)->where('correct', true)->count();

        return response()->json([
            'total_questions' => Question::count(),
            'total_reviews' => $totalReviews,
            'today_reviews' => $todayReviews,
            'accuracy' => $totalReviews > 0 ? $correctReviews / $totalReviews * 100 : 0,
            'today_accuracy' => $todayReviews > 0 ? $todayCorrect / $todayReviews * 100 : 0,
            'pending_reviews' => Review::where('next_review', '<=', now())->count(),
        ]);
    }

    public function calendar(Request $request): JsonResponse
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        if (! $year) {
            return response()->json(['error' => 'ano invalido'], 400);
        }
        if ($month < 1 || $month > 12) {
            return response()->json(['error' => 'mes invalido'], 400);
        }

        $start = now()->setDate($year, $month, 1)->startOfDay();
        $end = (clone $start)->endOfMonth()->endOfDay();

        $results = Review::selectRaw('DATE(next_review) as date, COUNT(*) as count')
            ->whereBetween('next_review', [$start, $end])
            ->groupByRaw('DATE(next_review)')
            ->orderBy('date')
            ->get();

        return response()->json($results);
    }

    public function heatmap(Request $request): JsonResponse
    {
        $year = (int) $request->query('year', now()->year);
        if (! $year) {
            return response()->json(['error' => 'ano invalido'], 400);
        }

        $data = Cache::remember("stats:heatmap:{$year}", 3600, function () use ($year) {
            $start = now()->setDate($year, 1, 1)->startOfDay();
            $end = now()->setDate($year, 12, 31)->endOfDay();

            $rows = ReviewLog::selectRaw('DATE(reviewed_at) as date, COUNT(*) as count')
                ->whereBetween('reviewed_at', [$start, $end])
                ->groupByRaw('DATE(reviewed_at)')
                ->orderBy('date')
                ->get()
                ->keyBy('date');

            $full = [];
            $current = $start->copy();
            while ($current <= $end) {
                $key = $current->format('Y-m-d');
                $full[] = ['date' => $key, 'count' => (int) ($rows[$key]->count ?? 0)];
                $current->addDay();
            }

            return $full;
        });

        return response()->json($data);
    }
}
