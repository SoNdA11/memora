import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchSubjects, fetchQuestion, fetchNotebooks, updateQuestion } from '../api/client'
import type { Alternative } from '../types'
import { CardSkeleton } from '../components/Skeleton'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import TopicSelect from '../components/TopicSelect'
import { Pencil } from 'lucide-react'
import { cleanPastedText } from '../utils'

const letters = ['A', 'B', 'C', 'D', 'E']
const PRESET_SOURCES = ['CESPE', 'FGV', 'FCC', 'VUNESP', 'CESGRANRIO', 'IBFC', 'CONSULPLAN', 'MPE', 'MPF']

export default function EditQuestion() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: notebooks } = useQuery({ queryKey: ['notebooks'], queryFn: fetchNotebooks })

  const { data, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => fetchQuestion(Number(id)),
    enabled: !!id,
  })

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

  useEffect(() => {
    if (data?.question) {
      const q = data.question
      setSubjectId(String(q.subject_id))
      setTopic(q.topic)
      setText(q.text)
      setQuestionType(q.question_type || 'multipla_escolha')
      const parsed = (() => { try { return JSON.parse(q.alternatives || '[]') } catch { return [] } })()
      if (parsed.length > 0) setAlternatives(parsed)
      setCorrectAnswer(q.correct_answer)
      setExplanation(q.explanation || '')
      setSource(q.source || '')
      const tags = (() => { try { return JSON.parse(q.tags || '[]') } catch { return [] } })()
      setTagsInput(tags.join(', '))
      const qn = (q as any).notebooks
      setSelectedNotebooks(qn ? qn.map((nb: any) => nb.id) : [])
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: () => updateQuestion(Number(id), {
      subject_id: Number(subjectId),
      topic,
      text,
      question_type: questionType,
      alternatives: questionType === 'certo_errado'
        ? [{ letter: 'C', text: 'Certo' }, { letter: 'E', text: 'Errado' }]
        : alternatives,
      correct_answer: correctAnswer,
      explanation,
      source,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      notebook_ids: selectedNotebooks,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['question', id] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      navigate(`/questions/${id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !topic || !text || !correctAnswer) return
    mutation.mutate()
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

  if (isLoading) return <CardSkeleton />
  if (!data) return <p className="text-apple-text-secondary">Questão não encontrada.</p>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <PageHeader title="Editar Questão" description="Atualize os dados da questão" icon={<Pencil size={20} className="text-apple-accent" />} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Matéria</label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value)
                setTopic('')
              }}
              required
              className="w-full px-3 py-2 input"
            >
              <option value="">Selecione...</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Tópico</label>
            <TopicSelect
              subjectName={subjects?.find((s) => String(s.id) === subjectId)?.name}
              value={topic}
              onChange={setTopic}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-text mb-1">Enunciado da Questão</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => handlePaste(e, setText)}
            required
            rows={8}
            className="w-full px-3 py-2 input resize-y min-h-[200px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-text mb-2">Tipo da Questão</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="questionType"
                value="multipla_escolha"
                checked={questionType === 'multipla_escolha'}
                onChange={(e) => {
                  setQuestionType(e.target.value)
                  setCorrectAnswer('')
                }}
                className="text-apple-accent focus:ring-blue-500"
              />
              Múltipla Escolha (A-E)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="questionType"
                value="certo_errado"
                checked={questionType === 'certo_errado'}
                onChange={(e) => {
                  setQuestionType(e.target.value)
                  setCorrectAnswer('')
                }}
                className="text-apple-accent focus:ring-blue-500"
              />
              Certo / Errado
            </label>
          </div>
        </div>

        {questionType === 'multipla_escolha' && (
          <div>
            <label className="block text-sm font-medium text-apple-text mb-2">Alternativas</label>
            <div className="space-y-2">
              {alternatives.map((alt, i) => (
                <div key={alt.letter} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-apple-text-secondary">{alt.letter}.</span>
                  <input
                    value={alt.text}
                    onChange={(e) => updateAlternative(i, e.target.value)}
                    placeholder={`Texto da alternativa ${alt.letter}`}
                    className="flex-1 px-3 py-2 input"
                  />
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="correct"
                      value={alt.letter}
                      checked={correctAnswer === alt.letter}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      required
                      className="text-apple-accent focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-apple-text mb-2">Resposta Correta</label>
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
          <label className="block text-sm font-medium text-apple-text mb-1">Explicação Detalhada</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            onPaste={(e) => handlePaste(e, setExplanation)}
            rows={8}
            className="w-full px-3 py-2 input resize-y min-h-[200px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Fonte</label>
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
              className="w-full px-3 py-2 input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-text mb-2">Cadernos</label>
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

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>Salvar</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/questions/${id}`)}>Cancelar</Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-apple-danger">Erro ao salvar questão.</p>
        )}
      </form>
    </motion.div>
  )
}
