import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchExams, createExam, updateExam, deleteExam } from '../api/client'
import { Timer, Plus, ExternalLink, Pencil, Trash2, X, Check, CalendarDays } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { PageSkeleton } from '../components/Skeleton'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'

export default function Exams() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', date: '', description: '', url: '' })

  const { data: exams, isLoading } = useQuery({ queryKey: ['exams'], queryFn: fetchExams })

  const createMut = useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setShowForm(false)
      setForm({ title: '', date: '', description: '', url: '' })
      toast('success', 'Prova adicionada!')
    },
    onError: () => toast('error', 'Erro ao criar prova'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<{ title: string; date: string; description: string; url: string }> }) =>
      updateExam(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      setEditingId(null)
      setForm({ title: '', date: '', description: '', url: '' })
      toast('success', 'Prova atualizada!')
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast('success', 'Prova excluída!')
    },
  })

  const handleEdit = (exam: { id: number; title: string; date: string; description: string; url: string }) => {
    setEditingId(exam.id)
    setForm({ title: exam.title, date: exam.date, description: exam.description, url: exam.url })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ title: '', date: '', description: '', url: '' })
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.date) { toast('error', 'Preencha título e data'); return }
    if (editingId) { updateMut.mutate({ id: editingId, input: form }) }
    else { createMut.mutate(form) }
  }

  if (isLoading) return <PageSkeleton />

  const getUrgency = (days: number) => {
    if (days < 0) return { label: 'Passada', cssColor: 'var(--lumi-text3)', barColor: 'var(--lumi-border)', ring: '' }
    if (days === 0) return { label: 'É hoje!', cssColor: 'var(--lumi-danger)', barColor: 'var(--lumi-danger)', ring: 'ring-2 ring-lumi-danger/20' }
    if (days <= 7) return { label: `${days} dia${days > 1 ? 's' : ''}`, cssColor: 'var(--lumi-danger)', barColor: 'var(--lumi-danger)', ring: '' }
    if (days <= 30) return { label: `${days} dias`, cssColor: 'var(--lumi-warning)', barColor: 'var(--lumi-warning)', ring: '' }
    return { label: `${days} dias`, cssColor: 'var(--lumi-text2)', barColor: 'color-mix(in srgb, var(--lumi-accent) 40%, transparent)', ring: '' }
  }

  return (
    <div>
      <PageHeader title="Datas de Provas" description="Acompanhe os prazos dos seus concursos" icon={<Timer size={20} className="text-apple-accent" />}>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', date: '', description: '', url: '' }) }} icon={<Plus size={14} />}>
          Nova Prova
        </Button>
      </PageHeader>

      {(showForm) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-apple-text mb-4">{editingId ? 'Editar Prova' : 'Nova Prova'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Título</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="Ex: Concurso Dataprev 2026" />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Descrição</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" placeholder="Opcional" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Link do Edital</label>
              <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} className="input" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} icon={<Check size={14} />}>{editingId ? 'Atualizar' : 'Criar'}</Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} icon={<X size={14} />}>Cancelar</Button>
          </div>
        </motion.div>
      )}

      {(!exams || exams.length === 0) && !showForm ? (
        <EmptyState icon={Timer} title="Nenhuma prova cadastrada" description="Adicione as datas dos seus concursos para acompanhar a contagem regressiva." action={<Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', date: '', description: '', url: '' }) }} icon={<Plus size={14} />}>Nova Prova</Button>} />
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
          {exams?.map((exam) => {
            const urgency = getUrgency(exam.days_remaining)
            return (
              <motion.div key={exam.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className={`card-hover p-5 relative overflow-hidden ${urgency.ring}`}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: urgency.barColor }} />
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--lumi-text)' }}>{exam.title}</h3>
                  <div className="flex gap-0.5">
                    <button onClick={() => handleEdit(exam)} className="btn-icon"><Pencil size={13} /></button>
                    <button onClick={async () => { const ok = await confirm({ title: 'Excluir prova', message: `Excluir "${exam.title}"? Esta ação não pode ser desfeita.`, variant: 'danger' }); if (ok) deleteMut.mutate(exam.id) }} className="btn-icon" style={{ color: 'var(--lumi-text3)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--lumi-danger)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--lumi-text3)' }}><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--lumi-text3)' }}>
                  <CalendarDays size={12} />
                  {format(parseISO(exam.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>

                <p className="text-2xl font-bold mb-2 tabular-nums" style={{ color: urgency.cssColor, letterSpacing: '-0.02em' }}>
                  {exam.days_remaining < 0
                    ? `Há ${Math.abs(exam.days_remaining)} dias`
                    : exam.days_remaining === 0
                      ? 'É hoje!'
                      : `Faltam ${exam.days_remaining} dias`}
                </p>

                {exam.description && (
                  <p className="text-xs mb-2" style={{ color: 'var(--lumi-text3)' }}>{exam.description}</p>
                )}

                {exam.url && (
                  <a href={exam.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-2 text-[12px] font-medium transition-colors" style={{ color: 'var(--lumi-accent)' }}>
                    <ExternalLink size={12} /> Edital
                  </a>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
