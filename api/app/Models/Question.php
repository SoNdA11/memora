<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Question extends Model
{
    protected $fillable = [
        'subject_id', 'topic', 'text', 'alternatives', 'correct_answer',
        'question_type', 'explanation', 'source', 'tags', 'favorite', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'subject_id' => 'integer',
            'favorite' => 'boolean',
            'user_id' => 'integer',
        ];
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function notebooks(): BelongsToMany
    {
        return $this->belongsToMany(Notebook::class, 'question_notebooks');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function reviewLogs(): HasMany
    {
        return $this->hasMany(ReviewLog::class);
    }

    public function annotations(): HasMany
    {
        return $this->hasMany(Annotation::class);
    }
}
