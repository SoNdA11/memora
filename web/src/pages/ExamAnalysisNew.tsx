import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createExamAnalysis } from '../api/client'
import MarkdownContent from '../components/MarkdownContent'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import { ScanEye } from 'lucide-react'

export default function ExamAnalysisNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [examOrg, setExamOrg] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [role, setRole] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)

  const mutation = useMutation({
    mutationFn: () => createExamAnalysis({ title, exam_org: examOrg, year, role, content }),
    onSuccess: (data) => navigate(`/exam-analyses/${data.id}`),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    mutation.mutate()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <PageHeader title="Nova Análise de Prova" description="Crie uma análise detalhada de prova anterior" icon={<ScanEye size={20} className="text-apple-accent" />} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dataprev 2024 - Desenvolvimento de Software"
              className="input px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Banca</label>
            <input
              value={examOrg}
              onChange={(e) => setExamOrg(e.target.value)}
              placeholder="Ex: FGV, Cebraspe, FCC"
              className="input px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Ano</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">Cargo / Perfil</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Perfil 3 - Desenvolvimento de Software"
              className="input px-3 py-2 w-full"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-apple-text">
              Conteúdo da Análise (Markdown)
            </label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-apple-accent hover:text-apple-accent-hover"
            >
              {preview ? 'Editar' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="border border-apple-border rounded-lg p-4 min-h-[300px] bg-apple-surface">
              <MarkdownContent content={content} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="input px-3 py-2 w-full font-mono text-sm"
              placeholder="Escreva a análise em markdown..."
              required
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!title.trim() || !content.trim()} loading={mutation.isPending}>Salvar Análise</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/exam-analyses')}>Cancelar</Button>
        </div>
      </form>
    </motion.div>
  )
}
