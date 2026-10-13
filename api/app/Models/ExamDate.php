<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class ExamDate extends Model
{
    protected $fillable = ['title', 'date', 'description', 'url'];

    protected $appends = ['days_remaining'];

    protected function daysRemaining(): Attribute
    {
        return Attribute::get(function () {
            try {
                $exam = Carbon::createFromFormat('Y-m-d', $this->date)->startOfDay();

                return (int) Carbon::today()->diffInDays($exam, false);
            } catch (\Throwable) {
                return -1;
            }
        });
    }
}
