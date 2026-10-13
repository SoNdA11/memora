import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, BarChart3, Calendar, Building, Briefcase, Trash2, Eye, ScanEye } from 'lucide-react'
import { fetchExamAnalyses, deleteExamAnalysis } from '../api/client'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { ListSkeleton } from '../components/Skeleton'
import { useToast } from '../contexts/ToastContext'

export default function ExamAnalysisList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: analyses, isLoading } = useQuery({ queryKey: ['exam-analyses'], queryFn: fetchExamAnalyses })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExamAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-analyses'] })
      toast('success', 'Análise excluída')
    },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Raio-X de Provas" description="Análise detalhada de provas anteriores" icon={<ScanEye size={20} className="text-apple-accent" />}>
        <Link to="/exam-analyses/new">
          <Button size="sm" icon={<Plus size={14} />}>Nova Análise</Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <ListSkeleton />
      ) : !analyses || analyses.length === 0 ? (
        <EmptyState icon={BarChart3} title="Nenhuma análise de prova" description="Crie análises detalhadas de provas anteriores para entender o padrão da banca." action={<Link to="/exam-analyses/new"><Button icon={<Plus size={14} />}>Criar Primeira Análise</Button></Link>} />
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          {analyses.map((a) => (
            <motion.div key={a.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0" onClick={() => navigate(`/exam-analyses/${a.id}`)}>
                  <h3 className="text-sm font-semibold text-apple-text line-clamp-1">{a.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-apple-text-secondary">
                    {a.exam_org && <span className="flex items-center gap-1"><Building size={12} />{a.exam_org}</span>}
                    {a.year > 0 && <span className="flex items-center gap-1"><Calendar size={12} />{a.year}</span>}
                    {a.role && <span className="flex items-center gap-1"><Briefcase size={12} />{a.role}</span>}
                  </div>
                  <p className="text-xs text-apple-text-secondary mt-2">Criado em {new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-0.5 ml-3 shrink-0">
                  <button onClick={() => navigate(`/exam-analyses/${a.id}`)} className="btn-icon hover:text-apple-accent" title="Visualizar"><Eye size={15} /></button>
                  <button onClick={() => { if (confirm('Excluir esta análise?')) deleteMutation.mutate(a.id) }} className="btn-icon hover:text-apple-danger" title="Excluir"><Trash2 size={15} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
