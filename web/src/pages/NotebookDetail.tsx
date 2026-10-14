import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotebook, removeQuestionFromNotebook, submitReview } from '../api/client'
import { ArrowLeft, Trash2, ExternalLink, CheckCircle, XCircle, ChevronRight, SkipForward, Check, X } from 'lucide-react'
import { ListSkeleton } from '../components/Skeleton'
import { useConfirm } from '../contexts/ConfirmContext'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/Button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import MarkdownContent from '../components/MarkdownContent'
import { safeParseArray } from '../utils/safeJson'

export default function NotebookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm } = useConfirm()
  const { toast } = useToast()

  const { data: notebook, isLoading } = useQuery({
    queryKey: ['notebook', id],
    queryFn: () => fetchNotebook(Number(id)),
    enabled: !!id,
  })

  // review state
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(new Set())
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

  if (isLoading) return <ListSkeleton />
  if (!notebook) return <p className="text-apple-text-secondary">Caderno não encontrado.</p>

  const allQuestions = notebook.questions || []

  // Build unique subject list
  const subjectMap = new Map<number, { name: string; color: string }>()
  allQuestions.forEach((q) => {
    if (q.subject) subjectMap.set(q.subject_id, { name: q.subject.name, color: q.subject.color })
  })
  const subjects = Array.from(subjectMap.entries()).map(([id, s]) => ({ id, ...s }))

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
  }

  const filteredQuestions = selectedSubjectIds.size > 0
    ? allQuestions.filter((q) => selectedSubjectIds.has(q.subject_id))
    : allQuestions

  const startReview = () => {
    if (filteredQuestions.length === 0) {
      toast('error', 'Nenhuma questão encontrada para este filtro')
      return
    }
    setQuestions(filteredQuestions)
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

  // === REVIEW MODE ===
  if (started) {
    if (finished) {
      const total = sessionCorrect + sessionWrong
      const accuracy = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
      return (
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <CheckCircle size={48} className="text-apple-accent mb-4" />
            <h2 className="text-xl font-semibold text-apple-text mb-2">Revisão Concluída!</h2>
            <p className="text-sm text-apple-text-secondary mb-4">Você revisou {questions.length > 1 ? `${questions.length} questões` : `${questions.length} questão`} do caderno.</p>
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
              Voltar ao Caderno
            </button>
          </div>
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
            <h2 className="text-2xl font-bold text-apple-text">{notebook.name}</h2>
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

  // === LIST MODE ===
  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/notebooks')}
        className="flex items-center gap-1.5 text-sm text-apple-text-secondary hover:text-apple-text mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Cadernos
      </button>

      <div className="card p-5 mb-6">
        <h2 className="text-xl font-bold text-apple-text">{notebook.name}</h2>
        {notebook.description && (
          <p className="text-sm text-apple-text-secondary mt-1">{notebook.description}</p>
        )}
        <p className="text-xs text-apple-text-secondary mt-2">
          {allQuestions.length > 1 ? `${allQuestions.length} questões` : `${allQuestions.length} questão`} &middot; Criado em {format(new Date(notebook.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {subjects.length > 0 && (
        <div className="card p-4 mb-6 space-y-3">
          <p className="text-sm font-medium text-apple-text">Filtrar por matéria para revisar</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors ${
                  selectedSubjectIds.has(s.id)
                    ? 'bg-apple-surface/50 border-apple-border text-apple-text'
                    : 'bg-apple-surface/50 border-apple-border text-apple-text-secondary hover:border-apple-accent/50'
                }`}
                style={selectedSubjectIds.has(s.id) ? {
                  backgroundColor: `${s.color}20`,
                  borderColor: s.color,
                  color: s.color,
                } : {}}
              >
                {s.name}
              </button>
            ))}
          </div>
          {selectedSubjectIds.size > 0 && (
            <button
              onClick={() => setSelectedSubjectIds(new Set())}
              className="text-xs text-apple-text-secondary hover:text-apple-text-secondary"
            >
              Limpar filtro
            </button>
          )}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={startReview}
              disabled={filteredQuestions.length === 0}
              className="btn-primary px-5 py-2 text-sm"
            >
              Revisar {filteredQuestions.length > 1 ? `${filteredQuestions.length} questões` : `${filteredQuestions.length} questão`}
            </button>
            <p className="text-xs text-apple-text-secondary">
              {filteredQuestions.length} de {allQuestions.length} disponíveis
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filteredQuestions.length === 0 && (
          <p className="text-sm text-apple-text-secondary text-center py-8">
            {selectedSubjectIds.size > 0
              ? 'Nenhuma questão desta matéria neste caderno.'
              : 'Nenhuma questão neste caderno. Adicione questões pelo formulário de criação.'}
          </p>
        )}
        {filteredQuestions.map((q) => {
          const alt = safeParseArray<{ letter: string; text: string }>(q.alternatives)
          return (
            <div key={q.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/questions/${q.id}`} className="flex-1 min-w-0">
                  <p className="text-sm text-apple-text font-medium line-clamp-2">{q.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: q.subject?.color ? `${q.subject.color}20` : 'var(--apple-accent)',
                        color: q.subject?.color || '#6366f1',
                      }}
                    >
                      {q.subject?.name || 'Sem matéria'}
                    </span>
                    <span className="text-xs text-apple-text-secondary">{q.topic}</span>
                    <span className="text-xs text-apple-text-secondary">
                      Resposta: {q.correct_answer}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    to={`/questions/${q.id}`}
                    className="p-1.5 text-apple-text-secondary hover:text-apple-accent transition-colors"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const ok = await confirm({ title: 'Remover questão', message: 'Remover questão deste caderno?', variant: 'danger' })
                      if (ok) {
                        await removeQuestionFromNotebook(notebook.id, q.id)
                        queryClient.invalidateQueries({ queryKey: ['notebook', id] })
                        toast('success', 'Questão removida do caderno')
                      }
                    }}
                    className="text-apple-text-secondary hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
