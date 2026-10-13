import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Languages, Search, X, Play, ListChecks, Database, ChevronLeft, ChevronRight, BookOpenCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import StatsCard from '../components/StatsCard'
import { PageSkeleton } from '../components/Skeleton'
import { fetchPhrasalVerbs, fetchPhrasalStats, seedPhrasalVerbs, fetchPhrasalDue } from '../api/client'
import { useToast } from '../contexts/ToastContext'

export default function PhrasalVerbs() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: stats } = useQuery({ queryKey: ['phrasal-stats'], queryFn: fetchPhrasalStats })
  const { data: due } = useQuery({ queryKey: ['phrasal-due'], queryFn: fetchPhrasalDue })

  const { data, isLoading } = useQuery({
    queryKey: ['phrasal-verbs', search, page],
    queryFn: () => fetchPhrasalVerbs({ search, page, limit: 40 }),
  })

  const seedMutation = useMutation({
    mutationFn: seedPhrasalVerbs,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['phrasal-verbs'] })
      queryClient.invalidateQueries({ queryKey: ['phrasal-stats'] })
      queryClient.invalidateQueries({ queryKey: ['phrasal-due'] })
      toast('success', res.message)
    },
    onError: () => toast('error', 'Erro ao carregar a lista de phrasal verbs'),
  })

  if (isLoading && !data) return <PageSkeleton />

  const total = stats?.total ?? 0
  const dueCount = due?.length ?? 0
  const mastered = stats?.mastered ?? 0
  const accuracy = stats?.accuracy ?? 0

  /* ── Empty state: lista ainda não carregada ── */
  if (!isLoading && total === 0) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Phrasal Verbs"
          description="Estude os 200 phrasal verbs mais usados em inglês"
          icon={<Languages size={18} />}
        />
        <EmptyState
          icon={Database}
          title="Lista ainda não carregada"
          description="Carregue os 200 phrasal verbs mais usados com suas traduções e exemplos. Os cards ficam disponíveis para revisão imediatamente."
          action={
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="btn btn-primary"
            >
              <Database size={14} />
              {seedMutation.isPending ? 'Carregando...' : 'Carregar lista de phrasal verbs'}
            </button>
          }
        />
      </div>
    )
  }

  const verbs = data?.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Phrasal Verbs"
        description={data ? `${data.total} phrasal verbs no deck` : undefined}
        icon={<Languages size={18} />}
      >
        <Link to="/phrasal-verbs/quiz" className={`btn btn-secondary btn-sm ${dueCount === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
          <ListChecks size={13} /> Quiz
        </Link>
        <Link to="/phrasal-verbs/study" className={`btn btn-primary btn-sm ${dueCount === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
          <Play size={13} /> Estudar hoje ({dueCount})
        </Link>
      </PageHeader>

      {/* ── Stats ── */}
      <div className="grid-stats">
        <StatsCard
          title="No deck"
          value={total}
          subtitle="200 phrasal verbs"
          icon={<Languages size={16} />}
          color="#4F46E5"
        />
        <StatsCard
          title="Pendentes hoje"
          value={dueCount}
          subtitle={dueCount > 0 ? 'prontos para revisar' : 'tudo em dia!'}
          icon={<Play size={16} />}
          color="#0EA5E9"
        />
        <StatsCard
          title="Dominados"
          value={mastered}
          subtitle="intervalo ≥ 21 dias"
          icon={<BookOpenCheck size={16} />}
          color="#059669"
        />
        <StatsCard
          title="Acurácia"
          value={`${accuracy.toFixed(1)}%`}
          subtitle={`${stats?.total_reviews ?? 0} revisões feitas`}
          icon={<ListChecks size={16} />}
          color="#D97706"
        />
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--lumi-text3)' }}
        />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar phrasal verb ou significado..."
          className="input pl-9"
          style={{ height: '38px' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
            style={{ color: 'var(--lumi-text3)' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── List ── */}
      {verbs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum resultado"
          description={`Nenhum phrasal verb encontrado para "${search}".`}
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.02 } }, hidden: {} }}
        >
          {verbs.map((pv, i) => (
            <motion.div
              key={pv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.4) }}
              className="card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.01em' }}>
                    {pv.verb}
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--lumi-accent)' }}>
                    {pv.meaning}
                  </p>
                  {pv.example && (
                    <p className="text-[12px] italic mt-2 leading-relaxed" style={{ color: 'var(--lumi-text2)' }}>
                      “{pv.example}”
                    </p>
                  )}
                  {pv.example_pt && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--lumi-text3)' }}>
                      {pv.example_pt}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-[12px] tabular-nums px-3" style={{ color: 'var(--lumi-text3)' }}>
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages}
            className="btn btn-secondary btn-sm"
          >
            Próximo <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
