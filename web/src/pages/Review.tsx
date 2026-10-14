import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchTodayReviews, submitReview } from '../api/client'
import { safeParseArray } from '../utils/safeJson'
import { CheckCircle, XCircle, ChevronRight, SkipForward, Check, X, BookOpen, ArrowRight } from 'lucide-react'
import MarkdownContent from '../components/MarkdownContent'
import { ReviewSkeleton } from '../components/Skeleton'
import { Link } from 'react-router-dom'

export default function Review() {
  const queryClient = useQueryClient()
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
  const [startedAt] = useState(Date.now())

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews-today'],
    queryFn: fetchTodayReviews,
  })

  useEffect(() => {
    setStartTime(Date.now())
    setSelectedAnswer('')
    setAnswered(false)
    setStrikedLetters(new Set())
    setShowExplanation(false)
  }, [currentIndex])

  const reviewMutation = useMutation({
    mutationFn: ({ id, correct, selected_answer }: { id: number; correct: boolean; selected_answer: string }) =>
      submitReview(id, {
        correct,
        selected_answer,
        time_spent: Math.floor((Date.now() - startTime) / 1000),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews-today'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const toggleStrike = useCallback((letter: string) => {
    if (answered || !reviews) return
    setStrikedLetters((prev) => {
      const next = new Set(prev)
      if (next.has(letter)) next.delete(letter)
      else next.add(letter)
      return next
    })
  }, [answered, reviews])

  const handleAnswer = useCallback((letter: string) => {
    if (answered || !reviews || strikedLetters.has(letter)) return
    const question = reviews[currentIndex].question
    const isCorrect = letter === question.correct_answer
    setSelectedAnswer(letter)
    setCorrect(isCorrect)
    setAnswered(true)
    if (isCorrect) setSessionCorrect((c) => c + 1)
    else setSessionWrong((c) => c + 1)
  }, [answered, reviews, currentIndex, strikedLetters])

  const handleSkip = useCallback(() => {
    if (answered || !reviews) return
    setSessionSkipped((c) => c + 1)
    if (currentIndex < reviews.length - 1) setCurrentIndex((i) => i + 1)
    else setFinished(true)
  }, [answered, reviews, currentIndex])

  const handleNext = useCallback(() => {
    if (!reviews) return
    const review = reviews[currentIndex]
    reviewMutation.mutate({ id: review.id, correct, selected_answer: selectedAnswer })
    if (currentIndex < reviews.length - 1) setCurrentIndex((i) => i + 1)
    else setFinished(true)
  }, [reviews, currentIndex, correct, selectedAnswer, reviewMutation])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!reviews) return
      const question = reviews[currentIndex].question
      const alternatives = safeParseArray<{ letter: string }>(question.alternatives)
      if (!answered) {
        const key = e.key.toUpperCase()
        if (key === 'S') { e.preventDefault(); handleSkip(); return }
        if (key === 'C' || key === 'E' || alternatives.some((a: { letter: string }) => a.letter === key)) {
          if (e.shiftKey) { toggleStrike(key) }
          else if (!strikedLetters.has(key)) { handleAnswer(key) }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [reviews, currentIndex, answered, handleAnswer, handleNext, handleSkip, toggleStrike, strikedLetters])

  const sessionTime = Math.floor((Date.now() - startedAt) / 1000)
  const sessionMinutes = Math.floor(sessionTime / 60)
  const sessionSeconds = sessionTime % 60

  /* ── Loading ── */
  if (isLoading) return <ReviewSkeleton />

  /* ── All done state ── */
  if (!reviews || reviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-success) 10%, transparent)' }}
        >
          <CheckCircle size={30} style={{ color: 'var(--lumi-success)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
          Tudo em dia!
        </h2>
        <p className="text-[13px] max-w-xs" style={{ color: 'var(--lumi-text2)' }}>
          Nenhuma revisão pendente para hoje. Volte amanhã ou adicione novas questões.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link to="/questions/new" className="btn btn-primary">
            <BookOpen size={14} /> Nova questão
          </Link>
          <Link to="/" className="btn btn-secondary">Dashboard</Link>
        </div>
      </motion.div>
    )
  }

  /* ── Session finished ── */
  if (finished) {
    const total = sessionCorrect + sessionWrong
    const sessionAccuracy = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)' }}
        >
          <CheckCircle size={30} style={{ color: 'var(--lumi-accent)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
          Sessão concluída!
        </h2>
        <p className="text-[13px] mb-6" style={{ color: 'var(--lumi-text2)' }}>
          {reviews.length} {reviews.length === 1 ? 'questão' : 'questões'} revisadas em {sessionMinutes > 0 ? `${sessionMinutes}m ` : ''}{sessionSeconds}s
        </p>

        {/* Result grid */}
        <div className="flex items-stretch gap-3 mb-6">
          {[
            { label: 'Corretas',  value: sessionCorrect,  color: 'var(--lumi-success)' },
            { label: 'Erradas',   value: sessionWrong,    color: 'var(--lumi-danger)'  },
            ...(sessionSkipped > 0 ? [{ label: 'Puladas', value: sessionSkipped, color: 'var(--lumi-text2)' }] : []),
            { label: 'Acurácia', value: `${sessionAccuracy}%`, color: 'var(--lumi-accent)' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="card px-5 py-4 min-w-[80px] flex flex-col items-center"
            >
              <p className="text-xl font-semibold tabular-nums" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--lumi-text3)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/" className="btn btn-secondary">Dashboard</Link>
          <Link to="/review/wrong" className="btn btn-primary">
            Revisar erros <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>
    )
  }

  /* ── Active review session ── */
  const review = reviews[currentIndex]
  const question = review.question
  const alternatives = safeParseArray<{ letter: string; text: string }>(question.alternatives)
  const progress = ((currentIndex + 1) / reviews.length) * 100

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Progress header ── */}
      <div className="flex items-center gap-4 mb-5">
        {/* Progress bar */}
        <div className="flex-1 progress-bar">
          <div
            className="progress-bar-fill transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Counter */}
        <span
          className="shrink-0 text-[12px] font-medium tabular-nums px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)', color: 'var(--lumi-accent)' }}
        >
          {currentIndex + 1} / {reviews.length}
        </span>

        {/* Session score */}
        <div className="flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--lumi-success)' }}>
            <Check size={12} /> {sessionCorrect}
          </span>
          <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--lumi-danger)' }}>
            <X size={12} /> {sessionWrong}
          </span>
        </div>
      </div>

      {/* ── Question card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="card p-6 space-y-5"
        >
          {/* Subject + topic */}
          <div className="flex items-center gap-2 flex-wrap">
            {question.subject && (
              <span
                className="badge-subject"
                style={{
                  backgroundColor: question.subject.color ? `${question.subject.color}18` : 'color-mix(in srgb, var(--lumi-accent) 12%, transparent)',
                  color: question.subject.color || 'var(--lumi-accent)',
                }}
              >
                {question.subject.name}
              </span>
            )}
            {(question as any).notebooks?.map((nb: any) => (
              <span key={nb.id} className="badge" style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 8%, transparent)', color: 'var(--lumi-text2)' }}>
                {nb.name}
              </span>
            ))}
            {question.topic && (
              <span className="text-[12px]" style={{ color: 'var(--lumi-text3)' }}>
                {question.topic}
              </span>
            )}
          </div>

          {/* Question text */}
          <div className="text-[15px] leading-relaxed" style={{ color: 'var(--lumi-text)' }}>
            <MarkdownContent content={question.text} />
          </div>

          {/* Alternatives — Certo/Errado */}
          {question.question_type === 'certo_errado' ? (
            <div className="grid grid-cols-2 gap-3">
              {['C', 'E'].map((letter) => {
                const label = letter === 'C' ? 'Certo' : 'Errado'
                const striked = strikedLetters.has(letter)
                const isSelected = answered && letter === selectedAnswer
                const isCorrectAnswer = answered && letter === question.correct_answer
                const showWrong = answered && isSelected && !correct

                let borderColor = 'var(--lumi-border)'
                let bgColor = 'var(--lumi-surface)'
                if (isCorrectAnswer) { borderColor = 'var(--lumi-success)'; bgColor = 'var(--lumi-success-bg)' }
                if (showWrong) { borderColor = 'var(--lumi-danger)'; bgColor = 'var(--lumi-danger-bg)' }

                return (
                  <div key={letter} className="relative">
                    <button
                      onClick={() => handleAnswer(letter)}
                      disabled={answered || striked}
                      style={{ borderColor, backgroundColor: bgColor, opacity: striked ? 0.45 : 1 }}
                      className={`w-full flex flex-col items-center justify-center gap-2 py-7 rounded-xl text-lg font-semibold border-2 transition-all duration-150 ${
                        !answered && !striked ? 'cursor-pointer hover:border-lumi-border2 active:scale-[0.98]' : 'cursor-default'
                      } ${striked ? 'line-through' : ''}`}
                    >
                      <span className="text-2xl">{letter === 'C' ? '✓' : '✗'}</span>
                      <span className="text-[14px]" style={{ color: striked ? 'var(--lumi-text3)' : 'var(--lumi-text)' }}>{label}</span>
                      {isCorrectAnswer && <CheckCircle size={16} style={{ color: 'var(--lumi-success)' }} />}
                      {showWrong && <XCircle size={16} style={{ color: 'var(--lumi-danger)' }} />}
                    </button>
                    {!answered && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStrike(letter) }}
                        className="absolute left-2 top-2 p-1.5 rounded-lg transition-all"
                        style={{
                          color: striked ? 'var(--lumi-danger)' : 'var(--lumi-text3)',
                          backgroundColor: striked ? 'var(--lumi-danger-bg)' : 'transparent',
                        }}
                        title={striked ? 'Restaurar' : 'Eliminar opção'}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* Multiple choice */
            <div className="space-y-2">
              {alternatives.map((alt: { letter: string; text: string }) => {
                const striked = strikedLetters.has(alt.letter)
                const isSelected = answered && alt.letter === selectedAnswer
                const isCorrectAnswer = answered && alt.letter === question.correct_answer

                let borderColor = 'var(--lumi-border)'
                let bgColor = 'var(--lumi-surface)'
                let letterBg = striked ? 'color-mix(in srgb, var(--lumi-text) 8%, transparent)' : 'color-mix(in srgb, var(--lumi-text) 8%, transparent)'
                let letterColor = 'var(--lumi-text3)'

                if (isCorrectAnswer) {
                  borderColor = 'var(--lumi-success)'; bgColor = 'var(--lumi-success-bg)'
                  letterBg = 'var(--lumi-success)'; letterColor = '#fff'
                }
                if (isSelected && !correct) {
                  borderColor = 'var(--lumi-danger)'; bgColor = 'var(--lumi-danger-bg)'
                  letterBg = 'var(--lumi-danger)'; letterColor = '#fff'
                }

                return (
                  <div key={alt.letter} className="flex items-start gap-2">
                    {/* Strike button */}
                    {!answered && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStrike(alt.letter) }}
                        className="mt-2.5 p-1.5 rounded-lg transition-all shrink-0"
                        style={{
                          color: striked ? 'var(--lumi-danger)' : 'var(--lumi-text3)',
                          backgroundColor: striked ? 'var(--lumi-danger-bg)' : 'transparent',
                        }}
                        title={striked ? 'Restaurar' : 'Eliminar opção'}
                      >
                        <X size={13} />
                      </button>
                    )}

                    {/* Answer button */}
                    <button
                      onClick={() => handleAnswer(alt.letter)}
                      disabled={answered || striked}
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        opacity: striked ? 0.45 : 1,
                      }}
                      className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all duration-150 ${
                        !answered && !striked
                          ? 'cursor-pointer active:scale-[0.99]'
                          : 'cursor-default'
                      }`}
                    >
                      {/* Letter badge */}
                      <span
                        className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold shrink-0 transition-colors"
                        style={{ backgroundColor: letterBg, color: letterColor }}
                      >
                        {alt.letter}
                      </span>
                      <span
                        className={`text-left text-[13px] leading-snug flex-1 ${striked ? 'line-through' : ''}`}
                        style={{ color: striked ? 'var(--lumi-text3)' : 'var(--lumi-text)' }}
                      >
                        {alt.text}
                      </span>
                      {isCorrectAnswer && <CheckCircle size={15} className="ml-auto shrink-0" style={{ color: 'var(--lumi-success)' }} />}
                      {isSelected && !correct && <XCircle size={15} className="ml-auto shrink-0" style={{ color: 'var(--lumi-danger)' }} />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Skip button — before answering */}
          {!answered && (
            <button
              onClick={handleSkip}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
              style={{
                color: 'var(--lumi-text3)',
                backgroundColor: 'color-mix(in srgb, var(--lumi-text) 4%, transparent)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'color-mix(in srgb, var(--lumi-text) 7%, transparent)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'color-mix(in srgb, var(--lumi-text) 4%, transparent)' }}
            >
              <SkipForward size={14} />
              Pular <span className="text-[11px] opacity-60">(S)</span>
            </button>
          )}

          {/* Feedback + next — after answering */}
          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Feedback box */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  borderColor: correct ? 'color-mix(in srgb, var(--lumi-success) 30%, transparent)' : 'color-mix(in srgb, var(--lumi-danger) 30%, transparent)',
                  backgroundColor: correct ? 'var(--lumi-success-bg)' : 'var(--lumi-danger-bg)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {correct
                    ? <CheckCircle size={16} style={{ color: 'var(--lumi-success)' }} />
                    : <XCircle size={16} style={{ color: 'var(--lumi-danger)' }} />
                  }
                  <span className="text-[13px] font-semibold" style={{ color: correct ? 'var(--lumi-success)' : 'var(--lumi-danger)' }}>
                    {correct ? 'Correto!' : 'Incorreto!'}
                  </span>
                </div>

                {question.explanation && (
                  <>
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="flex items-center gap-1 text-[12px] mt-2 transition-colors"
                      style={{ color: 'var(--lumi-text2)' }}
                    >
                      <ChevronRight
                        size={13}
                        style={{ transform: showExplanation ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                      />
                      {showExplanation ? 'Esconder' : 'Ver'} explicação
                    </button>
                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="text-[13px] leading-relaxed mt-3 pt-3 border-t"
                            style={{ color: 'var(--lumi-text)', borderColor: 'color-mix(in srgb, var(--lumi-border) 60%, transparent)' }}>
                            <MarkdownContent content={question.explanation} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* Next button */}
              <button
                onClick={handleNext}
                className="btn btn-primary w-full"
                style={{ height: '42px' }}
              >
                {currentIndex < reviews.length - 1 ? 'Próxima questão' : 'Finalizar sessão'}
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Keyboard shortcuts hint */}
      <p className="text-[11px] text-center mt-4" style={{ color: 'var(--lumi-text3)' }}>
        {question.question_type === 'certo_errado'
          ? 'C / E → responder · Shift+C/E → eliminar · S → pular · Enter → próxima'
          : 'A–E → responder · Shift+letra → eliminar · S → pular · Enter → próxima'}
      </p>
    </div>
  )
}
