import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building, Calendar, Briefcase, Edit, Trash2, ArrowLeft, ScanEye } from 'lucide-react'
import { fetchExamAnalysis, deleteExamAnalysis } from '../api/client'
import MarkdownContent from '../components/MarkdownContent'
import Button from '../components/Button'
import { CardSkeleton } from '../components/Skeleton'
import { useToast } from '../contexts/ToastContext'

export default function ExamAnalysisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['exam-analysis', id],
    queryFn: () => fetchExamAnalysis(Number(id)),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteExamAnalysis(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-analyses'] })
      toast('success', 'Análise excluída')
      navigate('/exam-analyses')
    },
  })

  if (isLoading) return <CardSkeleton />
  if (!analysis) return <p className="text-apple-text-secondary">Análise não encontrada.</p>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <Link to="/exam-analyses" className="inline-flex items-center gap-1.5 text-sm text-apple-text-secondary hover:text-apple-text mb-4 transition-colors">
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ScanEye size={18} className="text-apple-accent" />
              <h2 className="text-xl font-bold text-apple-text">{analysis.title}</h2>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-apple-text-secondary">
              {analysis.exam_org && <span className="flex items-center gap-1.5"><Building size={14} />{analysis.exam_org}</span>}
              {analysis.year > 0 && <span className="flex items-center gap-1.5"><Calendar size={14} />{analysis.year}</span>}
              {analysis.role && <span className="flex items-center gap-1.5"><Briefcase size={14} />{analysis.role}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to={`/exam-analyses/${analysis.id}/edit`} className="btn-icon hover:text-apple-accent" title="Editar"><Edit size={18} /></Link>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm('Excluir esta análise?')) deleteMutation.mutate() }} loading={deleteMutation.isPending} icon={<Trash2 size={15} />}>Excluir</Button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <MarkdownContent content={analysis.content} />
      </div>
    </motion.div>
  )
}
