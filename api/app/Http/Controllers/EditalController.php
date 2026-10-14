<?php

namespace App\Http\Controllers;

use App\Models\EditalItem;
use App\Models\TheoryEntry;
use App\Support\TextHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EditalController extends Controller
{
    public function graph(): JsonResponse
    {
        $items = EditalItem::with('theories')->get();

        $nodes = [];
        $edges = [];
        $seen = [];

        foreach ($items as $item) {
            $id = "e-{$item->id}";
            $nodes[] = [
                'id' => $id,
                'label' => $item->code ? $item->code.' '.$item->title : $item->title,
                'type' => $this->itemType($item),
                'module' => $item->module,
                'subject' => $item->subject,
                'code' => $item->code,
            ];

            if ($item->parent_id) {
                $edges[] = ['source' => "e-{$item->parent_id}", 'target' => $id];
            }

            foreach ($item->theories as $t) {
                $tid = "t-{$t->id}";
                if (! isset($seen[$tid])) {
                    $nodes[] = [
                        'id' => $tid,
                        'label' => $t->title,
                        'type' => 'theory',
                        'theory_id' => $t->id,
                        'subject' => $item->subject,
                    ];
                    $seen[$tid] = true;
                }
                $edges[] = ['source' => $id, 'target' => $tid];
            }
        }

        return response()->json(['nodes' => $nodes, 'edges' => $edges]);
    }

    public function seed(): JsonResponse
    {
        if (app()->isProduction() && ! env('ALLOW_SEED')) {
            return response()->json(['error' => 'seed desabilitado em produção'], 403);
        }

        $tree = $this->buildTree();
        if (! $tree) {
            return response()->json(['message' => 'Nenhum edital local configurado (database/data/edital.json)'], 422);
        }

        DB::transaction(function () use ($tree) {
            DB::table('edital_theory_links')->delete();
            EditalItem::query()->delete();

            foreach ($tree as $item) {
                $this->saveItem(null, $item);
            }
        });

        $this->autoLink();

        return response()->json(['message' => 'Edital importado com sucesso']);
    }

    public function link(Request $request): JsonResponse
    {
        $data = $request->validate([
            'edital_id' => 'required|integer|exists:edital_items,id',
            'theory_id' => 'required|integer|exists:theory_entries,id',
        ]);

        EditalItem::findOrFail($data['edital_id'])->theories()->syncWithoutDetaching([$data['theory_id']]);

        return response()->json(['message' => 'vinculado']);
    }

    public function unlink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'edital_id' => 'required|integer|exists:edital_items,id',
            'theory_id' => 'required|integer|exists:theory_entries,id',
        ]);

        EditalItem::findOrFail($data['edital_id'])->theories()->detach($data['theory_id']);

        return response()->json(['message' => 'desvinculado']);
    }

    private function itemType(EditalItem $item): string
    {
        if (! $item->code && ! $item->subject) {
            return 'module';
        }
        if (! $item->code) {
            return 'subject';
        }

        return 'topic';
    }

    private function saveItem(?int $parentId, array $item): void
    {
        $created = EditalItem::create([
            'parent_id' => $parentId,
            'module' => $item['module'] ?? null,
            'subject' => $item['subject'] ?? null,
            'code' => $item['code'] ?? null,
            'title' => $item['title'] ?? null,
        ]);

        foreach ($item['children'] ?? [] as $child) {
            $this->saveItem($created->id, $child);
        }
    }

    private function autoLink(): void
    {
        $items = EditalItem::where('subject', '!=', '')->get();
        $editalSubjects = [];
        foreach ($items as $item) {
            $editalSubjects[] = ['id' => $item->id, 'words' => TextHelper::normalizeWords((string) $item->subject)];
        }

        foreach (TheoryEntry::with('subject')->get() as $t) {
            $parts = explode(' - ', $t->subject->name);
            $theoryWords = TextHelper::normalizeWords(end($parts));
            if (! $theoryWords) {
                continue;
            }

            $scores = [];
            foreach ($editalSubjects as $es) {
                $score = count(array_intersect_key($theoryWords, $es['words']));
                if ($score > 0) {
                    $scores[] = ['id' => $es['id'], 'score' => $score];
                }
            }
            if (! $scores) {
                continue;
            }

            usort($scores, fn ($a, $b) => $b['score'] <=> $a['score']);
            $bestId = $scores[0]['id'];

            if (count($scores) > 1 && $scores[1]['score'] === $scores[0]['score']) {
                $bestCount = PHP_INT_MAX;
                foreach ($editalSubjects as $es) {
                    if (! array_diff_key($theoryWords, $es['words']) && count($es['words']) < $bestCount) {
                        $bestCount = count($es['words']);
                        $bestId = $es['id'];
                    }
                }
            }

            $exists = DB::table('edital_theory_links')
                ->where('edital_item_id', $bestId)->where('theory_entry_id', $t->id)->exists();
            if (! $exists) {
                DB::table('edital_theory_links')->insert(['edital_item_id' => $bestId, 'theory_entry_id' => $t->id]);
            }
        }
    }

    /**
     * Carrega a árvore do edital de um arquivo local (não versionado).
     *
     * Copie database/data/edital.example.json para database/data/edital.json
     * e adapte para o seu concurso. O arquivo real nunca vai para o git.
     */
    private function buildTree(): array
    {
        $path = database_path('data/edital.json');
        if (! is_file($path)) {
            return [];
        }

        $decoded = json_decode(@file_get_contents($path) ?: '[]', true);

        return is_array($decoded) ? $decoded : [];
    }
}
