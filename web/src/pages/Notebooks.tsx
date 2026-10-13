import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Trash2, BookOpen, Edit3, X, Check, Notebook as NotebookIcon } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { ListSkeleton } from '../components/Skeleton'
import { fetchNotebooks, createNotebook, updateNotebook, deleteNotebook } from '../api/client'
import { useConfirm } from '../contexts/ConfirmContext'
import { useToast } from '../contexts/ToastContext'

const CARD_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function Notebooks() {
  const queryClient = useQueryClient()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: notebooks, isLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
  })

  const createMutation = useMutation({
    mutationFn: () => createNotebook(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      setName('')
      setDescription('')
      toast('success', 'Caderno criado')
    },
    onError: () => toast('error', 'Erro ao criar caderno'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      toast('success', 'Caderno excluído')
    },
    onError: () => toast('error', 'Erro ao excluir caderno'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) => updateNotebook(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notebooks'] }),
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const [showForm, setShowForm] = useState(false)

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateMutation.mutate({ id: editingId, data: { name: editName, description: editDesc } })
      setEditingId(null)
    }
  }

  const getCardColor = (index: number) => CARD_COLORS[index % CARD_COLORS.length]

  if (isLoading) return <ListSkeleton />

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Cadernos" description="Agrupe questões por prova ou assunto" icon={<NotebookIcon size={20} className="text-apple-accent" />}>
        <Button size="sm" onClick={() => setShowForm(!showForm)} icon={<Plus size={14} />}>Novo Caderno</Button>
      </PageHeader>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-apple-text mb-3">Novo Caderno</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Última prova DATAPREV" required className="input" />
            </div>
            <div>
              <label className="label">Descrição</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex: Prova aplicada em 2024" className="input" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending} loading={createMutation.isPending} size="sm">Criar</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </motion.div>
      )}

      {(!notebooks || notebooks.length === 0) ? (
        <EmptyState icon={NotebookIcon} title="Nenhum caderno" description="Crie cadernos para agrupar questões de provas específicas." action={<Button onClick={() => setShowForm(true)} icon={<Plus size={14} />}>Criar Primeiro Caderno</Button>} />
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          {notebooks.map((nb, i) => {
            const color = getCardColor(i)
            return (
              <motion.div key={nb.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                <div className={`card-hover p-4 relative overflow-hidden ${editingId === nb.id ? 'ring-2 ring-apple-accent/30' : ''}`}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />

                  {editingId === nb.id ? (
                    <div className="space-y-3 mt-1">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} />
                      <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="input" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} icon={<Check size={14} />}>Salvar</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} icon={<X size={14} />}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4 mt-1">
                        <Link to={`/notebooks/${nb.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                              <BookOpen size={16} style={{ color }} />
                            </div>
                            <h3 className="text-sm font-semibold text-apple-text truncate">{nb.name}</h3>
                          </div>
                          {nb.description && <p className="text-xs text-apple-text-secondary mt-2">{nb.description}</p>}
                          <p className="text-xs text-apple-text-secondary mt-2 font-medium">
                            {nb.question_count != null ? `${nb.question_count} ${nb.question_count === 1 ? 'questão' : 'questões'}` : '0 questões'}
                          </p>
                        </Link>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => { setEditingId(nb.id); setEditName(nb.name); setEditDesc(nb.description || '') }} className="btn-icon hover:text-apple-accent">
                            <Edit3 size={15} />
                          </button>
                          <Link to={`/notebooks/${nb.id}`} className="btn-icon hover:text-apple-accent">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const ok = await confirm({ title: 'Excluir caderno', message: `Excluir "${nb.name}"?`, variant: 'danger' })
                              if (ok) deleteMutation.mutate(nb.id)
                            }}
                            loading={deleteMutation.isPending}
                            className="hover:text-apple-danger"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
