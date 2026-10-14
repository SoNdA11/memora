<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Review;
use App\Models\ReviewLog;
use App\Models\Subject;
use App\Support\TextHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Question::with(['subject', 'notebooks']);

        if ($s = $request->query('search')) {
            $s = addcslashes($s, '%_\\');
            $query->where(fn ($q) => $q->where('text', 'ilike', "%{$s}%")->orWhere('topic', 'ilike', "%{$s}%"));
        }
        if ($subjectId = $request->query('subject_id')) {
            $query->where('subject_id', $subjectId);
        }
        if ($topic = $request->query('topic')) {
            $topic = addcslashes($topic, '%_\\');
            $query->where('topic', 'ilike', "%{$topic}%");
        }
        if ($source = $request->query('source')) {
            $source = addcslashes($source, '%_\\');
            $query->where('source', 'ilike', "%{$source}%");
        }
        if ($tag = $request->query('tag')) {
            $tag = substr((string) $tag, 0, 64);
            $tag = str_replace(['"', '\\'], '', $tag);
            $query->where('tags', 'like', '%"'.$tag.'"%');
        }
        if ($request->query('favorite') === 'true') {
            $query->where('favorite', true);
        }
        if ($notebookId = $request->query('notebook_id')) {
            $query->whereIn('id', fn ($q) => $q->select('question_id')->from('question_notebooks')->where('notebook_id', $notebookId));
        }
        if ($request->query('wrong_review') === 'true') {
            $query->whereIn('id', fn ($q) => $q->select('question_id')->from('review_logs')->where('correct', false));
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = (int) $request->query('limit', 20);
        if ($limit < 1 || $limit > 100) {
            $limit = 20;
        }

        $total = (clone $query)->count();
        $questions = $query->orderByDesc('created_at')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get()
            ->each(fn ($q) => $q->explanation = TextHelper::simplifyMath((string) $q->explanation));

        return response()->json([
            'data' => $questions,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => (int) ceil($total / $limit),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject_id' => 'required|integer|exists:subjects,id',
            'topic' => 'required|string|max:255',
            'text' => 'required|string|max:20000',
            'alternatives' => 'sometimes|array',
            'alternatives.*.letter' => 'required_with:alternatives|string|max:5',
            'alternatives.*.text' => 'required_with:alternatives|string|max:20000',
            'correct_answer' => 'required|string|max:5',
            'question_type' => 'sometimes|string|max:64',
            'explanation' => 'nullable|string|max:50000',
            'source' => 'nullable|string|max:255',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:64',
            'notebook_ids' => 'sometimes|array',
            'notebook_ids.*' => 'integer|exists:notebooks,id',
        ]);

        $questionType = $data['question_type'] ?? 'multipla_escolha';
        $alternatives = $data['alternatives'] ?? [];
        if ($questionType === 'certo_errado') {
            $alternatives = [
                ['letter' => 'C', 'text' => 'Certo'],
                ['letter' => 'E', 'text' => 'Errado'],
            ];
        }

        $question = DB::transaction(function () use ($data, $questionType, $alternatives) {
            $question = Question::create([
                'subject_id' => $data['subject_id'],
                'topic' => $data['topic'],
                'text' => $data['text'],
                'alternatives' => json_encode(array_values($alternatives)),
                'correct_answer' => $data['correct_answer'],
                'question_type' => $questionType,
                'explanation' => $data['explanation'] ?? null,
                'source' => $data['source'] ?? null,
                'tags' => json_encode($data['tags'] ?? []),
            ]);

            Review::create([
                'question_id' => $question->id,
                'ease_factor' => 2.5,
                'interval' => 0,
                'repetitions' => 0,
                'next_review' => now()->addDay(),
            ]);

            if (! empty($data['notebook_ids'])) {
                $question->notebooks()->attach($data['notebook_ids']);
            }

            return $question;
        });

        $question->load(['subject', 'notebooks']);
        $question->explanation = TextHelper::simplifyMath((string) $question->explanation);

        return response()->json($question, 201);
    }

    public function show(Question $question): JsonResponse
    {
        $question->load(['subject', 'notebooks']);
        $question->explanation = TextHelper::simplifyMath((string) $question->explanation);
        $review = Review::where('question_id', $question->id)->first();

        return response()->json(['question' => $question, 'review' => $review]);
    }

    public function update(Request $request, Question $question): JsonResponse
    {
        $data = $request->validate([
            'subject_id' => 'sometimes|integer|exists:subjects,id',
            'topic' => 'sometimes|string',
            'text' => 'sometimes|string',
            'alternatives' => 'sometimes|array',
            'correct_answer' => 'sometimes|string',
            'question_type' => 'sometimes|string',
            'explanation' => 'sometimes|string|nullable',
            'source' => 'sometimes|string|nullable',
            'tags' => 'sometimes|array',
            'notebook_ids' => 'sometimes|array',
            'notebook_ids.*' => 'integer|exists:notebooks,id',
        ]);

        $updates = [];
        foreach (['subject_id', 'topic', 'text', 'question_type', 'correct_answer'] as $field) {
            if (! empty($data[$field])) {
                $updates[$field] = $data[$field];
            }
        }
        if (array_key_exists('alternatives', $data) && $data['alternatives'] !== null) {
            $alternatives = $data['alternatives'];
            $qt = $data['question_type'] ?? $question->question_type;
            if ($qt === 'certo_errado') {
                $alternatives = [
                    ['letter' => 'C', 'text' => 'Certo'],
                    ['letter' => 'E', 'text' => 'Errado'],
                ];
            }
            $updates['alternatives'] = json_encode(array_values($alternatives));
        }
        if (! empty($data['explanation'])) {
            $updates['explanation'] = $data['explanation'];
        }
        if (! empty($data['source'])) {
            $updates['source'] = $data['source'];
        }
        if (array_key_exists('tags', $data) && $data['tags'] !== null) {
            $updates['tags'] = json_encode($data['tags']);
        }

        DB::transaction(function () use ($question, $updates, $data) {
            if ($updates) {
                $question->update($updates);
            }
            if (array_key_exists('notebook_ids', $data) && $data['notebook_ids'] !== null) {
                $question->notebooks()->sync($data['notebook_ids']);
            }
        });

        $question->load(['subject', 'notebooks']);
        $question->explanation = TextHelper::simplifyMath((string) $question->explanation);

        return response()->json($question);
    }

    public function toggleFavorite(Question $question): JsonResponse
    {
        $question->update(['favorite' => ! $question->favorite]);

        return response()->json(['favorite' => (bool) $question->favorite]);
    }

    public function destroy(Question $question): JsonResponse
    {
        DB::transaction(function () use ($question) {
            $question->notebooks()->detach();
            Review::where('question_id', $question->id)->delete();
            ReviewLog::where('question_id', $question->id)->delete();
            $question->delete();
        });

        return response()->json(['message' => 'excluído']);
    }

    public function topics(): JsonResponse
    {
        return response()->json(Question::distinct()->orderBy('topic')->limit(1000)->pluck('topic'));
    }

    public function bulk(Request $request): JsonResponse
    {
        $inputs = $request->all();
        if (! is_array($inputs)) {
            return response()->json(['error' => 'payload deve ser um array'], 422);
        }
        if (count($inputs) > 200) {
            return response()->json(['error' => 'máximo de 200 questões por importação'], 422);
        }

        $request->validate([
            '*.subject_id' => 'required|integer|exists:subjects,id',
            '*.text' => 'required|string|max:20000',
            '*.correct_answer' => 'required|string|max:5',
            '*.topic' => 'nullable|string|max:255',
            '*.explanation' => 'nullable|string|max:50000',
            '*.source' => 'nullable|string|max:255',
            '*.tags' => 'sometimes|array',
            '*.tags.*' => 'string|max:64',
        ]);

        $subjectIds = collect($inputs)->pluck('subject_id')->unique()->values()->all();
        $existingSubjects = Subject::whereIn('id', $subjectIds)->pluck('id')->all();
        $existingSet = array_flip($existingSubjects);

        $created = 0;
        $errors = [];

        DB::transaction(function () use ($inputs, $existingSet, &$created, &$errors) {
            foreach ($inputs as $index => $input) {
                if (empty($input['text']) || empty($input['correct_answer'])) {
                    $errors[] = ['index' => $index, 'error' => 'text e correct_answer são obrigatórios'];

                    continue;
                }
                if (! isset($existingSet[$input['subject_id']])) {
                    $errors[] = ['index' => $index, 'error' => 'subject_id inválido'];

                    continue;
                }

                $qt = $input['question_type'] ?? 'multipla_escolha';
                $alternatives = $input['alternatives'] ?? [];
                if ($qt === 'certo_errado') {
                    $alternatives = [
                        ['letter' => 'C', 'text' => 'Certo'],
                        ['letter' => 'E', 'text' => 'Errado'],
                    ];
                }

                $question = Question::create([
                    'subject_id' => $input['subject_id'],
                    'topic' => $input['topic'] ?? '',
                    'text' => $input['text'],
                    'alternatives' => json_encode(array_values(is_array($alternatives) ? $alternatives : [])),
                    'correct_answer' => $input['correct_answer'],
                    'question_type' => $qt,
                    'explanation' => $input['explanation'] ?? null,
                    'source' => $input['source'] ?? null,
                    'tags' => json_encode($input['tags'] ?? []),
                ]);
                Review::create([
                    'question_id' => $question->id,
                    'ease_factor' => 2.5,
                    'interval' => 0,
                    'repetitions' => 0,
                    'next_review' => now()->addDay(),
                ]);
                $created++;
            }
        });

        return response()->json([
            'message' => "{$created} questões importadas",
            'total_enviadas' => count($inputs),
            'total_criadas' => $created,
            'total_ignoradas' => count($errors),
            'errors' => $errors,
        ], ($created > 0 ? 201 : 422));
    }
}
