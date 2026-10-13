import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  RotateCw,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Shuffle,
  ArrowRight,
  Brain,
  Sparkles,
  CheckCircle,
  XCircle,
  List,
  Layers,
} from 'lucide-react'
import { FLASHCARD_WORDS, type FlashcardWord } from '../data/accentuationWords'

/* ── Types ── */
interface Rule {
  id: string
  category: string
  title: string
  description: string
  examples: string[]
}

interface QuizItem {
  word: string
  options: string[]
  correct: string
  ruleId: string
}

/* ── Rules data ── */
const RULES: Rule[] = [
  {
    id: 'monossilaba-a-e-o',
    category: 'Monossílabos',
    title: 'Vogais a, e, o (seguidas ou não de s)',
    description: 'Monossílabos terminados em "a", "e" ou "o", com ou sem "s", são acentuados.',
    examples: ['má', 'pé', 'nó', 'más', 'pés', 'nós'],
  },
  {
    id: 'monossilaba-ditongo',
    category: 'Monossílabos',
    title: 'Ditongos abertos éi, éu, ói',
    description: 'Monossílabos terminados nos ditongos abertos "éi", "éu" ou "ói", com ou sem "s".',
    examples: ['réis', 'véu', 'dói', 'réu'],
  },
  {
    id: 'oxitona-a-e-o',
    category: 'Oxítonas',
    title: 'Vogais a, e, o (seguidas ou não de s)',
    description: 'Oxítonas terminadas em "a", "e" ou "o", com ou sem "s", são acentuadas.',
    examples: ['crachá', 'café', 'alô', 'sofá', 'elefê'],
  },
  {
    id: 'oxitona-ditongo',
    category: 'Oxítonas',
    title: 'Ditongos abertos éi, éu, ói',
    description: 'Oxítonas terminadas nos ditongos abertos "éi", "éu" ou "ói", com ou sem "s".',
    examples: ['fiéis', 'véu', 'sóis', 'lei', 'herói'],
  },
  {
    id: 'oxitona-nasal',
    category: 'Oxítonas',
    title: 'Ditongos nasais em, ens',
    description: 'Oxítonas terminadas nos ditongos nasais "em" ou "ens" são acentuadas.',
    examples: ['além', 'parabéns', 'comum', 'abrum'],
  },
  {
    id: 'paroxitona-r-x-n-l-ps',
    category: 'Paroxítonas',
    title: 'Terminadas em r, x, n, l, ps',
    description: 'Paroxítonas terminadas em "r", "x", "n", "l" ou "ps" são acentuadas.',
    examples: ['caráter', 'tórax', 'líquen', 'fóssil', 'bíceps'],
  },
  {
    id: 'paroxitona-ã-ão',
    category: 'Paroxítonas',
    title: 'Terminadas em ã ou ão (+ s)',
    description: 'Paroxítonas terminadas em "ã" ou "ão", com ou sem "s", são acentuadas.',
    examples: ['ímã', 'órfão', 'irmã', 'pão', 'limões'],
  },
  {
    id: 'paroxitona-um-om',
    category: 'Paroxítonas',
    title: 'Terminadas em um, uns, om, ons',
    description: 'Paroxítonas terminadas em "um", "uns", "om" ou "ons" são acentuadas.',
    examples: ['fórum', 'álbuns', 'elétrons', 'réu', 'lição'],
  },
  {
    id: 'paroxitona-i-us',
    category: 'Paroxítonas',
    title: 'Terminadas em i, is, us',
    description: 'Paroxítonas terminadas em "i", "is" ou "us" são acentuadas.',
    examples: ['júri', 'oásis', 'vírus', 'lápis', 'café'],
  },
  {
    id: 'paroxitona-ditongo',
    category: 'Paroxítonas',
    title: 'Terminadas em ditongo oral',
    description: 'Paroxítonas terminadas em ditongo oral são acentuadas.',
    examples: ['glória', 'mágoa', 'história', 'energia', 'pátria'],
  },
  {
    id: 'proparoxitona',
    category: 'Proparoxítonas',
    title: 'Toda proparoxítona é acentuada',
    description: 'Toda proparoxítona (palavra com sílaba tônica antepenúltima) recebe acentuação.',
    examples: ['cágado', 'ótimo', 'lâmpada', 'médico', 'época'],
  },
  {
    id: 'hiato-i-u',
    category: 'Hiatos',
    title: 'Hiato com i e u tônicos',
    description: 'Acentua-se "i" e "u" tônicos quando formam hiato com a vogal anterior e estão sozinhos ou com "s" na sílaba.',
    examples: ['saúde', 'egoísmo', 'argüido', 'usuário'],
  },
  {
    id: 'hiato-nh',
    category: 'Hiatos',
    title: 'Exceção: hiatos seguidos de nh',
    description: 'Hiatos seguidos de "nh" não recebem acento.',
    examples: ['rainha', 'maionese', 'heroina'],
  },
  {
    id: 'ditongo-hiato',
    category: 'Ditongos e Hiatos',
    title: 'Separar ditongo de hiato',
    description: 'Quando o "i" ou "u" não formam ditongo com a vogal anterior, mas estão em sílabas separadas, o "i" e "u" tônicos são acentuados.',
    examples: ['voz', 'dá', 'beat', 'viúvo', 'graúda'],
  },
  {
    id: 'oxitona-nasal-em',
    category: 'Oxítonas',
    title: 'Terminadas em em/ens',
    description: 'Oxítonas terminadas em ditongo nasal "em" ou "ens" são acentuadas. Exceção: monossílabos como "um", "bem".',
    examples: ['além', 'parabéns', 'também', 'muçulmano'],
  },
  {
    id: 'palavras-compostas',
    category: 'Palavras Compostas',
    title: 'Acentuação de palavras compostas',
    description: 'Em palavras compostas por juxtaposição, acentuam-se as palavras que, isoladamente, seriam acentuadas.',
    examples: ['peru-banha', 'stop-over', 'júri-perito'],
  },
  {
    id: 'monossilaba-nasal',
    category: 'Monossílabos',
    title: 'Monossílabos nasais',
    description: 'Monossílabos nasais como "um", "bem", "não" não recebem acento por serem ditongos nasais.',
    examples: ['um', 'bem', 'não', 'com', 'sem'],
  },
  {
    id: 'paroxitona-penultima',
    category: 'Paroxítonas',
    title: 'Regra geral das paroxítonas',
    description: 'Paroxítonas que NÃO terminam em a, e, o (+s), ditongo aberto, nasal, r, x, n, l, ps, ã, ão, i, is, us NÃO são acentuadas.',
    examples: ['amor', 'mulher', 'mesa', 'vida', 'livro'],
  },
]

/* ── Helpers ── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getRuleById(id: string): Rule | undefined {
  return RULES.find((r) => r.id === id)
}

/* ── Modes ── */
type Mode = 'reference' | 'flashcard' | 'quiz'

const RATINGS = [
  { key: 'again' as const, label: 'Novamente', sub: 'ver de novo', keyLabel: '1', color: 'var(--lumi-danger)' },
  { key: 'hard' as const, label: 'Difícil', sub: '+1.2x', keyLabel: '2', color: 'var(--lumi-warning)' },
  { key: 'good' as const, label: 'Bom', sub: 'ritmo normal', keyLabel: '3', color: 'var(--lumi-accent)' },
  { key: 'easy' as const, label: 'Fácil', sub: '+1.3x', keyLabel: '4', color: 'var(--lumi-success)' },
]

/* ── Reference Section ── */
function ReferenceSection() {
  const [openRule, setOpenRule] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const groups: Record<string, Rule[]> = {}
    RULES.forEach((r) => {
      if (!groups[r.category]) groups[r.category] = []
      groups[r.category].push(r)
    })
    return groups
  }, [])

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, rules]) => (
        <div key={category} className="card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--lumi-border)' }}>
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--lumi-text)' }}>{category}</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--lumi-border)' }}>
            {rules.map((rule) => (
              <div key={rule.id}>
                <button
                  onClick={() => setOpenRule(openRule === rule.id ? null : rule.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-lumi-text/[0.03]"
                >
                  <ChevronRight
                    size={14}
                    style={{
                      color: 'var(--lumi-text3)',
                      transform: openRule === rule.id ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  />
                  <span className="text-[13px] font-medium" style={{ color: 'var(--lumi-text)' }}>
                    {rule.title}
                  </span>
                </button>
                <AnimatePresence>
                  {openRule === rule.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 space-y-2">
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--lumi-text2)' }}>
                          {rule.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rule.examples.map((ex) => (
                            <span
                              key={ex}
                              className="text-[12px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)',
                                color: 'var(--lumi-accent)',
                              }}
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Flashcard Mode ── */
function FlashcardMode() {
  const [queue, setQueue] = useState<FlashcardWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [finished, setFinished] = useState(false)
  const [startedAt] = useState(Date.now())

  useEffect(() => {
    setQueue(shuffle([...FLASHCARD_WORDS]))
  }, [])

  useEffect(() => {
    setFlipped(false)
  }, [currentIndex])

  const handleRate = useCallback(
    (rating: 'again' | 'hard' | 'good' | 'easy') => {
      if (rating === 'again') {
        setSessionWrong((c) => c + 1)
        setQueue((prev) => [...prev, queue[currentIndex]])
      } else {
        setSessionCorrect((c) => c + 1)
      }

      const effectiveLen = rating === 'again' ? queue.length + 1 : queue.length
      if (currentIndex < effectiveLen - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        setFinished(true)
      }
    },
    [queue, currentIndex]
  )

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

  if (queue.length === 0) return null

  if (finished) {
    const total = sessionCorrect + sessionWrong
    const acc = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
    const sessionSeconds = Math.floor((Date.now() - startedAt) / 1000)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)' }}
        >
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
          <Link to="/accentuation" className="btn btn-secondary">Voltar</Link>
          <button onClick={() => { setQueue(shuffle([...FLASHCARD_WORDS])); setCurrentIndex(0); setSessionCorrect(0); setSessionWrong(0); setFinished(false) }} className="btn btn-primary">
            Jogar novamente <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    )
  }

  const word = queue[currentIndex]
  const rule = getRuleById(word.ruleId)
  const progress = ((currentIndex + 1) / queue.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
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

      {/* Flashcard */}
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
                  Como se acentua?
                </p>
                <p className="text-3xl font-bold" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
                  {word.word}
                </p>
                {word.hint && (
                  <p className="text-[13px] mt-3" style={{ color: 'var(--lumi-text2)' }}>
                    {word.hint}
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
                <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--lumi-text3)' }}>
                  Forma correta
                </p>
                <p className="text-3xl font-bold" style={{ color: 'var(--lumi-accent)', letterSpacing: '-0.01em' }}>
                  {word.accented}
                </p>
                {rule && (
                  <div className="mt-4 space-y-1.5">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)',
                        color: 'var(--lumi-accent)',
                      }}
                    >
                      {rule.category}
                    </span>
                    <p className="text-[12px]" style={{ color: 'var(--lumi-text2)' }}>
                      {rule.title}
                    </p>
                  </div>
                )}
              </>
            )}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Rating buttons */}
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
          <Brain size={12} /> Tente lembrar a forma correta antes de revelar
        </p>
      )}
    </div>
  )
}

/* ── Quiz Mode ── */
function QuizMode() {
  const [queue, setQueue] = useState<QuizItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [finished, setFinished] = useState(false)
  const [startedAt] = useState(Date.now())

  useEffect(() => {
    const items: QuizItem[] = shuffle(FLASHCARD_WORDS).slice(0, 20).map((w) => {
      const distractors = shuffle(
        FLASHCARD_WORDS.filter((d) => d.accented !== w.accented).map((d) => d.accented)
      ).slice(0, 3)
      const options = shuffle([w.accented, ...distractors])
      return { word: w.word, options, correct: w.accented, ruleId: w.ruleId }
    })
    setQueue(items)
  }, [])

  useEffect(() => {
    setSelected(null)
    setAnswered(false)
  }, [currentIndex])

  const handleAnswer = useCallback(
    (opt: string) => {
      if (answered) return
      setSelected(opt)
      setAnswered(true)
      const correct = opt === queue[currentIndex].correct
      setIsCorrect(correct)
      if (correct) setSessionCorrect((c) => c + 1)
      else setSessionWrong((c) => c + 1)
    },
    [answered, queue, currentIndex]
  )

  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) setCurrentIndex((i) => i + 1)
    else setFinished(true)
  }, [currentIndex, queue.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!queue.length || finished) return
      const item = queue[currentIndex]
      if (!answered) {
        const key = e.key.toUpperCase()
        const idx = ['A', 'B', 'C', 'D'].indexOf(key)
        if (idx >= 0 && idx < item.options.length) {
          handleAnswer(item.options[idx])
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queue, finished, answered, currentIndex, handleAnswer, handleNext])

  if (queue.length === 0) return null

  if (finished) {
    const total = sessionCorrect + sessionWrong
    const acc = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
    const sessionSeconds = Math.floor((Date.now() - startedAt) / 1000)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)' }}
        >
          <Sparkles size={30} style={{ color: 'var(--lumi-accent)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
          Quiz concluído!
        </h2>
        <p className="text-[13px] mb-6" style={{ color: 'var(--lumi-text2)' }}>
          {total} questões em {sessionSeconds}s
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
          <Link to="/accentuation" className="btn btn-secondary">Voltar</Link>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Jogar novamente <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    )
  }

  const item = queue[currentIndex]
  const rule = getRuleById(item.ruleId)
  const progress = ((currentIndex + 1) / queue.length) * 100
  const LETTERS = ['A', 'B', 'C', 'D']

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
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

      {/* Question */}
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
            Qual a forma correta de <span className="font-semibold" style={{ color: 'var(--lumi-accent)' }}>{item.word}</span>?
          </p>

          <div className="space-y-2">
            {item.options.map((opt, idx) => {
              const isSelected = answered && selected === opt
              const isCorrectAnswer = answered && opt === item.correct

              let borderColor = 'var(--lumi-border)'
              let bgColor = 'var(--lumi-surface)'
              let letterBg = 'color-mix(in srgb, var(--lumi-text) 8%, transparent)'
              let letterColor = 'var(--lumi-text3)'

              if (isCorrectAnswer) {
                borderColor = 'var(--lumi-success)'; bgColor = 'var(--lumi-success-bg)'
                letterBg = 'var(--lumi-success)'; letterColor = '#fff'
              }
              if (isSelected && !isCorrectAnswer) {
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
                  <span className="text-left text-[14px] font-medium flex-1" style={{ color: 'var(--lumi-text)' }}>
                    {opt}
                  </span>
                  {isCorrectAnswer && <CheckCircle size={15} className="ml-auto shrink-0" style={{ color: 'var(--lumi-success)' }} />}
                  {isSelected && !isCorrectAnswer && <XCircle size={15} className="ml-auto shrink-0" style={{ color: 'var(--lumi-danger)' }} />}
                </button>
              )
            })}
          </div>

          {/* Feedback + next */}
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
                    A forma correta é <strong>{item.correct}</strong>.
                  </p>
                )}
                {rule && (
                  <p className="text-[11px] mt-2" style={{ color: 'var(--lumi-text3)' }}>
                    Regra: {rule.category} — {rule.title}
                  </p>
                )}
              </div>

              <button
                onClick={handleNext}
                className="btn btn-primary w-full"
                style={{ height: '42px' }}
              >
                {currentIndex < queue.length - 1 ? 'Próxima questão' : 'Finalizar'}
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-[11px] text-center mt-4" style={{ color: 'var(--lumi-text3)' }}>
        A–D → responder · Enter → próxima
      </p>
    </div>
  )
}

/* ── Main Page ── */
export default function Accentuation() {
  const [mode, setMode] = useState<Mode>('reference')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)' }}
          >
            <BookOpen size={20} style={{ color: 'var(--lumi-accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
              Acentuação
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--lumi-text2)' }}>
              Regras de acentuação do português + prática
            </p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-text) 5%, transparent)' }}>
        {([
          { key: 'reference' as const, label: 'Regras', icon: List },
          { key: 'flashcard' as const, label: 'Flashcards', icon: Layers },
          { key: 'quiz' as const, label: 'Quiz', icon: Shuffle },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              mode === key ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: mode === key ? 'var(--lumi-surface)' : 'transparent',
              color: mode === key ? 'var(--lumi-accent)' : 'var(--lumi-text2)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {mode === 'reference' && <ReferenceSection />}
          {mode === 'flashcard' && <FlashcardMode />}
          {mode === 'quiz' && <QuizMode />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
