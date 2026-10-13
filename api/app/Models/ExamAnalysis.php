<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamAnalysis extends Model
{
    protected $table = 'exam_analyses';

    protected $fillable = ['title', 'exam_org', 'year', 'role', 'content'];

    protected function casts(): array
    {
        return ['year' => 'integer'];
    }
}
