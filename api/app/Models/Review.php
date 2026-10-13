<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'question_id', 'ease_factor', 'interval', 'repetitions', 'next_review',
    ];

    protected function casts(): array
    {
        return [
            'question_id' => 'integer',
            'ease_factor' => 'float',
            'interval' => 'integer',
            'repetitions' => 'integer',
            'next_review' => 'datetime',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
