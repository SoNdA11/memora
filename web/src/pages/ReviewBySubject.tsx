import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, fetchQuestions, submitReview, fetchTopics } from '../api/client'
import { CheckCircle, XCircle, ChevronRight, SkipForward, Check, X, ArrowLeft, Scissors } from 'lucide-react'
import { ListSkeleton } from '../components/Skeleton'
import { useToast } from '../contexts/ToastContext'
import MarkdownContent from '../components/MarkdownContent'
import { safeParseArray } from '../utils/safeJson'

export default function ReviewBySubject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [subjectId, setSubjectId] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [finished, setFinished] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [sessionSkipped, setSessionSkipped] = useState(0)
  const [strikedLetters, setStrikedLetters] = useState<Set<string>>(new Set())
  const [showExplanation, setShowExplanation] = useState(false)

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: topics } = useQuery({ queryKey: ['topics'], queryFn: fetchTopics })
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions', '', subjectId, '', '', '', 1],
    queryFn: () => fetchQuestions({ subject_id: subjectId, topic: topicFilter || undefined, limit: 200 }),
    enabled: !!subjectId,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, correct, selected_answer }: { id: number; correct: boolean; selected_answer: string }) =>
      submitReview(id, { correct, selected_answer, time_spent: Math.floor((Date.now() - startTime) / 1000) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews-today'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  useEffect(() => {
    setStartTime(Date.now())
    setSelectedAnswer('')
    setAnswered(false)
    setStrikedLetters(new Set())
    setShowExplanation(false)
  }, [currentIndex])

  const toggleStrike = useCallback((letter: string) => {
    if (answered) return
    setStrikedLetters((prev) => {
      const next = new Set(prev)
      if (next.has(letter)) next.delete(letter)
      else next.add(letter)
      return next
    })
  }, [answered])

  const handleAnswer = useCallback((letter: string) => {
    if (answered || strikedLetters.has(letter) || !questions) return
    const q = questions[currentIndex]
    const isCorrect = letter === q.correct_answer
    setSelectedAnswer(letter)
    setCorrect(isCorrect)
    setAnswered(true)
    if (isCorrect) setSessionCorrect((c) => c + 1)
    else setSessionWrong((c) => c + 1)
  }, [answered, questions, currentIndex, strikedLetters])

  const handleSkip = useCallback(() => {
    if (answered || !questions) return
    setSessionSkipped((c) => c + 1)
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1)
    else setFinished(true)
  }, [answered, questions, currentIndex])

  const handleNext = useCallback(() => {
    if (!questions) return
    const q = questions[currentIndex]
    reviewMutation.mutate({ id: q.id, correct, selected_answer: selectedAnswer })
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1)
    else setFinished(true)
  }, [questions, currentIndex, correct, selectedAnswer, reviewMutation])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!questions || !started) return
      const q = questions[currentIndex]
      const alternatives = safeParseArray<{ letter: string }>(q.alternatives)

      if (!answered) {
        const key = e.key.toUpperCase()
        if (key === 'S') { e.preventDefault(); handleSkip(); return }
        if (key === 'C' || key === 'E' || alternatives.some((a: { letter: string }) => a.letter === key)) {
          if (e.shiftKey) { toggleStrike(key) }
          else if (!strikedLetters.has(key)) { handleAnswer(key) }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [questions, currentIndex, answered, handleAnswer, handleNext, handleSkip, toggleStrike, strikedLetters, started])

  const startReview = () => {
    if (!questionsData?.data || questionsData.data.length === 0) {
      toast('error', 'Nenhuma questão encontrada para este filtro')
      return
    }
    setQuestions(questionsData.data)
    setStarted(true)
    setCurrentIndex(0)
    setFinished(false)
    setSessionCorrect(0)
    setSessionWrong(0)
    setSessionSkipped(0)
  }

  const goBack = () => {
    setStarted(false)
    setQuestions([])
    setCurrentIndex(0)
    setFinished(false)
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-apple-text">Revisar por Matéria</h2>
        </div>

        <div className="card p-5 space-y-4">
          <p className="text-sm text-apple-text-secondary">
            Selecione uma matéria e tópico para revisar questões.
          </p>

          <div>
            <label className="label">Matéria</label>
            <select
              value={subjectId}
              onChange={(e) => { setSubjectId(e.target.value); setTopicFilter('') }}
              className="input"
            >
              <option value="">Selecione...</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tópico (opcional)</label>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos os tópicos</option>
              {topics?.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {questionsData && (
            <p className="text-sm text-apple-text-secondary">
              {questionsData.total > 1 ? `${questionsData.total} questões encontradas` : `${questionsData.total} questão encontrada`}
            </p>
          )}

          <button
            onClick={startReview}
            disabled={!subjectId || !questionsData?.data?.length}
            className="btn-primary px-6 py-2.5 w-full sm:w-auto"
          >
            Iniciar Revisão
          </button>
        </div>
      </div>
    )
  }

  if (finished) {
    const total = sessionCorrect + sessionWrong
    const accuracy = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle size={48} className="text-apple-accent mb-4" />
        <h2 className="text-xl font-semibold text-apple-text mb-2">Revisão Concluída!</h2>
        <p className="text-sm text-apple-text-secondary mb-4">Você revisou {questions.length > 1 ? `${questions.length} questões` : `${questions.length} questão`}.</p>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
          <div className="text-center">
            <p className="text-lg font-bold text-apple-text">{sessionCorrect}</p>
            <p className="text-xs text-apple-text-secondary">Corretas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-apple-text">{sessionWrong}</p>
            <p className="text-xs text-apple-text-secondary">Erradas</p>
          </div>
          {sessionSkipped > 0 && (
            <div className="text-center">
              <p className="text-lg font-bold text-apple-text-secondary">{sessionSkipped}</p>
              <p className="text-xs text-apple-text-secondary">Puladas</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-bold text-apple-accent">{accuracy}%</p>
            <p className="text-xs text-apple-text-secondary">Acurácia</p>
          </div>
        </div>
        <button onClick={goBack} className="mt-6 btn-secondary px-6 py-2.5">
          Voltar
        </button>
      </div>
    )
  }

  const question = questions[currentIndex]
  const alternatives = safeParseArray<{ letter: string; text: string }>(question.alternatives)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-1 text-apple-text-secondary hover:text-apple-text-secondary">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-apple-text">Revisão</h2>
          <span className="text-xs text-apple-text-secondary bg-apple-surface/50 px-2 py-0.5 rounded-full">
            {currentIndex + 1} de {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><Check size={12} className="text-apple-accent" /> {sessionCorrect}</span>
          <span className="flex items-center gap-1"><X size={12} className="text-apple-text-secondary" /> {sessionWrong}</span>
          {sessionSkipped > 0 && <span className="text-apple-text-secondary">{sessionSkipped} puladas</span>}
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-apple-text-secondary">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: question.subject?.color ? `${question.subject.color}20` : 'var(--apple-accent)',
              color: question.subject?.color || '#6366f1',
            }}
          >
            {question.subject?.name}
          </span>
          <span>{question.topic}</span>
        </div>

        <div className="text-lg text-apple-text leading-relaxed"><MarkdownContent content={question.text} /></div>

        {question.question_type === 'certo_errado' ? (
          <div className="grid grid-cols-2 gap-3">
            {['C', 'E'].map((letter) => {
              const label = letter === 'C' ? 'Certo' : 'Errado'
              const striked = strikedLetters.has(letter)
              let bg = striked ? 'bg-apple-surface/50 border-apple-border' : 'bg-apple-surface border-apple-border'
              let textColor = striked ? 'text-apple-text-secondary line-through' : 'text-apple-text'

              if (answered) {
                if (letter === question.correct_answer) {
                  bg = 'bg-apple-surface/30 border-apple-border'
                  textColor = 'text-apple-text'
                } else if (letter === selectedAnswer && !correct) {
                  bg = 'bg-apple-surface/30 border-apple-border'
                  textColor = 'text-apple-text'
                }
              } else if (letter === selectedAnswer) {
                bg = 'bg-apple-surface/30 border-apple-border'
              }

              return (
                <div key={letter} className="relative">
                  <button
                    onClick={() => handleAnswer(letter)}
                    disabled={answered || striked}
                    className={`w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl text-lg font-semibold border-2 transition-all ${bg} ${
                      !answered && !striked ? 'hover:border-apple-border cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className={`text-3xl ${letter === 'C' ? 'text-apple-text' : 'text-apple-text'}`}>
                      {letter === 'C' ? '✓' : '✗'}
                    </span>
                    <span className={`${textColor}`}>{label}</span>
                    {answered && letter === question.correct_answer && (
                      <CheckCircle size={20} className="text-apple-accent" />
                    )}
                    {answered && letter === selectedAnswer && !correct && (
                      <XCircle size={20} className="text-apple-text-secondary" />
                    )}
                  </button>
                  {!answered && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStrike(letter) }}
                      className={`absolute left-1 top-1 p-1.5 rounded-full transition-colors z-10 ${
                        striked ? 'bg-red-100 text-apple-text' : 'bg-apple-surface/50 text-apple-text-secondary hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500'
                      }`}
                      title={striked ? 'Restaurar' : 'Cortar'}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {alternatives.map((alt: { letter: string; text: string }) => {
              const striked = strikedLetters.has(alt.letter)
              let bg = striked ? 'bg-apple-surface/50 border-apple-border' : 'bg-apple-surface border-apple-border'
              let textColor = striked ? 'text-apple-text-secondary line-through' : 'text-apple-text'
              let letterBg = striked ? 'bg-apple-text-secondary text-apple-text-secondary' : 'bg-apple-border text-apple-text-secondary'

              if (answered) {
                if (alt.letter === question.correct_answer) {
                  bg = 'bg-apple-surface/30 border-apple-border'
                  textColor = 'text-apple-text'
                  letterBg = 'bg-apple-text text-apple-bg'
                } else if (alt.letter === selectedAnswer && !correct) {
                  bg = 'bg-apple-surface/30 border-apple-border'
                  textColor = 'text-apple-text'
                  letterBg = 'bg-apple-text text-apple-bg'
                }
              } else if (alt.letter === selectedAnswer) {
                bg = 'bg-apple-surface/30 border-apple-border'
              } else if (striked) {
                bg = 'bg-apple-surface/50 border-apple-border'
              }

              return (
                <div key={alt.letter} className="flex items-center gap-2">
                  {!answered && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStrike(alt.letter) }}
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        striked ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : 'text-apple-text hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={striked ? 'Restaurar' : 'Cortar'}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleAnswer(alt.letter)}
                    disabled={answered || striked}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-sm border transition-all ${bg} ${
                      !answered && !striked ? 'hover:border-apple-border cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${letterBg}`}>
                      {alt.letter}
                    </span>
                    <span className={`text-left ${textColor}`}>{alt.text}</span>
                    {answered && alt.letter === question.correct_answer && (
                      <CheckCircle size={18} className="ml-auto text-apple-accent shrink-0" />
                    )}
                    {answered && alt.letter === selectedAnswer && !correct && (
                      <XCircle size={18} className="ml-auto text-apple-text-secondary shrink-0" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {!answered && (
          <button
            onClick={handleSkip}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-apple-surface/50 text-apple-text-secondary rounded-lg text-sm font-medium hover:bg-apple-border transition-colors"
          >
            <SkipForward size={16} />
            Pular (S)
          </button>
        )}

        {answered && (
          <>
            <div className={`rounded-lg p-4 ${correct ? 'border border-apple-border bg-apple-surface' : 'bg-red-50 dark:bg-red-900/30 border border-apple-border'}`}>
              <div className="flex items-center gap-2 mb-1">
                {correct ? (
                  <CheckCircle size={18} className="text-apple-text" />
                ) : (
                  <XCircle size={18} className="text-apple-text" />
                )}
                <span className={`text-sm font-medium ${correct ? 'text-apple-text' : 'text-apple-text'}`}>
                  {correct ? 'Correto!' : 'Incorreto!'}
                </span>
              </div>
              {question.explanation && (
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs text-apple-text-secondary hover:text-apple-text mt-2 flex items-center gap-1"
                >
                  {showExplanation ? 'Esconder' : 'Ver'} explicação
                  <ChevronRight size={14} className={`transition-transform ${showExplanation ? 'rotate-90' : ''}`} />
                </button>
              )}
              {showExplanation && question.explanation && (
                <div className="text-sm text-apple-text mt-2 leading-relaxed"><MarkdownContent content={question.explanation} /></div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-apple-accent text-white rounded-lg text-sm font-medium hover:bg-apple-accent-hover transition-colors"
            >
              {currentIndex < questions.length - 1 ? 'Próxima' : 'Finalizar'}
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-apple-text-secondary text-center mt-4">
        {question.question_type === 'certo_errado'
          ? 'Use C/E para responder, Shift+C/Shift+E para cortar, S para pular e Enter para avançar'
          : 'Use A-E para responder, Shift+A-E para cortar, S para pular e Enter para avançar'}
      </p>
    </div>
  )
}
