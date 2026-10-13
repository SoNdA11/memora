import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchDetailedStats, fetchStats } from '../api/client'
import StatsCard from '../components/StatsCard'
import PageHeader from '../components/PageHeader'
import { PageSkeleton } from '../components/Skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { BarChart3, Brain, Target, Flame, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTheme } from '../contexts/ThemeContext'

const SUBJECT_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Stats() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: basicStats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats })
  const { data: detailed, isLoading } = useQuery({
    queryKey: ['stats-detailed'],
    queryFn: fetchDetailedStats,
  })

  if (isLoading) return <PageSkeleton />

  const dailyData = detailed?.daily?.map((d) => ({
    ...d,
    date: format(parseISO(d.date), 'dd/MM'),
  }))

  const subjectData = detailed?.by_subject?.map((s, i) => ({
    name: s.subject_name,
    Acertos: s.correct,
    Erros: s.total_reviews - s.correct,
    accuracy: s.accuracy,
    color: s.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }))

  const strokeColor = isDark ? '#98989d' : '#86868b'
  const gridColor = isDark ? '#38383a' : '#e5e5ea'
  const tooltipTextColor = isDark ? '#e6e6ea' : '#18181b'

  return (
    <div>
      <PageHeader title="Estatísticas" description="Acompanhe seu desempenho nos estudos" icon={<BarChart3 size={20} className="text-apple-accent" />} />

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {[
          { title: 'Total de Questões', value: basicStats?.total_questions ?? 0, icon: <Brain size={18} className="text-apple-accent" />, color: '#6366f1' },
          { title: 'Total de Revisões', value: basicStats?.total_reviews ?? 0, icon: <TrendingUp size={18} className="text-apple-accent" />, color: '#3b82f6' },
          { title: 'Taxa de Acerto', value: basicStats ? `${basicStats.accuracy.toFixed(1)}%` : '0%', icon: <Target size={18} className="text-apple-accent" />, color: '#10b981' },
          { title: 'Streak', value: `${detailed?.streak.current ?? 0} dias`, subtitle: `Maior: ${detailed?.streak.longest ?? 0} dias`, icon: <Flame size={18} className="text-apple-accent" />, color: '#f59e0b' },
        ].map((card, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
            <StatsCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-apple-text mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-apple-accent" />
            Atividade Diária (30 dias)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: strokeColor }} stroke={strokeColor} />
              <YAxis tick={{ fontSize: 11, fill: strokeColor }} stroke={strokeColor} />
              <Tooltip contentStyle={{ color: tooltipTextColor, backgroundColor: 'var(--apple-surface)', border: '1px solid var(--apple-border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="total" stroke="var(--apple-accent)" strokeWidth={2.5} dot={false} name="Questões" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-apple-text mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-apple-accent" />
            Acertos por Matéria
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjectData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" tick={{ fontSize: 11, fill: strokeColor }} stroke={strokeColor} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: strokeColor }} stroke={strokeColor} width={100} />
              <Tooltip contentStyle={{ color: tooltipTextColor, backgroundColor: 'var(--apple-surface)', border: '1px solid var(--apple-border)', borderRadius: 8 }} />
              <Bar dataKey="Acertos" stackId="a" fill="var(--apple-accent)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Erros" stackId="a" fill="var(--apple-border)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-apple-text mb-4 flex items-center gap-2">
            <Target size={14} className="text-apple-accent" />
            Taxa de Acerto por Matéria
          </h3>
          <div className="space-y-4">
            {detailed?.by_subject?.map((s, i) => (
              <div key={s.subject_id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                    <span className="text-apple-text truncate">{s.subject_name}</span>
                  </div>
                  <span className="text-apple-text-secondary font-medium tabular-nums">{s.accuracy.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${s.accuracy}%`, backgroundColor: s.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}
                  />
                </div>
                <p className="text-[10px] text-apple-text-secondary mt-0.5">{s.total} {s.total === 1 ? 'questão' : 'questões'} · {s.total_reviews} {s.total_reviews === 1 ? 'revisão' : 'revisões'}</p>
              </div>
            ))}
            {(!detailed?.by_subject || detailed.by_subject.length === 0) && (
              <p className="text-sm text-apple-text-secondary">Nenhum dado ainda.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-apple-text mb-4 flex items-center gap-2">
            <Brain size={14} className="text-apple-accent" />
            Tópicos
          </h3>
          <div className="space-y-4">
            {detailed?.by_topic?.slice(0, 10).map((t) => (
              <div key={t.topic}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-apple-text truncate">{t.topic}</span>
                  <span className="text-apple-text-secondary font-medium tabular-nums">{t.accuracy.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${t.accuracy}%` }} />
                </div>
                <p className="text-[10px] text-apple-text-secondary mt-0.5">{t.total} {t.total === 1 ? 'questão' : 'questões'}</p>
              </div>
            ))}
            {(!detailed?.by_topic || detailed.by_topic.length === 0) && (
              <p className="text-sm text-apple-text-secondary">Nenhum dado ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
