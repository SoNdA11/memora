<?php

namespace App\Http\Controllers;

use App\Models\ExamDate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ExamDate::orderBy('date')->limit(2000)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string',
            'date' => 'required|date_format:Y-m-d',
            'description' => 'nullable|string',
            'url' => 'nullable|string',
        ]);

        return response()->json(ExamDate::create($data), 201);
    }

    public function update(Request $request, ExamDate $exam): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string',
            'date' => 'sometimes|date_format:Y-m-d',
            'description' => 'sometimes|string|nullable',
            'url' => 'sometimes|string|nullable',
        ]);

        $updates = array_filter($data, fn ($v) => $v !== '' && $v !== null);
        $exam->update($updates);

        return response()->json($exam->fresh());
    }

    public function destroy(ExamDate $exam): JsonResponse
    {
        $exam->delete();

        return response()->json(['message' => 'prova excluida']);
    }
}
