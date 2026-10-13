<?php

namespace App\Http\Controllers;

use App\Models\ExamAnalysis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamAnalysisController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ExamAnalysis::orderByDesc('created_at')->limit(2000)->get());
    }

    public function show(ExamAnalysis $examAnalysis): JsonResponse
    {
        return response()->json($examAnalysis);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string',
            'exam_org' => 'nullable|string',
            'year' => 'nullable|integer',
            'role' => 'nullable|string',
            'content' => 'required|string',
        ]);

        return response()->json(ExamAnalysis::create($data), 201);
    }

    public function update(Request $request, ExamAnalysis $examAnalysis): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string',
            'exam_org' => 'sometimes|string|nullable',
            'year' => 'sometimes|integer',
            'role' => 'sometimes|string|nullable',
            'content' => 'sometimes|string',
        ]);

        $updates = [];
        foreach (['title', 'exam_org', 'role', 'content'] as $f) {
            if (! empty($data[$f])) {
                $updates[$f] = $data[$f];
            }
        }
        if (! empty($data['year'])) {
            $updates['year'] = $data['year'];
        }
        $examAnalysis->update($updates);

        return response()->json($examAnalysis->fresh());
    }

    public function destroy(ExamAnalysis $examAnalysis): JsonResponse
    {
        $examAnalysis->delete();

        return response()->json(['message' => 'análise excluída']);
    }
}
