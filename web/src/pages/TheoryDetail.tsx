import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchTheory, deleteTheory, exportTheoryPDF, toggleTheoryComplete, toggleTheoryCurrent } from '../api/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, ArrowLeft, Edit3, FileDown, ExternalLink, CheckCircle2, Circle, Play, Square, BookText } from 'lucide-react'
import MarkdownContent from '../components/MarkdownContent'
import Button from '../components/Button'
import { CardSkeleton } from '../components/Skeleton'
import { useConfirm } from '../contexts/ConfirmContext'
import { useToast } from '../contexts/ToastContext'

export default function TheoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm } = useConfirm()
  const { toast } = useToast()

  const { data: entry, isLoading } = useQuery({
    queryKey: ['theory', id],
    queryFn: () => fetchTheory(Number(id)),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTheory(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theory'] })
      toast('success', 'Entrada teórica excluída')
      navigate('/theory')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: () => toggleTheoryComplete(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['theory', id] }); queryClient.invalidateQueries({ queryKey: ['theory'] }) },
  })

  const currentMutation = useMutation({
    mutationFn: () => toggleTheoryCurrent(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['theory', id] }); queryClient.invalidateQueries({ queryKey: ['theory'] }) },
  })

  if (isLoading) return <CardSkeleton />
  if (!entry) return <p className="text-apple-text-secondary">Entrada não encontrada.</p>

  const tags = (() => { try { return JSON.parse(entry.tags || '[]') } catch { return [] } })()

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/theory')} className="flex items-center gap-1.5 text-sm text-apple-text-secondary hover:text-apple-text transition-colors">
          <ArrowLeft size={16} /> Teoria
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => exportTheoryPDF(Number(id))} className="btn-icon hover:text-green-600" title="Exportar PDF"><FileDown size={18} /></button>
          <button onClick={() => navigate(`/theory/${id}/edit`)} className="btn-icon hover:text-apple-accent"><Edit3 size={18} /></button>
          <Button variant="ghost" size="sm" onClick={async () => { const ok = await confirm({ title: 'Excluir entrada', message: 'Tem certeza?', variant: 'danger' }); if (ok) deleteMutation.mutate() }} loading={deleteMutation.isPending} icon={<Trash2 size={15} />}>Excluir</Button>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <button onClick={() => toggleMutation.mutate()} className="shrink-0 text-apple-text-secondary hover:text-apple-accent transition-colors" title={entry.completed ? 'Marcar como não lida' : 'Marcar como lida'}>
              {entry.completed ? <CheckCircle2 size={20} className="text-apple-success" /> : <Circle size={20} />}
            </button>
            <button
              onClick={() => currentMutation.mutate()}
              className={`shrink-0 transition-colors ${entry.current ? 'text-apple-accent hover:text-apple-text-secondary' : 'text-apple-text-secondary hover:text-apple-accent'}`}
              title={entry.current ? 'Parar de estudar' : 'Estudando agora'}
            >
              {entry.current ? <Square size={16} fill="currentColor" /> : <Play size={16} />}
            </button>
            <span className="badge-subject" style={{ backgroundColor: entry.subject?.color ? `${entry.subject.color}20` : 'var(--apple-accent)', color: entry.subject?.color || '#6366f1' }}>
              {entry.subject?.name || 'Sem matéria'}
            </span>
            <span className="text-xs text-apple-text-secondary">{entry.topic}</span>
            {entry.source && <span className="badge bg-apple-border text-apple-text-secondary">{entry.source}</span>}
          </div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${entry.completed ? 'text-apple-text-secondary line-through' : 'text-apple-text'}`}>
            {entry.title}
            {entry.current && <span className="badge bg-apple-accent/10 text-apple-accent">Estudando</span>}
          </h2>
        </div>

        {entry.notebooklm_url && (
          <a href={entry.notebooklm_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-apple-accent hover:underline">
            <ExternalLink size={14} /> Abrir no NotebookLM
          </a>
        )}

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <MarkdownContent content={entry.content} />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {tags.map((tag: string) => <span key={tag} className="badge bg-apple-text/[0.05] text-apple-text-secondary">#{tag}</span>)}
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-apple-border text-xs text-apple-text-secondary">
          <span>Criado em {format(new Date(entry.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
          {entry.updated_at !== entry.created_at && <span>Atualizado em {format(new Date(entry.updated_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</span>}
        </div>
      </div>
    </motion.div>
  )
}
