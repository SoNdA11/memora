import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchEditalGraph, seedEdital } from '../api/client'
import KnowledgeGraph from '../components/KnowledgeGraph'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { PageSkeleton } from '../components/Skeleton'
import { useToast } from '../contexts/ToastContext'
import { Map, RefreshCw } from 'lucide-react'

export default function KnowledgeMap() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['edital-graph'],
    queryFn: fetchEditalGraph,
    refetchOnMount: true,
  })

  const seedMutation = useMutation({
    mutationFn: seedEdital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edital-graph'] })
      toast('success', 'Edital importado com sucesso')
    },
    onError: () => toast('error', 'Erro ao importar edital'),
  })

  if (isLoading) return <PageSkeleton />

  const hasData = data && data.nodes.length > 0

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Mapa de Conhecimento" description={hasData ? `${data.nodes.length} nós · ${data.edges.length} conexões` : 'Visualize a estrutura do edital'} icon={<Map size={20} className="text-purple-500" />}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          loading={seedMutation.isPending}
          icon={<RefreshCw size={14} />}
        >
          {seedMutation.isPending ? 'Importando...' : 'Importar Edital'}
        </Button>
      </PageHeader>

      {hasData ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              { label: 'Módulo', color: '#8b5cf6' },
              { label: 'Matéria', color: '#3b82f6' },
              { label: 'Tópico', color: '#10b981' },
              { label: 'Teoria', color: '#f59e0b' },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          <div className="card p-5">
            <KnowledgeGraph nodes={data.nodes} edges={data.edges} />
          </div>
          <p className="text-xs text-apple-text-secondary text-center">
            Passe o mouse sobre os nós para explorar. Clique em um nó de teoria (amarelo) para abri-la.
          </p>
        </motion.div>
      ) : (
        <EmptyState icon={Map} title="Nenhum dado importado" description="Clique em 'Importar Edital' para gerar o mapa de conhecimento." />
      )}
    </div>
  )
}
