<?php

namespace App\Http\Controllers;

use App\Models\Notebook;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotebookController extends Controller
{
    public function index(): JsonResponse
    {
        $notebooks = Notebook::withCount('questions')->orderByDesc('created_at')->limit(2000)->get();

        $result = $notebooks->map(function (Notebook $nb) {
            return [
                'id' => $nb->id,
                'name' => $nb->name,
                'description' => $nb->description,
                'created_at' => $nb->created_at,
                'question_count' => (int) $nb->questions_count,
            ];
        });

        return response()->json($result);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        return response()->json(Notebook::create($data), 201);
    }

    public function show(Notebook $notebook): JsonResponse
    {
        $notebook->load(['questions', 'questions.subject']);

        return response()->json($notebook);
    }

    public function update(Request $request, Notebook $notebook): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $updates = [];
        if (! empty($data['name'])) {
            $updates['name'] = $data['name'];
        }
        if (array_key_exists('description', $data) && ($data['description'] !== null || $request->isMethod('put'))) {
            $updates['description'] = $data['description'];
        }
        $notebook->update($updates);

        return response()->json(['message' => 'atualizado']);
    }

    public function destroy(Notebook $notebook): JsonResponse
    {
        DB::transaction(function () use ($notebook) {
            $notebook->questions()->detach();
            $notebook->delete();
        });

        return response()->json(['message' => 'excluído']);
    }

    public function attach(Request $request, Notebook $notebook): JsonResponse
    {
        $data = $request->validate(['question_id' => 'required|integer|exists:questions,id']);

        $question = Question::find($data['question_id']);
        $notebook->questions()->syncWithoutDetaching([$question->id]);

        return response()->json(['message' => 'questão adicionada ao caderno']);
    }

    public function detach(Notebook $notebook, int $qid): JsonResponse
    {
        $notebook->questions()->detach($qid);

        return response()->json(['message' => 'questão removida do caderno']);
    }
}
