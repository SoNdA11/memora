<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EditalItem extends Model
{
    protected $fillable = ['parent_id', 'module', 'subject', 'code', 'title'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(EditalItem::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(EditalItem::class, 'parent_id');
    }

    public function theories(): BelongsToMany
    {
        return $this->belongsToMany(TheoryEntry::class, 'edital_theory_links');
    }
}
