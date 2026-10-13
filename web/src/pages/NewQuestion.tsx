import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchSubjects, createQuestion, fetchTopics, fetchNotebooks } from '../api/client'
import type { Alternative } from '../types'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import { PlusCircle } from 'lucide-react'
import { cleanPastedText, parseAlternatives } from '../utils'

const letters = ['A', 'B', 'C', 'D', 'E']
const PRESET_SOURCES = ['CESPE', 'FGV', 'FCC', 'VUNESP', 'CESGRANRIO', 'IBFC', 'CONSULPLAN', 'MPE', 'MPF']

export default function NewQuestion() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: topics } = useQuery({ queryKey: ['topics'], queryFn: fetchTopics })
  const { data: notebooks } = useQuery({ queryKey: ['notebooks'], queryFn: fetchNotebooks })

  const [subjectId, setSubjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [text, setText] = useState('')
  const [questionType, setQuestionType] = useState('multipla_escolha')
  const [alternatives, setAlternatives] = useState<Alternative[]>([
    { letter: 'A', text: '' },
    { letter: 'B', text: '' },
    { letter: 'C', text: '' },
    { letter: 'D', text: '' },
    { letter: 'E', text: '' },
  ])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [source, setSource] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [selectedNotebooks, setSelectedNotebooks] = useState<number[]>([])
  const [autoDetected, setAutoDetected] = useState(false)

  const mutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast('success', 'Questão criada')
      navigate('/questions')
    },
    onError: () => toast('error', 'Erro ao criar questão'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !topic || !text || !correctAnswer) return

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    mutation.mutate({
      subject_id: Number(subjectId),
      topic,
      text,
      question_type: questionType,
      alternatives: questionType === 'certo_errado'
        ? [{ letter: 'C', text: 'Certo' }, { letter: 'E', text: 'Errado' }]
        : alternatives.filter((a) => a.text.trim()),
      correct_answer: correctAnswer,
      explanation,
      source,
      tags,
      notebook_ids: selectedNotebooks,
    })
  }

  const updateAlternative = (index: number, value: string) => {
    setAlternatives((prev) => prev.map((a, i) => (i === index ? { ...a, text: value } : a)))
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>, setter: (v: string) => void) => {
    const pasted = e.clipboardData.getData('text')
    if (!pasted) return
    const cleaned = cleanPastedText(pasted)
    if (cleaned !== pasted) {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const before = target.value.slice(0, start)
      const after = target.value.slice(end)
      setter(before + cleaned + after)
    }
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <PageHeader title="Nova Questão" description="Adicione uma questão com alternativas, explicação e tags" icon={<PlusCircle size={20} className="text-apple-accent" />} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Matéria</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="input"
            >
              <option value="">Selecione...</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tópico</label>
            <input
              list="topics"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              placeholder="ex: Direito Constitucional"
              className="input"
            />
            <datalist id="topics">
              {topics?.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        {autoDetected && (
          <div className="p-3 rounded-lg bg-apple-surface/30 border border-emerald-200 dark:border-emerald-800 text-sm text-apple-text dark:text-emerald-300 flex items-center gap-2">
            <span>Alternativas detectadas automaticamente. Selecione a resposta correta abaixo.</span>
          </div>
        )}

        <div>
          <label className="label">Enunciado da Questão</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text')
              if (!pasted) return

              const cleaned = cleanPastedText(pasted)
              const parsed = parseAlternatives(cleaned)

              if (parsed.alternatives.length >= 2) {
                e.preventDefault()
                setText(parsed.questionText)
                const filled = letters.map((l) => {
                  const found = parsed.alternatives.find((a) => a.letter === l)
                  return { letter: l, text: found?.text || '' }
                })
                setAlternatives(filled)
                setAutoDetected(true)
              } else {
                handlePaste(e, setText)
              }
            }}
            required
            rows={8}
            placeholder="Cole o enunciado completo (com alternativas) — o sistema detecta automaticamente as opções A-E"
            className="input resize-y min-h-[200px]"
          />
        </div>

        <div>
          <label className="label mb-2">Tipo da Questão</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer text-apple-text">
              <input
                type="radio"
                name="questionType"
                value="multipla_escolha"
                checked={questionType === 'multipla_escolha'}
                onChange={(e) => {
                  setQuestionType(e.target.value)
                  setCorrectAnswer('')
                }}
                className="text-apple-text focus:ring-apple-accent"
              />
              Múltipla Escolha (A-E)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer text-apple-text">
              <input
                type="radio"
                name="questionType"
                value="certo_errado"
                checked={questionType === 'certo_errado'}
                onChange={(e) => {
                  setQuestionType(e.target.value)
                  setCorrectAnswer('')
                }}
                className="text-apple-text focus:ring-apple-accent"
              />
              Certo / Errado
            </label>
          </div>
        </div>

        {questionType === 'multipla_escolha' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="label">Alternativas</label>
              {autoDetected && (
                <span className="text-[10px] font-medium text-apple-text-secondary bg-apple-surface/50 px-1.5 py-0.5 rounded-full">
                  Detectadas
                </span>
              )}
            </div>
            <div className="space-y-2">
              {alternatives.map((alt, i) => (
                <div key={alt.letter} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-apple-text-secondary">{alt.letter}.</span>
                  <input
                    value={alt.text}
                    onChange={(e) => updateAlternative(i, e.target.value)}
                    placeholder={`Texto da alternativa ${alt.letter}`}
                    className="input flex-1"
                  />
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer text-apple-text">
                    <input
                      type="radio"
                      name="correct"
                      value={alt.letter}
                      checked={correctAnswer === alt.letter}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      required
                      className="text-apple-text focus:ring-apple-accent"
                    />
                    Correta
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {questionType === 'certo_errado' && (
          <div>
            <label className="label mb-2">Resposta Correta</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="correct"
                  value="C"
                  checked={correctAnswer === 'C'}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  required
                  className="text-apple-text focus:ring-emerald-500"
                />
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-apple-surface/50 text-apple-text text-xs font-bold">C</span>
                Certo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="correct"
                  value="E"
                  checked={correctAnswer === 'E'}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  required
                  className="text-apple-text focus:ring-red-500"
                />
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-apple-surface/50 text-apple-text text-xs font-bold">E</span>
                Errado
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="label">Explicação Detalhada</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            onPaste={(e) => handlePaste(e, setExplanation)}
            rows={8}
            placeholder="Cole a explicação detalhada da IA aqui..."
            className="input resize-y min-h-[200px]"
          />
        </div>

        <div>
          <label className="label mb-2">Cadernos</label>
          <div className="flex flex-wrap gap-2">
            {notebooks?.map((nb) => {
              const selected = selectedNotebooks.includes(nb.id)
              return (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() =>
                    setSelectedNotebooks((prev) =>
                      selected ? prev.filter((id) => id !== nb.id) : [...prev, nb.id]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selected
                      ? 'bg-apple-surface/50 border-apple-border text-apple-text'
                      : 'bg-apple-surface border-apple-border text-apple-text-secondary hover:border-apple-accent/50'
                  }`}
                >
                  {nb.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fonte</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(source === s ? '' : s)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium border transition-colors ${
                    source === s
                      ? 'bg-apple-surface/50 border-apple-border text-apple-text'
                      : 'bg-apple-surface/50 border-apple-border text-apple-text-secondary hover:border-apple-accent/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="ou digite outra fonte..."
              className="input"
            />
          </div>
          <div>
            <label className="label">Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="input"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>Salvar Questão</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/questions')}>Cancelar</Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-apple-danger">Erro ao salvar questão.</p>
        )}
      </form>
    </motion.div>
  )
}
