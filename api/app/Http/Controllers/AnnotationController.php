<?php

namespace App\Http\Controllers;

use App\Models\Annotation;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnotationController extends Controller
{
    public function index(Question $question): JsonResponse
    {
        return response()->json(
            Annotation::where('question_id', $question->id)->orderByDesc('created_at')->limit(1000)->get()
        );
    }

    public function store(Request $request, Question $question): JsonResponse
    {
        $data = $request->validate(['content' => 'required|string']);

        return response()->json(
            Annotation::create(['question_id' => $question->id, 'content' => $data['content']]),
            201
        );
    }

    public function update(Request $request, Annotation $annotation): JsonResponse
    {
        $data = $request->validate(['content' => 'required|string']);
        $annotation->update(['content' => $data['content']]);

        return response()->json($annotation->fresh());
    }

    public function destroy(Annotation $annotation): JsonResponse
    {
        $annotation->delete();

        return response()->json(['message' => 'excluído']);
    }
}
