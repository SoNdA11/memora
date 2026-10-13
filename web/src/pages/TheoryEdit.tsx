import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchTheory, fetchTopics, fetchSubjects, updateTheory } from '../api/client'
import { CardSkeleton } from '../components/Skeleton'
import MarkdownContent from '../components/MarkdownContent'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import { Pencil } from 'lucide-react'
import { cleanPastedText } from '../utils'

export default function TheoryEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: topics } = useQuery({ queryKey: ['topics'], queryFn: fetchTopics })

  const { data: entry, isLoading } = useQuery({
    queryKey: ['theory', id],
    queryFn: () => fetchTheory(Number(id)),
    enabled: !!id,
  })

  const [subjectId, setSubjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [notebooklmUrl, setNotebooklmUrl] = useState('')
  const [completed, setCompleted] = useState(false)
  const [current, setCurrent] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (entry) {
      setSubjectId(String(entry.subject_id))
      setTopic(entry.topic)
      setTitle(entry.title)
      setContent(entry.content)
      setSource(entry.source || '')
      setNotebooklmUrl(entry.notebooklm_url || '')
      setCompleted(entry.completed)
      setCurrent(entry.current)
      const tags = (() => { try { return JSON.parse(entry.tags || '[]') } catch { return [] } })()
      setTagsInput(tags.join(', '))
    }
  }, [entry])

  const mutation = useMutation({
    mutationFn: () => updateTheory(Number(id), {
      subject_id: subjectId ? Number(subjectId) : undefined,
      topic: topic || undefined,
      title: title || undefined,
      content: content || undefined,
      source: source || undefined,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      notebooklm_url: notebooklmUrl || undefined,
      completed,
      current: current,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theory'] })
      navigate(`/theory/${id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return
    mutation.mutate()
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
  if (!entry) return <p className="text-apple-text-secondary">Entrada não encontrada.</p>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <PageHeader title="Editar Teoria" description="Atualize o conteúdo teórico" icon={<Pencil size={20} className="text-apple-accent" />} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-apple-text mb-1">Matéria</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 input"
          >
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-text mb-1">Tópico</label>
          <input
            list="topics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="ex: Direito Constitucional"
            className="w-full px-3 py-2 input"
          />
          <datalist id="topics">
            {topics?.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-apple-text mb-1">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="ex: Princípios da Administração Pública"
            className="w-full px-3 py-2 input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-apple-text">Conteúdo</label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-apple-accent hover:text-apple-accent-hover"
            >
              {showPreview ? 'Editar' : 'Visualizar'}
            </button>
          </div>
          {showPreview ? (
            <div className="min-h-[200px] p-4 border border-apple-border rounded-lg bg-apple-surface">
              <MarkdownContent content={content || '*Nenhum conteúdo*'} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={(e) => handlePaste(e, setContent)}
              required
              rows={20}
              className="w-full px-3 py-2 input resize-y font-mono min-h-[400px]"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Fonte</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="ex: Lei 8.112/90, Doutrina"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Link NotebookLM</label>
            <input
              value={notebooklmUrl}
              onChange={(e) => setNotebooklmUrl(e.target.value)}
              placeholder="https://notebooklm.google.com/..."
              className="w-full px-3 py-2 input"
            />
          </div>
          <div className="flex flex-col gap-3 pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-apple-border text-apple-accent focus:ring-apple-accent"
              />
              <span className="text-sm font-medium text-apple-text">Teoria concluída</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={current}
                onChange={(e) => setCurrent(e.target.checked)}
                className="w-4 h-4 rounded border-apple-border text-apple-accent focus:ring-apple-accent"
              />
              <span className="text-sm font-medium text-apple-text">Estudando agora</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>Salvar</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/theory/${id}`)}>Cancelar</Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-apple-danger">Erro ao salvar entrada teórica.</p>
        )}
      </form>
    </motion.div>
  )
}
