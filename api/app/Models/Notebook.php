<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Notebook extends Model
{
    protected $fillable = ['name', 'description', 'user_id'];

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'question_notebooks');
    }
}
