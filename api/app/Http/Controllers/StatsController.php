<?php

namespace App\Http\Controllers;

use App\Models\ReviewLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function detailed(): JsonResponse
    {
        $data = Cache::remember('stats:detailed', 300, function () {
            return [
                'by_subject' => $this->bySubject(),
                'daily' => $this->dailyActivity(30),
                'by_topic' => $this->byTopic(),
                'streak' => $this->streak(),
            ];
        });

        return response()->json($data);
    }

    private function bySubject(): array
    {
        $rows = DB::table('review_logs')
            ->selectRaw('questions.subject_id, subjects.name as subject_name, subjects.color,
                COUNT(DISTINCT questions.id) as total,
                SUM(CASE WHEN review_logs.correct THEN 1 ELSE 0 END) as correct,
                COUNT(review_logs.id) as total_reviews')
            ->join('questions', 'questions.id', '=', 'review_logs.question_id')
            ->join('subjects', 'subjects.id', '=', 'questions.subject_id')
            ->groupBy('questions.subject_id', 'subjects.name', 'subjects.color')
            ->get();

        return $rows->map(fn ($r) => [
            'subject_id' => (int) $r->subject_id,
            'subject_name' => $r->subject_name,
            'color' => $r->color,
            'total' => (int) $r->total,
            'correct' => (int) $r->correct,
            'total_reviews' => (int) $r->total_reviews,
            'accuracy' => $r->total_reviews > 0 ? (float) $r->correct / (float) $r->total_reviews * 100 : 0,
        ])->values()->all();
    }

    private function dailyActivity(int $days): array
    {
        $start = now()->subDays($days - 1)->startOfDay();

        $rows = DB::table('review_logs')
            ->selectRaw('DATE(reviewed_at) as date, COUNT(*) as total,
                SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct')
            ->where('reviewed_at', '>=', $start)
            ->groupByRaw('DATE(reviewed_at)')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $results = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->format('Y-m-d');
            $results[] = [
                'date' => $date,
                'total' => (int) ($rows[$date]->total ?? 0),
                'correct' => (int) ($rows[$date]->correct ?? 0),
            ];
        }

        return $results;
    }

    private function byTopic(): array
    {
        $rows = DB::table('review_logs')
            ->selectRaw('questions.topic,
                COUNT(DISTINCT questions.id) as total,
                SUM(CASE WHEN review_logs.correct THEN 1 ELSE 0 END) as correct,
                COUNT(review_logs.id) as total_reviews')
            ->join('questions', 'questions.id', '=', 'review_logs.question_id')
            ->groupBy('questions.topic')
            ->get();

        return $rows->map(fn ($r) => [
            'topic' => $r->topic,
            'total' => (int) $r->total,
            'correct' => (int) $r->correct,
            'total_reviews' => (int) $r->total_reviews,
            'accuracy' => $r->total_reviews > 0 ? (float) $r->correct / (float) $r->total_reviews * 100 : 0,
        ])->values()->all();
    }

    private function streak(): array
    {
        $dates = ReviewLog::selectRaw('DISTINCT DATE(reviewed_at) as d')
            ->orderByDesc('d')
            ->pluck('d')
            ->values()
            ->all();

        $streak = ['current' => 0, 'longest' => 0, 'reviewed_today' => false];
        if (! $dates) {
            return $streak;
        }

        $today = now()->format('Y-m-d');
        $reviewedToday = $dates[0] === $today;
        if (! $reviewedToday) {
            return $streak;
        }

        $current = 0;
        foreach ($dates as $i => $ds) {
            $expected = now()->subDays($i)->format('Y-m-d');
            if ($ds === $expected) {
                $current++;
            } else {
                break;
            }
        }

        $longest = $current;
        $temp = 1;
        for ($i = 0; $i < count($dates) - 1; $i++) {
            $expected = now()->subDays($i)->format('Y-m-d');
            $prev = now()->subDays($i + 1)->format('Y-m-d');
            if ($dates[$i] === $expected && $dates[$i + 1] === $prev) {
                $temp++;
                $longest = max($longest, $temp);
            } else {
                $temp = 1;
            }
        }

        return ['current' => $current, 'longest' => $longest, 'reviewed_today' => true];
    }
}
