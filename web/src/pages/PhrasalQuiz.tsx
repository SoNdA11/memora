import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Check, X, ArrowRight, Sparkles } from 'lucide-react'
import { fetchPhrasalDue, fetchPhrasalVerbs, submitPhrasalReview } from '../api/client'
import type { AnkiRating, PhrasalReview } from '../types'
import { ReviewSkeleton } from '../components/Skeleton'

interface QuizItem {
  review: PhrasalReview
  options: { text: string; correct: boolean }[]
}

const LETTERS = ['A', 'B', 'C', 'D']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PhrasalQuiz() {
  const queryClient = useQueryClient()
  const { data: due, isLoading } = useQuery({ queryKey: ['phrasal-due'], queryFn: fetchPhrasalDue })
  const { data: deck } = useQuery({
    queryKey: ['phrasal-verbs-all'],
    queryFn: () => fetchPhrasalVerbs({ limit: 200, page: 1 }),
  })

  const [quiz, setQuiz] = useState<QuizItem[]>([])
  const [queue, setQueue] = useState<QuizItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [requeued, setRequeued] = useState<Set<number>>(new Set())
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [finished, setFinished] = useState(false)
  const [cardStart, setCardStart] = useState(Date.now())
  const [startedAt] = useState(Date.now())

  useEffect(() => {
    if (due && deck && deck.data.length > 0 && quiz.length === 0) {
      const pool = deck.data.map((d) => d.meaning)
      const items: QuizItem[] = due.map((review) => {
        const distractors = shuffle(pool.filter((m) => m !== review.phrasal.meaning)).slice(0, 3)
        const options = shuffle([
          { text: review.phrasal.meaning, correct: true },
          ...distractors.map((text) => ({ text, correct: false })),
        ])
        return { review, options }
      })
      setQuiz(items)
      setQueue(items)
    }
  }, [due, deck, quiz.length])

  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    setCardStart(Date.now())
  }, [currentIndex])

  const reviewMutation = useMutation({
    mutationFn: ({ id, rating, correct, time_spent }: { id: number; rating: AnkiRating; correct: boolean; time_spent: number }) =>
      submitPhrasalReview(id, { rating, correct, mode: 'quiz', time_spent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phrasal-due'] })
      queryClient.invalidateQueries({ queryKey: ['phrasal-stats'] })
    },
  })

  const handleAnswer = useCallback((opt: { text: string; correct: boolean }) => {
    if (answered) return
    setSelected(opt.text)
    setAnswered(true)
    setIsCorrect(opt.correct)
    if (opt.correct) setSessionCorrect((c) => c + 1)
    else setSessionWrong((c) => c + 1)
  }, [answered])

  const handleRate = useCallback((rating: AnkiRating) => {
    const item = queue[currentIndex]
    if (!item) return
    const willRequeue = rating === 'again' && !requeued.has(item.review.id)
    const time_spent = Math.floor((Date.now() - cardStart) / 1000)
    reviewMutation.mutate({ id: item.review.id, rating, correct: isCorrect, time_spent })

    if (willRequeue) {
      setRequeued((prev) => new Set(prev).add(item.review.id))
      setQueue((prev) => [...prev, item])
    }

    const effectiveLen = willRequeue ? queue.length + 1 : queue.length
    if (currentIndex < effectiveLen - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setFinished(true)
    }
  }, [queue, currentIndex, requeued, isCorrect, cardStart, reviewMutation])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!queue.length || finished) return
      const item = queue[currentIndex]
      if (!answered) {
        const key = e.key.toUpperCase()
        const idx = LETTERS.indexOf(key)
        if (idx >= 0 && idx < item.options.length) {
          handleAnswer(item.options[idx])
        }
        if (key === 'S') {
          // skip: treat as wrong answer reveal
          if (!selected) {
            setAnswered(true)
            setIsCorrect(false)
            setSessionWrong((c) => c + 1)
          }
        }
      } else if (e.key === '1') handleRate('again')
      else if (e.key === '2') handleRate('hard')
      else if (e.key === '3') handleRate('good')
      else if (e.key === '4') handleRate('easy')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queue, finished, answered, currentIndex, selected, handleAnswer, handleRate])

  if (isLoading) return <ReviewSkeleton />

  /* ── Sem cards ── */
  if (!due || due.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-success) 10%, transparent)' }}>
          <Check size={30} style={{ color: 'var(--lumi-success)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
          Tudo em dia!
        </h2>
        <p className="text-[13px] max-w-xs" style={{ color: 'var(--lumi-text2)' }}>
          Sem phrasal verbs para treinar agora. Reveja os cards antes de fazer o quiz.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link to="/phrasal-verbs" className="btn btn-secondary">Ver o deck</Link>
        </div>
      </motion.div>
    )
  }

  /* ── Concluído ── */
  if (finished) {
    const total = sessionCorrect + sessionWrong
    const acc = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
    const sessionSeconds = Math.floor((Date.now() - startedAt) / 1000)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)' }}>
          <Sparkles size={30} style={{ color: 'var(--lumi-accent)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
          Quiz concluído!
        </h2>
        <p className="text-[13px] mb-6" style={{ color: 'var(--lumi-text2)' }}>
          {total} {total === 1 ? 'questão respondida' : 'questões respondidas'} em {sessionSeconds}s
        </p>

        <div className="flex items-stretch gap-3 mb-6">
          {[
            { label: 'Acertos', value: sessionCorrect, color: 'var(--lumi-success)' },
            { label: 'Erros', value: sessionWrong, color: 'var(--lumi-danger)' },
            { label: 'Acurácia', value: `${acc}%`, color: 'var(--lumi-accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card px-5 py-4 min-w-[80px] flex flex-col items-center">
              <p className="text-xl font-semibold tabular-nums" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--lumi-text3)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/phrasal-verbs" className="btn btn-secondary">Deck</Link>
          <Link to="/phrasal-verbs/study" className="btn btn-primary">
            Revisar em flashcards <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>
    )
  }

  const item = queue[currentIndex]
  const progress = ((currentIndex + 1) / queue.length) * 100

  /* ── Fila ainda sendo montada (aguarda deck de distratores) ── */
  if (!item) return <ReviewSkeleton />

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Progress ── */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1 progress-bar">
          <div className="progress-bar-fill transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span
          className="shrink-0 text-[12px] font-medium tabular-nums px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)', color: 'var(--lumi-accent)' }}
        >
          {currentIndex + 1} / {queue.length}
        </span>
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
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--lumi-text)' }}>
            O que significa <span className="font-semibold text-lumi-accent">{item.review.phrasal.verb}</span>?
          </p>
          {item.review.phrasal.example && !answered && (
            <p className="text-[13px] italic" style={{ color: 'var(--lumi-text3)' }}>
              Contexto: “{item.review.phrasal.example}”
            </p>
          )}

          <div className="space-y-2">
            {item.options.map((opt, idx) => {
              const isSelected = answered && selected === opt.text
              const isCorrectAnswer = answered && opt.correct

              let borderColor = 'var(--lumi-border)'
              let bgColor = 'var(--lumi-surface)'
              let letterBg = 'color-mix(in srgb, var(--lumi-text) 8%, transparent)'
              let letterColor = 'var(--lumi-text3)'

              if (isCorrectAnswer) {
                borderColor = 'var(--lumi-success)'; bgColor = 'var(--lumi-success-bg)'
                letterBg = 'var(--lumi-success)'; letterColor = '#fff'
              }
              if (isSelected && !opt.correct) {
                borderColor = 'var(--lumi-danger)'; bgColor = 'var(--lumi-danger-bg)'
                letterBg = 'var(--lumi-danger)'; letterColor = '#fff'
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt)}
                  disabled={answered}
                  style={{ borderColor, backgroundColor: bgColor }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all duration-150 ${
                    !answered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                  }`}
                >
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold shrink-0 transition-colors"
                    style={{ backgroundColor: letterBg, color: letterColor }}
                  >
                    {LETTERS[idx]}
                  </span>
                  <span className="text-left text-[13px] leading-snug flex-1" style={{ color: 'var(--lumi-text)' }}>
                    {opt.text}
                  </span>
                  {isCorrectAnswer && <CheckCircle size={15} className="ml-auto shrink-0" style={{ color: 'var(--lumi-success)' }} />}
                  {isSelected && !opt.correct && <XCircle size={15} className="ml-auto shrink-0" style={{ color: 'var(--lumi-danger)' }} />}
                </button>
              )
            })}
          </div>

          {/* ── Feedback + rating ── */}
          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div
                className="rounded-xl p-4 border"
                style={{
                  borderColor: isCorrect ? 'color-mix(in srgb, var(--lumi-success) 30%, transparent)' : 'color-mix(in srgb, var(--lumi-danger) 30%, transparent)',
                  backgroundColor: isCorrect ? 'var(--lumi-success-bg)' : 'var(--lumi-danger-bg)',
                }}
              >
                <div className="flex items-center gap-2">
                  {isCorrect
                    ? <CheckCircle size={16} style={{ color: 'var(--lumi-success)' }} />
                    : <XCircle size={16} style={{ color: 'var(--lumi-danger)' }} />
                  }
                  <span className="text-[13px] font-semibold" style={{ color: isCorrect ? 'var(--lumi-success)' : 'var(--lumi-danger)' }}>
                    {isCorrect ? 'Correto!' : 'Incorreto!'}
                  </span>
                </div>
                {!isCorrect && (
                  <p className="text-[12px] mt-1.5" style={{ color: 'var(--lumi-text2)' }}>
                    “{item.review.phrasal.verb}” significa <strong>{item.review.phrasal.meaning}</strong>.
                  </p>
                )}
                <p className="text-[11px] mt-2" style={{ color: 'var(--lumi-text3)' }}>
                  Quando quer revisar este card?
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {([
                  { key: 'again', label: 'Novamente', color: 'var(--lumi-danger)' },
                  { key: 'hard', label: 'Difícil', color: 'var(--lumi-warning)' },
                  { key: 'good', label: 'Bom', color: 'var(--lumi-accent)' },
                  { key: 'easy', label: 'Fácil', color: 'var(--lumi-success)' },
                ] as { key: AnkiRating; label: string; color: string }[]).map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleRate(r.key)}
                    disabled={reviewMutation.isPending}
                    className="card px-2 py-2.5 rounded-xl border-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ borderColor: 'var(--lumi-border)', backgroundColor: 'var(--lumi-surface)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = r.color }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lumi-border)' }}
                  >
                    <span className="block text-[12px] font-semibold" style={{ color: r.color }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-[11px] text-center mt-4" style={{ color: 'var(--lumi-text3)' }}>
        A–D → responder · S → pular · após responder: 1–4 → definir revisão
      </p>
    </div>
  )
}
