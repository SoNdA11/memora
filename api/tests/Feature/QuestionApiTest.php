<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Review;
use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_question_also_creates_review(): void
    {
        $subject = Subject::create(['name' => 'Banco de Dados']);

        $response = $this->postJson('/api/questions', [
            'subject_id' => $subject->id,
            'topic' => 'SQL',
            'text' => 'O que é uma chave primária?',
            'alternatives' => [
                ['letter' => 'A', 'text' => 'Um índice'],
                ['letter' => 'B', 'text' => 'Identificador único'],
            ],
            'correct_answer' => 'B',
            'tags' => ['modelagem'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('subject_id', $subject->id)
            ->assertJsonPath('question_type', 'multipla_escolha');

        $questionId = $response->json('id');
        $this->assertDatabaseHas('reviews', ['question_id' => $questionId]);
        $this->assertDatabaseHas('questions', ['id' => $questionId]);
    }

    public function test_new_question_is_due_today(): void
    {
        $subject = Subject::create(['name' => 'Engenharia de Software']);

        $response = $this->postJson('/api/questions', [
            'subject_id' => $subject->id,
            'topic' => 'CI/CD',
            'text' => 'No Deployment Contínuo o deploy é automático?',
            'correct_answer' => 'C',
            'question_type' => 'certo_errado',
        ]);

        $response->assertCreated();
        $review = Review::where('question_id', $response->json('id'))->firstOrFail();
        $this->assertTrue(
            $review->next_review->lessThanOrEqualTo(now()),
            'Questão nova deve entrar em "Revisar hoje" imediatamente.'
        );
    }

    public function test_new_question_appears_in_reviews_today(): void
    {
        $subject = Subject::create(['name' => 'Redes']);

        $this->postJson('/api/questions', [
            'subject_id' => $subject->id,
            'topic' => 'TCP x UDP',
            'text' => 'UDP é orientado à conexão?',
            'correct_answer' => 'E',
            'question_type' => 'certo_errado',
        ])->assertCreated();

        $this->getJson('/api/reviews/today')
            ->assertOk()
            ->assertJsonPath('0.question.topic', 'TCP x UDP');
    }

    public function test_create_certo_errado_generates_fixed_alternatives(): void
    {
        $subject = Subject::create(['name' => 'Legislação']);

        $response = $this->postJson('/api/questions', [
            'subject_id' => $subject->id,
            'topic' => 'LGPD',
            'text' => 'A LGPD se aplica ao tratamento de dados pessoais.',
            'question_type' => 'certo_errado',
            'correct_answer' => 'C',
        ]);

        $response->assertCreated();
        $alternatives = json_decode($response->json('alternatives'), true);
        $this->assertSame([['letter' => 'C', 'text' => 'Certo'], ['letter' => 'E', 'text' => 'Errado']], $alternatives);
    }

    public function test_list_questions_filters_and_paginates(): void
    {
        $subject = Subject::create(['name' => 'SQL']);
        Question::create([
            'subject_id' => $subject->id, 'topic' => 'SELECT', 'text' => 'Q1',
            'alternatives' => '[]', 'correct_answer' => 'A', 'tags' => '[]',
        ]);
        Question::create([
            'subject_id' => $subject->id, 'topic' => 'JOIN', 'text' => 'Q2',
            'alternatives' => '[]', 'correct_answer' => 'A', 'tags' => '[]', 'favorite' => true,
        ]);

        $this->getJson('/api/questions?favorite=true')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.topic', 'JOIN');

        $this->getJson('/api/questions?search=Q1')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_submit_review_updates_sm2_and_logs(): void
    {
        $subject = Subject::create(['name' => 'SQL']);
        $question = Question::create([
            'subject_id' => $subject->id, 'topic' => 'T', 'text' => 'Q',
            'alternatives' => '[]', 'correct_answer' => 'A', 'tags' => '[]',
        ]);
        Review::create([
            'question_id' => $question->id, 'ease_factor' => 2.5,
            'interval' => 0, 'repetitions' => 0, 'next_review' => now(),
        ]);

        $response = $this->postJson("/api/reviews/{$question->id}", [
            'correct' => true,
            'selected_answer' => 'A',
            'time_spent' => 25,
        ]);

        $response->assertOk()->assertJsonPath('interval', 1)->assertJsonPath('repetitions', 1);
        $this->assertDatabaseHas('review_logs', ['question_id' => $question->id, 'correct' => true]);
    }

    public function test_validation_errors_return_422(): void
    {
        $this->postJson('/api/questions', ['text' => 'sem campos obrigatórios'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subject_id', 'topic', 'correct_answer']);
    }

    public function test_subject_unique_name_returns_409(): void
    {
        Subject::create(['name' => 'Duplicada']);

        $this->postJson('/api/subjects', ['name' => 'Duplicada'])->assertStatus(409);
    }

    public function test_health_endpoint(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJson(['status' => 'ok']);
    }
}
