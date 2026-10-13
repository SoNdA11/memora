<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhrasalVerb extends Model
{
    protected $fillable = ['verb', 'meaning', 'example', 'example_pt'];

    public function reviews(): HasMany
    {
        return $this->hasMany(PhrasalReview::class, 'phrasal_id');
    }
}
