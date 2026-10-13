import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { RotateCw, Check, X, ArrowRight, Sparkles, Brain } from 'lucide-react'
import { fetchPhrasalDue, submitPhrasalReview } from '../api/client'
import type { AnkiRating, PhrasalReview } from '../types'
import { ReviewSkeleton } from '../components/Skeleton'

const RATINGS: { key: AnkiRating; label: string; sub: string; keyLabel: string; color: string }[] = [
  { key: 'again', label: 'Novamente', sub: 'ver de novo hoje', keyLabel: '1', color: 'var(--lumi-danger)' },
  { key: 'hard', label: 'Difícil', sub: '+1.2x', keyLabel: '2', color: 'var(--lumi-warning)' },
  { key: 'good', label: 'Bom', sub: 'ritmo normal', keyLabel: '3', color: 'var(--lumi-accent)' },
  { key: 'easy', label: 'Fácil', sub: '+1.3x', keyLabel: '4', color: 'var(--lumi-success)' },
]

export default function PhrasalStudy() {
  const queryClient = useQueryClient()
  const { data: due, isLoading } = useQuery({ queryKey: ['phrasal-due'], queryFn: fetchPhrasalDue })

  const [queue, setQueue] = useState<PhrasalReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [requeued, setRequeued] = useState<Set<number>>(new Set())
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [finished, setFinished] = useState(false)
  const [cardStart, setCardStart] = useState(Date.now())
  const [startedAt] = useState(Date.now())

  useEffect(() => {
    if (due && queue.length === 0) setQueue(due)
  }, [due, queue.length])

  useEffect(() => {
    setFlipped(false)
    setCardStart(Date.now())
  }, [currentIndex])

  const reviewMutation = useMutation({
    mutationFn: ({ id, rating, correct, time_spent }: { id: number; rating: AnkiRating; correct: boolean; time_spent: number }) =>
      submitPhrasalReview(id, { rating, correct, mode: 'flashcard', time_spent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phrasal-due'] })
      queryClient.invalidateQueries({ queryKey: ['phrasal-stats'] })
    },
  })

  const handleRate = useCallback((rating: AnkiRating) => {
    const review = queue[currentIndex]
    if (!review) return
    const correct = rating !== 'again'
    const willRequeue = !correct && !requeued.has(review.id)
    const time_spent = Math.floor((Date.now() - cardStart) / 1000)

    reviewMutation.mutate({ id: review.id, rating, correct, time_spent })

    if (correct) {
      setSessionCorrect((c) => c + 1)
    } else {
      setSessionWrong((c) => c + 1)
    }

    if (willRequeue) {
      setRequeued((prev) => new Set(prev).add(review.id))
      setQueue((prev) => [...prev, review])
    }

    const effectiveLen = willRequeue ? queue.length + 1 : queue.length
    if (currentIndex < effectiveLen - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setFinished(true)
    }
  }, [queue, currentIndex, requeued, cardStart, reviewMutation])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!queue.length || finished) return
      if (!flipped) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          setFlipped(true)
        }
        return
      }
      if (e.key === '1') handleRate('again')
      if (e.key === '2') handleRate('hard')
      if (e.key === '3') handleRate('good')
      if (e.key === '4') handleRate('easy')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queue, finished, flipped, handleRate])

  if (isLoading) return <ReviewSkeleton />

  /* ── Tudo em dia ── */
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
          Nenhum phrasal verb pendente para hoje. Volte amanhã para revisar os próximos cards.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link to="/phrasal-verbs" className="btn btn-secondary">Ver o deck</Link>
        </div>
      </motion.div>
    )
  }

  /* ── Sessão concluída ── */
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
          Sessão concluída!
        </h2>
        <p className="text-[13px] mb-6" style={{ color: 'var(--lumi-text2)' }}>
          {total} {total === 1 ? 'card revisado' : 'cards revisados'} em {sessionSeconds}s
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
          <Link to="/phrasal-verbs/quiz" className="btn btn-primary">
            Treinar no quiz <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>
    )
  }

  /* ── Fila ainda sendo montada ── */
  if (queue.length === 0) return <ReviewSkeleton />

  const review = queue[currentIndex]
  const progress = ((currentIndex + 1) / queue.length) * 100

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

      {/* ── Flashcard ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <button
            onClick={() => setFlipped(true)}
            className="w-full text-left card p-8 min-h-[260px] flex flex-col items-center justify-center text-center transition-transform duration-150 hover:scale-[1.005] cursor-pointer"
          >
            {!flipped ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--lumi-text3)' }}>
                  {review.phrasal.verb.length > 12 ? 'Phrasal verb' : 'Qual o significado de'}
                </p>
                <p className="text-3xl font-bold" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
                  {review.phrasal.verb}
                </p>
                {review.phrasal.example && (
                  <p className="text-[14px] italic mt-5 leading-relaxed max-w-md" style={{ color: 'var(--lumi-text2)' }}>
                    “{review.phrasal.example}”
                  </p>
                )}
                <span
                  className="mt-8 flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 8%, transparent)', color: 'var(--lumi-text2)' }}
                >
                  <RotateCw size={12} /> Clique ou aperte espaço para revelar
                </span>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--lumi-text3)' }}>
                  Significado
                </p>
                <p className="text-2xl font-semibold leading-snug max-w-md" style={{ color: 'var(--lumi-accent)', letterSpacing: '-0.01em' }}>
                  {review.phrasal.meaning}
                </p>
                {review.phrasal.example_pt && (
                  <p className="text-[13px] mt-4" style={{ color: 'var(--lumi-text2)' }}>
                    {review.phrasal.example_pt}
                  </p>
                )}
              </>
            )}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* ── Rating buttons ── */}
      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-4 gap-2 mt-4"
        >
          {RATINGS.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRate(r.key)}
              disabled={reviewMutation.isPending}
              className="card px-2 py-3 rounded-xl border-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{ borderColor: 'var(--lumi-border)', backgroundColor: 'var(--lumi-surface)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = r.color }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lumi-border)' }}
            >
              <span className="block text-[12px] font-semibold" style={{ color: r.color }}>{r.label}</span>
              <span className="block text-[10px] mt-0.5" style={{ color: 'var(--lumi-text3)' }}>{r.sub}</span>
              <span className="block text-[10px] mt-1 font-medium tabular-nums" style={{ color: 'var(--lumi-text3)' }}>
                tecla {r.keyLabel}
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {!flipped && (
        <p className="text-[11px] text-center mt-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--lumi-text3)' }}>
          <Brain size={12} /> Tente lembrar o significado antes de revelar
        </p>
      )}
    </div>
  )
}
