<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = ['name', 'color', 'user_id'];

    protected function casts(): array
    {
        return ['user_id' => 'integer'];
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function theoryEntries(): HasMany
    {
        return $this->hasMany(TheoryEntry::class);
    }
}
