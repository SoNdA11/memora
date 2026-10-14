import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchQuestion, deleteQuestion, toggleFavorite, fetchAnnotations, createAnnotation, deleteAnnotation } from '../api/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, ArrowLeft, Edit3, StickyNote, Plus, X, Star, CheckCircle, XCircle } from 'lucide-react'
import { CardSkeleton } from '../components/Skeleton'
import MarkdownContent from '../components/MarkdownContent'
import Button from '../components/Button'
import { useConfirm } from '../contexts/ConfirmContext'
import { useToast } from '../contexts/ToastContext'
import { safeParseArray, safeParseStringArray } from '../utils/safeJson'

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [annotationText, setAnnotationText] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => fetchQuestion(Number(id)),
    enabled: !!id,
  })

  const { data: annotations } = useQuery({
    queryKey: ['annotations', id],
    queryFn: () => fetchAnnotations(Number(id)),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuestion(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['questions'] }); toast('success', 'Questão excluída'); navigate('/questions') },
  })

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavorite(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['question', id] }); queryClient.invalidateQueries({ queryKey: ['questions'] }) },
  })

  const createAnnotationMutation = useMutation({
    mutationFn: () => createAnnotation(Number(id), annotationText),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['annotations', id] }); setAnnotationText(''); toast('success', 'Anotação adicionada') },
  })

  const deleteAnnotationMutation = useMutation({
    mutationFn: (annotationId: number) => deleteAnnotation(annotationId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['annotations', id] }); toast('success', 'Anotação excluída') },
  })

  if (isLoading) return <CardSkeleton />
  if (!data) return <p className="text-apple-text-secondary">Questão não encontrada.</p>

  const { question, review } = data
  const alternatives = safeParseArray<{ letter: string; text: string }>(question.alternatives)
  const tags = safeParseStringArray(question.tags)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/questions')} className="flex items-center gap-1.5 text-sm text-apple-text-secondary hover:text-apple-text transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => favoriteMutation.mutate()} className={`btn-icon ${question.favorite ? 'text-apple-accent hover:text-apple-accent-hover' : ''}`}>
            <Star size={18} fill={question.favorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => navigate(`/questions/${id}/edit`)} className="btn-icon hover:text-apple-accent"><Edit3 size={18} /></button>
          <Button variant="ghost" size="sm" onClick={async () => { const ok = await confirm({ title: 'Excluir questão', message: 'Tem certeza?', variant: 'danger' }); if (ok) deleteMutation.mutate() }} loading={deleteMutation.isPending} icon={<Trash2 size={15} />}>Excluir</Button>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="badge-subject" style={{ backgroundColor: question.subject?.color ? `${question.subject.color}20` : 'var(--apple-accent)', color: question.subject?.color || '#6366f1' }}>
                {question.subject?.name || 'Sem matéria'}
              </span>
              <span className="text-xs text-apple-text-secondary">{question.topic}</span>
              {question.source && <span className="badge bg-apple-border text-apple-text-secondary">{question.source}</span>}
              {question.question_type === 'certo_errado' && <span className="badge bg-apple-accent/10 text-apple-accent">C/E</span>}
            </div>
            <div className="text-lg text-apple-text leading-relaxed"><MarkdownContent content={question.text} /></div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-apple-text">{question.question_type === 'certo_errado' ? 'Resposta' : 'Alternativas'}</p>
          {question.question_type === 'certo_errado' ? (
            <div className="grid grid-cols-2 gap-3">
              {['C', 'E'].map((letter) => {
                const label = letter === 'C' ? 'Certo' : 'Errado'
                const isCorrect = letter === question.correct_answer
                return (
                  <div key={letter} className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl text-lg font-semibold border-2 ${isCorrect ? 'border-apple-success bg-apple-success/5' : 'border-apple-border bg-apple-surface/50'}`}>
                    <span className="text-3xl">{letter === 'C' ? '✓' : '✗'}</span>
                    <span className={isCorrect ? 'text-apple-success' : 'text-apple-text'}>{label}</span>
                    {isCorrect && <span className="text-xs font-medium text-apple-success">Correta</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            alternatives.map((alt: { letter: string; text: string }) => {
              const isCorrect = alt.letter === question.correct_answer
              return (
                <div key={alt.letter} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm border ${isCorrect ? 'border-apple-success bg-apple-success/5' : 'border-apple-border bg-apple-surface/50'}`}>
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${isCorrect ? 'bg-apple-success text-white' : 'bg-apple-border text-apple-text-secondary'}`}>{alt.letter}</span>
                  <span className="text-apple-text">{alt.text}</span>
                  {isCorrect && <span className="ml-auto text-xs font-medium text-apple-success flex items-center gap-1"><CheckCircle size={14} /> Correta</span>}
                </div>
              )
            })
          )}
        </div>

        {question.explanation && (
          <div className="bg-apple-text/[0.03] border border-apple-border rounded-lg p-4">
            <p className="text-sm font-medium text-apple-text mb-2">Explicação</p>
            <MarkdownContent content={question.explanation} />
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag: string) => <span key={tag} className="badge bg-apple-text/[0.05] text-apple-text-secondary">#{tag}</span>)}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t border-apple-border text-xs text-apple-text-secondary">
          <span>Criada em {format(new Date(question.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
          {review?.next_review && <span>Próxima revisão: {format(new Date(review.next_review), "dd 'de' MMM", { locale: ptBR })}</span>}
        </div>
      </div>

      <div className="card p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote size={18} className="text-apple-accent" />
            <h3 className="text-sm font-semibold text-apple-text">Anotações</h3>
            <span className="badge bg-apple-accent/10 text-apple-accent">{annotations?.length || 0}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <textarea value={annotationText} onChange={(e) => setAnnotationText(e.target.value)} placeholder="Adicionar anotação..." rows={2} className="input flex-1 resize-none" />
          <Button onClick={() => createAnnotationMutation.mutate()} loading={createAnnotationMutation.isPending} disabled={!annotationText.trim()} size="sm" className="self-end"><Plus size={16} /></Button>
        </div>

        <div className="space-y-2">
          {(!annotations || annotations.length === 0) && <p className="text-xs text-apple-text-secondary text-center py-3">Nenhuma anotação ainda.</p>}
          {annotations?.map((ann) => (
            <div key={ann.id} className="bg-apple-text/[0.03] border border-apple-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-apple-text whitespace-pre-wrap flex-1">{ann.content}</p>
                <Button variant="ghost" size="sm" onClick={async () => { const ok = await confirm({ title: 'Excluir anotação', message: 'Tem certeza?', variant: 'danger' }); if (ok) deleteAnnotationMutation.mutate(ann.id) }} loading={deleteAnnotationMutation.isPending} className="shrink-0 hover:text-apple-danger"><X size={14} /></Button>
              </div>
              <p className="text-xs text-apple-text-secondary mt-1">{format(new Date(ann.created_at), "dd 'de' MMM 'de' yyyy HH:mm", { locale: ptBR })}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
