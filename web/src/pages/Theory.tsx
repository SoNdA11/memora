import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, BookText, Search, ExternalLink, CheckCircle2, Circle, Play, TrendingUp } from 'lucide-react'
import { fetchAllTheory, fetchSubjects, toggleTheoryComplete, toggleTheoryCurrent } from '../api/client'
import type { TheoryEntry } from '../types'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import { ListSkeleton, CardSkeleton } from '../components/Skeleton'

export default function Theory() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data, isLoading } = useQuery({
    queryKey: ['theory', search, subjectFilter, page],
    queryFn: () => fetchAllTheory({ search: search || undefined, subject_id: subjectFilter || undefined, page, limit: 30 }),
    placeholderData: (prev) => prev,
  })

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['theory-current'],
    queryFn: () => fetchAllTheory({ ...({ current: 'true' }), limit: 50 }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleTheoryComplete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['theory'] }); queryClient.invalidateQueries({ queryKey: ['theory-current'] }) },
  })

  const currentMutation = useMutation({
    mutationFn: (id: number) => toggleTheoryCurrent(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['theory'] }); queryClient.invalidateQueries({ queryKey: ['theory-current'] }) },
  })

  const currentEntries = currentData?.data || []
  const entries = data?.data || []

  const grouped: Record<string, TheoryEntry[]> = {}
  entries.forEach((e) => {
    const key = e.subject?.name || 'Sem matéria'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  const currentGrouped: Record<string, TheoryEntry[]> = {}
  currentEntries.forEach((e) => {
    const key = e.subject?.name || 'Sem matéria'
    if (!currentGrouped[key]) currentGrouped[key] = []
    currentGrouped[key].push(e)
  })

  const stripMarkdown = (text: string) =>
    text.replace(/<[^>]*>/g, '').replace(/#{1,6}\s?/g, '').replace(/(\*{1,3}|_{1,3}|~~|`{1,3})/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim()

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Teoria" description={data ? `${data.total} entradas` : 'Material teórico de estudo'} icon={<BookText size={20} className="text-apple-accent" />}>
        <Link to="/theory/new">
          <Button size="sm" icon={<Plus size={14} />}>Nova Entrada</Button>
        </Link>
      </PageHeader>

      {currentLoading ? (
        <div className="mb-8"><CardSkeleton /></div>
      ) : currentEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 rounded-xl border border-apple-accent/20 bg-apple-accent/[0.03]"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-apple-accent" />
            <h3 className="text-base font-semibold text-apple-text">Estudando Agora</h3>
            <span className="text-xs text-apple-text-secondary ml-auto">{currentEntries.length} {currentEntries.length === 1 ? 'entrada' : 'entradas'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/theory/${entry.id}`)}
                className="card-hover p-4 cursor-pointer border-apple-accent/20"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(entry.id) }}
                    className="shrink-0 mt-0.5 text-apple-text-secondary hover:text-apple-accent transition-colors"
                  >
                    {entry.completed ? <CheckCircle2 size={18} className="text-apple-accent" /> : <Circle size={18} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge bg-apple-accent/10 text-apple-accent">Estudando</span>
                      <span className="text-xs text-apple-text-secondary">{entry.subject?.name}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-apple-text mt-1 line-clamp-1">{entry.title}</h4>
                    <p className="text-xs text-apple-text-secondary mt-1 line-clamp-2">{stripMarkdown(entry.content).substring(0, 120)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); currentMutation.mutate(entry.id) }}
                    className="shrink-0 p-1.5 text-apple-accent hover:text-apple-text-secondary transition-colors"
                    title="Parar de estudar"
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-text-secondary" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar na teoria..."
            className="w-full pl-9 pr-3 py-2 input"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => { setSubjectFilter(e.target.value); setPage(1) }}
          className="input px-3 py-2 w-full sm:w-auto"
        >
          <option value="">Todas matérias</option>
          {subjects?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState icon={BookText} title="Nenhuma entrada teórica" description="Comece adicionando material de estudo." action={<Link to="/theory/new"><Button icon={<Plus size={14} />}>Nova Entrada</Button></Link>} />
      ) : (
        <motion.div className="space-y-8" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
          {Object.entries(grouped).map(([subjectName, items]) => (
            <motion.div key={subjectName} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-apple-border">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: items[0]?.subject?.color || '#6366f1' }} />
                <h3 className="text-base font-semibold text-apple-text">{subjectName}</h3>
                <span className="text-xs text-apple-text-secondary">{items.length} {items.length === 1 ? 'entrada' : 'entradas'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((entry) => (
                  <div
                    key={entry.id}
                    className={`card-hover p-4 cursor-pointer ${entry.completed ? 'opacity-70' : ''} ${entry.current ? 'ring-2 ring-apple-accent/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(entry.id) }}
                        className="shrink-0 mt-0.5 text-apple-text-secondary hover:text-apple-accent transition-colors"
                      >
                        {entry.completed ? <CheckCircle2 size={18} className="text-apple-accent" /> : <Circle size={18} />}
                      </button>
                      <div className="min-w-0 flex-1" onClick={() => navigate(`/theory/${entry.id}`)}>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold line-clamp-1 ${entry.completed ? 'text-apple-text-secondary line-through' : 'text-apple-text'}`}>{entry.title}</h4>
                          {entry.current && (
                            <span className="badge bg-apple-accent/10 text-apple-accent shrink-0">Estudando</span>
                          )}
                        </div>
                        <p className="text-xs text-apple-text-secondary mt-0.5">{entry.topic}</p>
                        <p className="text-xs text-apple-text-secondary mt-2 line-clamp-2">{stripMarkdown(entry.content).substring(0, 120)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-apple-text-secondary">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</span>
                          {entry.source && <span className="text-xs text-apple-text-secondary">· {entry.source}</span>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); currentMutation.mutate(entry.id) }}
                        className={`shrink-0 p-1.5 transition-colors ${entry.current ? 'text-apple-accent hover:text-apple-text-secondary' : 'text-apple-text-secondary hover:text-apple-accent'}`}
                        title={entry.current ? 'Parar de estudar' : 'Estudando agora'}
                      >
                        <Play size={14} fill={entry.current ? 'currentColor' : 'none'} />
                      </button>
                      {entry.notebooklm_url && (
                        <a href={entry.notebooklm_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 p-1.5 text-apple-text-secondary hover:text-purple-600 transition-colors" title="Abrir no NotebookLM">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  )
}
