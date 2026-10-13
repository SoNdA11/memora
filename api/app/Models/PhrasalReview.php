<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhrasalReview extends Model
{
    protected $fillable = ['phrasal_id', 'ease_factor', 'interval', 'repetitions', 'next_review'];

    protected function casts(): array
    {
        return [
            'phrasal_id' => 'integer',
            'ease_factor' => 'float',
            'interval' => 'integer',
            'repetitions' => 'integer',
            'next_review' => 'datetime',
        ];
    }

    public function phrasal(): BelongsTo
    {
        return $this->belongsTo(PhrasalVerb::class, 'phrasal_id');
    }
}
