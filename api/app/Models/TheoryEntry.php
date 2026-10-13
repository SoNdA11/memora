<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TheoryEntry extends Model
{
    protected $fillable = [
        'subject_id', 'topic', 'title', 'content', 'source', 'tags',
        'notebooklm_url', 'completed', 'current', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'subject_id' => 'integer',
            'completed' => 'boolean',
            'current' => 'boolean',
        ];
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
