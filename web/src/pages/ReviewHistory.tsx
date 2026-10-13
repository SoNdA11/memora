import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchSubjects, fetchReviewLogs } from '../api/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, X, History } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { ListSkeleton } from '../components/Skeleton'
import type { ReviewLog } from '../types'

export default function ReviewHistory() {
  const [subjectFilter, setSubjectFilter] = useState('')
  const [correctFilter, setCorrectFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data, isLoading } = useQuery({
    queryKey: ['reviewLogs', subjectFilter, correctFilter, page],
    queryFn: () => fetchReviewLogs({ subject_id: subjectFilter || undefined, correct: correctFilter || undefined, page, limit: 30 }),
  })

  return (
    <div>
      <PageHeader title="Histórico" description="Registro de todas as suas revisões" icon={<History size={20} className="text-apple-accent" />}>
        <div className="flex gap-2">
          <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1) }} className="input px-3 py-1.5 text-xs w-auto">
            <option value="">Todas matérias</option>
            {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={correctFilter} onChange={(e) => { setCorrectFilter(e.target.value); setPage(1) }} className="input px-3 py-1.5 text-xs w-auto">
            <option value="">Todas respostas</option>
            <option value="true">Corretas</option>
            <option value="false">Erradas</option>
          </select>
        </div>
      </PageHeader>

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <>
          {data?.data.length === 0 ? (
            <EmptyState icon={History} title="Nenhuma revisão encontrada" description="Suas revisões aparecerão aqui conforme você for revisando." />
          ) : (
            <motion.div className="space-y-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
              {data?.data.map((log: ReviewLog) => {
                const question = log.question
                return (
                  <motion.div key={log.id} variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }} className="card-hover p-4">
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/questions/${log.question_id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {log.correct ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-apple-success"><Check size={14} /> Correta</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-apple-danger"><X size={14} /> Errada</span>
                          )}
                          {question?.subject && (
                            <span className="badge-subject" style={{ backgroundColor: question.subject.color ? `${question.subject.color}20` : 'var(--apple-accent)', color: question.subject.color || '#6366f1' }}>
                              {question.subject.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-apple-text line-clamp-1">{question?.text || `Questão #${log.question_id}`}</p>
                        <p className="text-xs text-apple-text-secondary mt-1">
                          {format(new Date(log.reviewed_at), "dd 'de' MMM 'de' yyyy HH:mm", { locale: ptBR })}
                          {log.selected_answer && ` · Resposta: ${log.selected_answer}`}
                          {log.time_spent > 0 && ` · ${log.time_spent}s`}
                        </p>
                      </Link>
                      <Link to={`/questions/${log.question_id}`} className="btn-icon shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
          <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
