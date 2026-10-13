import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchSubjects, bulkImport } from '../api/client'
import { Upload, FileDown, Layers } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { useToast } from '../contexts/ToastContext'

export default function BulkImport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { toast } = useToast()

  const [jsonText, setJsonText] = useState('')
  const [result, setResult] = useState<{ message: string; total_criadas: number } | null>(null)

  const mutation = useMutation({
    mutationFn: () => { const items = JSON.parse(jsonText); return bulkImport(items) },
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast('success', data.message)
    },
    onError: () => toast('error', 'Erro ao importar'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    try { JSON.parse(jsonText) } catch { alert('JSON inválido! Verifique a formatação.'); return }
    mutation.mutate()
  }

  const exampleJSON = JSON.stringify([
    { subject_id: 1, topic: "Direito Constitucional", text: "É um direito fundamental previsto na CF/88:", question_type: "multipla_escolha", alternatives: [{ letter: "A", text: "Alternativa A" }, { letter: "B", text: "Alternativa B" }, { letter: "C", text: "Alternativa C (correta)" }, { letter: "D", text: "Alternativa D" }, { letter: "E", text: "Alternativa E" }], correct_answer: "C", explanation: "Explicação detalhada...", source: "CESPE", tags: ["direito", "constitucional"] }
  ], null, 2)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
      <PageHeader title="Importar Questões" description="Importe questões em massa via JSON" icon={<Layers size={20} className="text-apple-accent" />} />

      <div className="card p-5 mb-6">
        <p className="text-sm text-apple-text font-medium mb-1">Formato esperado</p>
        <p className="text-xs text-apple-text-secondary mb-3">Array de objetos JSON. Cada objeto deve conter: subject_id, topic, text, alternatives, correct_answer.</p>
        <details>
          <summary className="text-xs text-apple-accent cursor-pointer font-medium hover:text-apple-accent-hover">Ver exemplo</summary>
          <pre className="mt-2 text-xs text-apple-text bg-apple-text/[0.04] p-3 rounded-lg overflow-x-auto border border-apple-border">{exampleJSON}</pre>
        </details>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">JSON das questões</label>
          <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={12} placeholder='[{ "subject_id": 1, "topic": "...", ... }]' className="input resize-y font-mono" />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={!jsonText.trim()} loading={mutation.isPending} icon={<Upload size={16} />}>Importar</Button>
          <Button variant="secondary" onClick={() => navigate('/questions')}>Cancelar</Button>
        </div>

        {mutation.isError && <p className="text-sm text-apple-danger">Erro ao importar. Verifique o formato JSON.</p>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
            <p className="text-sm text-apple-text font-medium">{result.message}</p>
          </motion.div>
        )}
      </form>
    </motion.div>
  )
}
