<?php

namespace App\Services;

/**
 * Algoritmo de repetição espaçada SM-2 (base do Anki).
 * Port fiel de internal/services/sm2.go do projeto original em Go.
 */
class Sm2Service
{
    /**
     * @return array{interval: int, ease_factor: float, repetitions: int}
     */
    public function calculateNextReview(bool $correct, float $easeFactor, int $interval, int $repetitions): array
    {
        if (! $correct) {
            return [
                'interval' => 1,
                'ease_factor' => max(1.3, $easeFactor - 0.2),
                'repetitions' => 0,
            ];
        }

        switch ($repetitions) {
            case 0:
                $interval = 1;
                break;
            case 1:
                $interval = 6;
                break;
            default:
                $interval = (int) round($interval * $easeFactor);
        }

        $newEase = $easeFactor + 0.1;
        if ($newEase < 1.3) {
            $newEase = 1.3;
        }

        return [
            'interval' => $interval,
            'ease_factor' => $newEase,
            'repetitions' => $repetitions + 1,
        ];
    }

    /**
     * @return array{interval: int, ease_factor: float, repetitions: int}
     */
    public function applyAnkiRating(string $rating, float $easeFactor, int $interval, int $repetitions): array
    {
        switch ($rating) {
            case 'again':
                return [
                    'interval' => 0,
                    'ease_factor' => max(1.3, $easeFactor - 0.2),
                    'repetitions' => 0,
                ];
            case 'hard':
                if ($repetitions === 0) {
                    return ['interval' => 1, 'ease_factor' => max(1.3, $easeFactor - 0.15), 'repetitions' => $repetitions + 1];
                }

                return [
                    'interval' => max(1, (int) round($interval * 1.2)),
                    'ease_factor' => max(1.3, $easeFactor - 0.15),
                    'repetitions' => $repetitions + 1,
                ];
            case 'easy':
                if ($repetitions === 0) {
                    return ['interval' => 4, 'ease_factor' => $easeFactor + 0.15, 'repetitions' => $repetitions + 1];
                }

                return [
                    'interval' => max(1, (int) round($interval * $easeFactor * 1.3)),
                    'ease_factor' => $easeFactor + 0.15,
                    'repetitions' => $repetitions + 1,
                ];
            default: // good
                if ($repetitions === 0) {
                    return ['interval' => 3, 'ease_factor' => $easeFactor, 'repetitions' => $repetitions + 1];
                }

                return [
                    'interval' => max(1, (int) round($interval * $easeFactor)),
                    'ease_factor' => $easeFactor,
                    'repetitions' => $repetitions + 1,
                ];
        }
    }
}
