import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '../api/client'
import { Trash2, Plus, Edit3, X, Check, FolderTree } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { ListSkeleton } from '../components/Skeleton'
import { useConfirm } from '../contexts/ConfirmContext'
import { useToast } from '../contexts/ToastContext'

const PRESET_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']

export default function Subjects() {
  const queryClient = useQueryClient()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  const createMutation = useMutation({
    mutationFn: () => createSubject(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setName('')
      setColor('#6366f1')
      toast('success', 'Matéria criada')
    },
    onError: () => toast('error', 'Erro ao criar matéria'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      toast('success', 'Matéria excluída')
    },
    onError: () => toast('error', 'Erro ao excluir matéria'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string } }) => updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      toast('success', 'Matéria atualizada')
    },
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const startEdit = (s: { id: number; name: string; color: string }) => {
    setEditingId(s.id)
    setEditName(s.name)
    setEditColor(s.color)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateMutation.mutate({ id: editingId, data: { name: editName, color: editColor } })
      setEditingId(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate()
  }

  if (isLoading) return <ListSkeleton count={4} />

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Matérias" description="Organize suas matérias de estudo" icon={<FolderTree size={20} className="text-apple-accent" />} />

      <form onSubmit={handleSubmit} className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-apple-text mb-3">Nova Matéria</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="label">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Direito Administrativo"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? 'border-apple-text scale-110 ring-2 ring-offset-2 ring-apple-accent/30' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" disabled={createMutation.isPending} loading={createMutation.isPending} icon={<Plus size={16} />}>
            Adicionar
          </Button>
        </div>
      </form>

      {(!subjects || subjects.length === 0) ? (
        <EmptyState icon={FolderTree} title="Nenhuma matéria" description="Crie sua primeira matéria para começar." />
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          {subjects.map((s) => (
            <motion.div
              key={s.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              className="card-hover p-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.color }} />
              {editingId === s.id ? (
                <div className="space-y-3 mt-1">
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          editColor === c ? 'border-apple-text scale-110 ring-2 ring-offset-1 ring-apple-accent/30' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input flex-1"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} icon={<Check size={14} />}>Salvar</Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit} icon={<X size={14} />}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: s.color }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-apple-text truncate">{s.name}</p>
                      <p className="text-xs text-apple-text-secondary">Criada em {new Date(s.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => startEdit(s)} className="btn-icon hover:text-apple-accent">
                      <Edit3 size={15} />
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const ok = await confirm({ title: 'Excluir matéria', message: `Excluir "${s.name}"? Esta ação irá remover todas as questões e teoria vinculadas.`, variant: 'danger' })
                        if (ok) deleteMutation.mutate(s.id)
                      }}
                      loading={deleteMutation.isPending}
                      className="hover:text-apple-danger"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
