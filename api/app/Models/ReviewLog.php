<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewLog extends Model
{
    protected $fillable = [
        'question_id', 'correct', 'selected_answer', 'time_spent', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'question_id' => 'integer',
            'correct' => 'boolean',
            'time_spent' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
