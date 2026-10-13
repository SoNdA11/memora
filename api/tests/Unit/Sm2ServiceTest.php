<?php

namespace Tests\Unit;

use App\Services\Sm2Service;
use PHPUnit\Framework\TestCase;

/**
 * Port de internal/services/sm2_test.go (Go) para PHPUnit.
 */
class Sm2ServiceTest extends TestCase
{
    private Sm2Service $sm2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sm2 = new Sm2Service;
    }

    public function test_incorrect_answer_resets_repetitions(): void
    {
        $result = $this->sm2->calculateNextReview(false, 2.5, 10, 3);

        $this->assertSame(1, $result['interval']);
        $this->assertSame(0, $result['repetitions']);
        $this->assertEqualsWithDelta(2.3, $result['ease_factor'], 0.0001);
    }

    public function test_first_correct_answer_sets_interval_one(): void
    {
        $result = $this->sm2->calculateNextReview(true, 2.5, 0, 0);

        $this->assertSame(1, $result['interval']);
        $this->assertSame(1, $result['repetitions']);
        $this->assertEqualsWithDelta(2.6, $result['ease_factor'], 0.0001);
    }

    public function test_second_correct_answer_sets_interval_six(): void
    {
        $result = $this->sm2->calculateNextReview(true, 2.6, 1, 1);

        $this->assertSame(6, $result['interval']);
        $this->assertSame(2, $result['repetitions']);
    }

    public function test_later_reviews_multiply_by_ease_factor(): void
    {
        $result = $this->sm2->calculateNextReview(true, 2.5, 6, 2);

        $this->assertSame(15, $result['interval']);
        $this->assertSame(3, $result['repetitions']);
    }

    public function test_ease_factor_never_drops_below_minimum(): void
    {
        $result = $this->sm2->calculateNextReview(false, 1.3, 5, 2);

        $this->assertGreaterThanOrEqual(1.3, $result['ease_factor']);
    }

    public function test_anki_rating_again_resets_card(): void
    {
        $result = $this->sm2->applyAnkiRating('again', 2.5, 10, 3);

        $this->assertSame(0, $result['interval']);
        $this->assertSame(0, $result['repetitions']);
    }

    public function test_anki_rating_good_progresses(): void
    {
        $first = $this->sm2->applyAnkiRating('good', 2.5, 0, 0);
        $this->assertSame(3, $first['interval']);

        $later = $this->sm2->applyAnkiRating('good', 2.5, 6, 2);
        $this->assertSame(15, $later['interval']);
    }

    public function test_anki_rating_easy_grows_faster_than_good(): void
    {
        $easy = $this->sm2->applyAnkiRating('easy', 2.5, 6, 2);
        $good = $this->sm2->applyAnkiRating('good', 2.5, 6, 2);

        $this->assertGreaterThan($good['interval'], $easy['interval']);
    }

    public function test_anki_rating_hard_grows_slower_than_good(): void
    {
        $hard = $this->sm2->applyAnkiRating('hard', 2.5, 10, 2);
        $good = $this->sm2->applyAnkiRating('good', 2.5, 10, 2);

        $this->assertLessThan($good['interval'], $hard['interval']);
        $this->assertLessThan(2.5, $hard['ease_factor']);
    }
}
