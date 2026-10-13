<?php

namespace App\Http\Controllers;

use App\Models\Annotation;
use App\Models\Question;
use App\Models\Review;
use App\Models\ReviewLog;
use App\Models\Subject;
use App\Models\TheoryEntry;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Subject::orderBy('name')->limit(2000)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:32',
        ]);

        try {
            $subject = Subject::create([
                'name' => $data['name'],
                'color' => $data['color'] ?? '#6366f1',
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return response()->json(['error' => 'matéria já existe'], 409);
            }
            throw $e;
        }

        return response()->json($subject, 201);
    }

    public function update(Request $request, Subject $subject): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'color' => 'sometimes|string|max:32',
        ]);

        $updates = array_filter($data, fn ($v) => $v !== '' && $v !== null);
        $subject->update($updates);

        return response()->json(['message' => 'atualizado']);
    }

    public function merge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source_id' => 'required|integer',
            'target_id' => 'required|integer',
        ]);

        if ($data['source_id'] === $data['target_id']) {
            return response()->json(['error' => 'source e target devem ser diferentes'], 400);
        }

        $source = Subject::find($data['source_id']);
        if (! $source) {
            return response()->json(['error' => 'matéria source não encontrada'], 404);
        }
        $target = Subject::find($data['target_id']);
        if (! $target) {
            return response()->json(['error' => 'matéria target não encontrada'], 404);
        }

        DB::transaction(function () use ($source, $target) {
            Question::where('subject_id', $source->id)->update(['subject_id' => $target->id]);
            TheoryEntry::where('subject_id', $source->id)->update(['subject_id' => $target->id]);
            $source->delete();
        });

        return response()->json(['message' => 'matérias mescladas']);
    }

    public function destroy(Subject $subject): JsonResponse
    {
        DB::transaction(function () use ($subject) {
            $questionIds = Question::where('subject_id', $subject->id)->pluck('id');

            if ($questionIds->isNotEmpty()) {
                DB::table('question_notebooks')->whereIn('question_id', $questionIds)->delete();
                Review::whereIn('question_id', $questionIds)->delete();
                ReviewLog::whereIn('question_id', $questionIds)->delete();
                Annotation::whereIn('question_id', $questionIds)->delete();
                Question::whereIn('id', $questionIds)->delete();
            }

            TheoryEntry::where('subject_id', $subject->id)->delete();
            $subject->delete();
        });

        return response()->json(['message' => 'excluído']);
    }
}
