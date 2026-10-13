import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Trash2, Star, Upload, SlidersHorizontal, X, ExternalLink } from 'lucide-react'
import { ListSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { fetchQuestions, fetchSubjects, fetchNotebooks, deleteQuestion, toggleFavorite } from '../api/client'
import { useConfirm } from '../contexts/ConfirmContext'
import { useToast } from '../contexts/ToastContext'
import { List } from 'lucide-react'

export default function QuestionList() {
  const queryClient = useQueryClient()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState('')
  const [notebookFilter, setNotebookFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: notebooks } = useQuery({ queryKey: ['notebooks'], queryFn: fetchNotebooks })
  const { data, isLoading } = useQuery({
    queryKey: ['questions', search, subjectFilter, sourceFilter, tagFilter, favoriteFilter, notebookFilter, page],
    queryFn: () => fetchQuestions({
      search,
      subject_id: subjectFilter,
      source: sourceFilter,
      tag: tagFilter,
      favorite: favoriteFilter,
      notebook_id: notebookFilter,
      page,
      limit: 15,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast('success', 'Questão excluída')
    },
    onError: () => toast('error', 'Erro ao excluir questão'),
  })

  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const clearFilters = () => {
    setSearch('')
    setSubjectFilter('')
    setSourceFilter('')
    setTagFilter('')
    setFavoriteFilter('')
    setNotebookFilter('')
    setPage(1)
  }

  const hasFilters = search || subjectFilter || sourceFilter || tagFilter || favoriteFilter || notebookFilter
  const activeFilterCount = [subjectFilter, sourceFilter, tagFilter, favoriteFilter, notebookFilter].filter(Boolean).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Questões"
        description={data ? `${data.total} questão${data.total !== 1 ? 'ões' : ''} encontrada${data.total !== 1 ? 's' : ''}` : undefined}
        icon={<List size={18} />}
      >
        <Link to="/questions/import">
          <Button variant="secondary" size="sm" icon={<Upload size={13} />}>Importar</Button>
        </Link>
        <Link to="/questions/new">
          <Button size="sm">+ Nova</Button>
        </Link>
      </PageHeader>

      {/* ── Search bar — always visible ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--lumi-text3)' }}
          />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar questões por texto, tópico ou fonte..."
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

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn btn-secondary btn-sm shrink-0 relative ${showFilters ? 'border-lumi-accent' : ''}`}
          style={showFilters ? { borderColor: 'var(--lumi-accent)', color: 'var(--lumi-accent)' } : undefined}
        >
          <SlidersHorizontal size={13} />
          Filtros
          {activeFilterCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--lumi-accent)' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel — collapsible ── */}
      <motion.div
        animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
        initial={false}
        transition={{ duration: 0.15 }}
        className="overflow-hidden"
      >
        <div
          className="card p-4 flex flex-wrap gap-2.5"
          style={{ marginTop: showFilters ? 0 : -8 }}
        >
          <select
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setPage(1) }}
            className="input"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">Todas as matérias</option>
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <input
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
            placeholder="Fonte / banca"
            className="input"
            style={{ width: '140px' }}
          />

          <input
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1) }}
            placeholder="Tag"
            className="input"
            style={{ width: '110px' }}
          />

          <select
            value={favoriteFilter}
            onChange={(e) => { setFavoriteFilter(e.target.value); setPage(1) }}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="">Todas</option>
            <option value="true">Favoritas ★</option>
          </select>

          <select
            value={notebookFilter}
            onChange={(e) => { setNotebookFilter(e.target.value); setPage(1) }}
            className="input"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">Todos os cadernos</option>
            {notebooks?.map((nb) => (
              <option key={nb.id} value={nb.id}>{nb.name}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 rounded-lg text-[12px] font-medium transition-colors"
              style={{ color: 'var(--lumi-danger)', backgroundColor: 'var(--lumi-danger-bg)' }}
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Results ── */}
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <>
          {data?.data.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhuma questão encontrada"
              description={
                hasFilters
                  ? 'Tente remover algum filtro ou ajustar a busca.'
                  : 'Comece adicionando sua primeira questão ao banco.'
              }
              action={
                !hasFilters ? (
                  <Link to="/questions/new">
                    <Button>Criar primeira questão</Button>
                  </Link>
                ) : (
                  <Button variant="secondary" onClick={clearFilters}>
                    <X size={13} /> Limpar filtros
                  </Button>
                )
              }
            />
          ) : (
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
            >
              {data?.data.map((q) => (
                <motion.div
                  key={q.id}
                  variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                  className="card-hover group px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/questions/${q.id}`} className="flex-1 min-w-0">
                      {/* Question text */}
                      <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--lumi-text)' }}>
                        {q.text}
                      </p>

                      {/* Metadata chips */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {q.subject && (
                          <span
                            className="badge-subject"
                            style={{
                              backgroundColor: q.subject.color ? `${q.subject.color}18` : 'color-mix(in srgb, var(--lumi-accent) 12%, transparent)',
                              color: q.subject.color || 'var(--lumi-accent)',
                            }}
                          >
                            {q.subject.name}
                          </span>
                        )}
                        {q.topic && (
                          <span className="text-[11px]" style={{ color: 'var(--lumi-text3)' }}>
                            {q.topic}
                          </span>
                        )}
                        {q.source && (
                          <span className="badge badge-default">{q.source}</span>
                        )}
                        {q.question_type === 'certo_errado' && (
                          <span className="badge badge-accent">C/E</span>
                        )}
                        {(q as any).notebooks?.map((nb: any) => (
                          <span key={nb.id} className="badge" style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 8%, transparent)', color: 'var(--lumi-text2)' }}>
                            {nb.name}
                          </span>
                        ))}
                      </div>
                    </Link>

                    {/* Row actions — always visible on touch, hover-reveal on desktop */}
                    <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={(e) => { e.preventDefault(); favoriteMutation.mutate(q.id) }}
                        className="btn-icon"
                        style={{ color: q.favorite ? 'var(--lumi-warning)' : undefined }}
                        title={q.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Star size={14} fill={q.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <Link to={`/questions/${q.id}`} className="btn-icon" title="Abrir questão">
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        onClick={async () => {
                          const ok = await confirm({ title: 'Excluir questão', message: 'Tem certeza? Essa ação não pode ser desfeita.', variant: 'danger' })
                          if (ok) deleteMutation.mutate(q.id)
                        }}
                        className="btn-icon"
                        style={{ color: 'var(--lumi-text3)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--lumi-danger)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--lumi-text3)' }}
                        title="Excluir questão"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
