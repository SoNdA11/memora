import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchExamAnalysis, updateExamAnalysis } from '../api/client'
import MarkdownContent from '../components/MarkdownContent'
import { CardSkeleton } from '../components/Skeleton'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import { Pencil } from 'lucide-react'

export default function ExamAnalysisEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['exam-analysis', id],
    queryFn: () => fetchExamAnalysis(Number(id)),
    enabled: !!id,
  })

  const [title, setTitle] = useState('')
  const [examOrg, setExamOrg] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [role, setRole] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (analysis && !loaded) {
    setTitle(analysis.title)
    setExamOrg(analysis.exam_org || '')
    setYear(analysis.year || new Date().getFullYear())
    setRole(analysis.role || '')
    setContent(analysis.content)
    setLoaded(true)
  }

  const mutation = useMutation({
    mutationFn: () => updateExamAnalysis(Number(id), { title, exam_org: examOrg, year, role, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['exam-analysis', id] })
      navigate(`/exam-analyses/${id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    mutation.mutate()
  }

  if (isLoading) return <CardSkeleton />
  if (!analysis) return <p className="text-apple-text-secondary">Análise não encontrada.</p>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <PageHeader title="Editar Análise" description="Atualize a análise de prova" icon={<Pencil size={20} className="text-apple-accent" />} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input px-3 py-2 w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Banca</label>
            <input value={examOrg} onChange={(e) => setExamOrg(e.target.value)} placeholder="Ex: FGV" className="input px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Ano</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="input px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Cargo / Perfil</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className="input px-3 py-2 w-full" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-apple-text">Conteúdo (Markdown)</label>
            <button type="button" onClick={() => setPreview(!preview)} className="text-xs text-apple-accent hover:text-apple-accent-hover">
              {preview ? 'Editar' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="border border-apple-border rounded-lg p-4 min-h-[300px] bg-apple-surface">
              <MarkdownContent content={content} />
            </div>
          ) : (
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20} className="input px-3 py-2 w-full font-mono text-sm" required />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending}>Salvar</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/exam-analyses/${id}`)}>Cancelar</Button>
        </div>
      </form>
    </motion.div>
  )
}
