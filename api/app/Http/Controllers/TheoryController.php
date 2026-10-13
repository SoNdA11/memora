<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Subject;
use App\Models\TheoryEntry;
use App\Support\TextHelper;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TheoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TheoryEntry::with('subject');

        if ($s = $request->query('subject_id')) {
            $query->where('subject_id', $s);
        }
        if ($s = $request->query('search')) {
            $query->where(fn ($q) => $q->where('title', 'ilike', "%{$s}%")->orWhere('topic', 'ilike', "%{$s}%"));
        }
        if ($request->query('current') === 'true') {
            $query->where('current', true);
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = (int) $request->query('limit', 30);
        if ($limit < 1 || $limit > 100) {
            $limit = 30;
        }

        $total = (clone $query)->count();
        $entries = $query->orderByDesc('created_at')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $entries,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => (int) ceil($total / $limit),
        ]);
    }

    public function bySubject(Subject $subject): JsonResponse
    {
        return response()->json(
            TheoryEntry::with('subject')
                ->where('subject_id', $subject->id)
                ->orderBy('topic')->orderBy('title')
                ->limit(2000)
                ->get()
        );
    }

    public function show(TheoryEntry $theory): JsonResponse
    {
        return response()->json($theory->load('subject'));
    }

    public function store(Request $request, Subject $subject): JsonResponse
    {
        $data = $request->validate([
            'topic' => 'required|string',
            'title' => 'required|string',
            'content' => 'required|string',
            'source' => 'nullable|string',
            'tags' => 'sometimes|array',
            'tags.*' => 'string',
            'notebooklm_url' => 'nullable|string',
        ]);

        $entry = TheoryEntry::create([
            'subject_id' => $subject->id,
            'topic' => $data['topic'],
            'title' => $data['title'],
            'content' => $data['content'],
            'source' => $data['source'] ?? null,
            'tags' => json_encode($data['tags'] ?? []),
            'notebooklm_url' => $data['notebooklm_url'] ?? null,
        ]);

        return response()->json($entry->load('subject'), 201);
    }

    public function update(Request $request, TheoryEntry $theory): JsonResponse
    {
        $data = $request->validate([
            'subject_id' => 'sometimes|integer|exists:subjects,id',
            'topic' => 'sometimes|string',
            'title' => 'sometimes|string',
            'content' => 'sometimes|string',
            'source' => 'sometimes|string|nullable',
            'tags' => 'sometimes|array',
            'notebooklm_url' => 'sometimes|string|nullable',
            'completed' => 'sometimes|boolean',
            'current' => 'sometimes|boolean',
        ]);

        $updates = [];
        foreach (['subject_id', 'topic', 'title', 'content'] as $f) {
            if (! empty($data[$f])) {
                $updates[$f] = $data[$f];
            }
        }
        if (array_key_exists('source', $data)) {
            $updates['source'] = $data['source'];
        }
        if (array_key_exists('tags', $data) && $data['tags'] !== null) {
            $updates['tags'] = json_encode($data['tags']);
        }
        if (! empty($data['notebooklm_url'])) {
            $updates['notebooklm_url'] = $data['notebooklm_url'];
        }
        if (array_key_exists('completed', $data)) {
            $updates['completed'] = (bool) $data['completed'];
        }
        if (array_key_exists('current', $data)) {
            $updates['current'] = (bool) $data['current'];
        }

        $theory->update($updates);

        return response()->json($theory->load('subject'));
    }

    public function destroy(TheoryEntry $theory): JsonResponse
    {
        $theory->delete();

        return response()->json(['message' => 'excluído']);
    }

    public function toggle(TheoryEntry $theory): JsonResponse
    {
        $theory->update(['completed' => ! $theory->completed]);

        return response()->json(['completed' => (bool) $theory->completed]);
    }

    public function toggleCurrent(TheoryEntry $theory): JsonResponse
    {
        $theory->update(['current' => ! $theory->current]);

        return response()->json(['current' => (bool) $theory->current]);
    }

    public function seed(Request $request): JsonResponse
    {
        $basePath = $request->query('path', '/app/estudos');
        if (! is_dir($basePath)) {
            return response()->json(['error' => 'diretório estudos não encontrado: '.$basePath], 500);
        }

        $created = 0;
        $skipped = 0;

        foreach (glob($basePath.'/*', GLOB_ONLYDIR) ?: [] as $catPath) {
            $category = basename($catPath);
            foreach (glob($catPath.'/*', GLOB_ONLYDIR) ?: [] as $subPath) {
                $subjectName = $this->normalizeSubjectName($category, basename($subPath));
                [$subject, $isNew] = $this->findOrCreateSubject($subjectName);
                if ($isNew) {
                    $this->migrateLegacyTheory($subject, $category);
                }
                $this->seedDir($subPath, $subject, $created, $skipped);
                foreach (glob($subPath.'/*', GLOB_ONLYDIR) ?: [] as $nested) {
                    $this->seedDir($nested, $subject, $created, $skipped);
                }
            }
        }

        return response()->json(['message' => 'Seed concluído', 'created' => $created, 'skipped' => $skipped]);
    }

    private function seedDir(string $dir, Subject $subject, int &$created, int &$skipped): void
    {
        foreach (glob($dir.'/*.md') ?: [] as $path) {
            $content = @file_get_contents($path);
            if ($content === false) {
                continue;
            }
            $title = $this->extractTitle($content) ?: TextHelper::cleanFileName(basename($path));
            $topic = TextHelper::cleanFileName(basename($path));

            if (TheoryEntry::where('title', $title)->where('subject_id', $subject->id)->exists()) {
                $skipped++;

                continue;
            }

            TheoryEntry::create([
                'subject_id' => $subject->id,
                'topic' => $topic,
                'title' => $title,
                'content' => $content,
            ]);
            $created++;
        }
    }

    private function normalizeSubjectName(string $category, string $subject): string
    {
        $map = [
            'banco-dados' => 'Banco de Dados',
            'desenvolvimento-sistemas' => 'Desenvolvimento de Sistemas',
            'gestao-governanca-ti' => 'Gestão e Governança de TI',
            'inteligencia-negocios-bi' => 'Inteligência de Negócios (BI)',
            'seguranca-informacao' => 'Segurança da Informação',
            'atualidades-ia' => 'Atualidades e IA',
            'legislacao-seguranca-dados' => 'Legislação acerca de Segurança da Informação e Proteção de Dados',
            'lingua-inglesa' => 'Língua Inglesa',
            'lingua-portuguesa' => 'Língua Portuguesa',
            'raciocinio-logico' => 'Raciocínio Lógico',
        ];
        if (isset($map[$subject])) {
            return $map[$subject];
        }

        return TextHelper::titleCase(str_replace(['-', '_'], ' ', $subject));
    }

    /** @return array{0: Subject, 1: bool} */
    private function findOrCreateSubject(string $name): array
    {
        $subject = Subject::where('name', $name)->first();
        if ($subject) {
            return [$subject, false];
        }

        $normalized = TextHelper::normalizeForMatch($name);
        foreach (Subject::all() as $s) {
            if (TextHelper::normalizeForMatch($s->name) === $normalized) {
                return [$s, false];
            }
        }

        return [Subject::create(['name' => $name]), true];
    }

    private function migrateLegacyTheory(Subject $subject, string $category): void
    {
        $prefix = TextHelper::titleCase(str_replace('-', ' ', $category));
        $legacy = Subject::where('name', 'like', $prefix.' - %')->get();
        foreach ($legacy as $ls) {
            TheoryEntry::where('subject_id', $ls->id)->update(['subject_id' => $subject->id]);
            if (Question::where('subject_id', $ls->id)->count() === 0) {
                $ls->delete();
            }
        }
    }

    private function extractTitle(string $content): string
    {
        $lines = explode("\n", $content, 11);
        foreach (array_slice($lines, 0, 10) as $line) {
            $trimmed = trim($line);
            if (str_starts_with($trimmed, '# ')) {
                return trim(substr($trimmed, 2));
            }
        }

        return '';
    }

    public function exportPdf(TheoryEntry $theory): Response
    {
        $theory->load('subject');
        $tags = json_decode($theory->tags ?? '[]', true) ?: [];

        $pdf = Pdf::loadView('pdf.theory', [
            'entry' => $theory,
            'tags' => $tags,
            'strip' => fn (string $s) => TextHelper::stripMarkdown($s),
        ]);

        return $pdf->download("teoria-{$theory->id}.pdf");
    }
}
