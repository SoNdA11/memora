<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhrasalReviewLog extends Model
{
    protected $fillable = ['phrasal_id', 'correct', 'rating', 'mode', 'time_spent', 'reviewed_at'];

    protected function casts(): array
    {
        return [
            'phrasal_id' => 'integer',
            'correct' => 'boolean',
            'time_spent' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function phrasal(): BelongsTo
    {
        return $this->belongsTo(PhrasalVerb::class, 'phrasal_id');
    }
}
