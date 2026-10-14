import { useQuery } from '@tanstack/react-query'
import {
  Flame, BookOpen, PlusCircle, BarChart3, ChevronRight,
  Target, Brain, Zap, TrendingUp, CheckCircle2, Timer,
  ArrowRight, Sparkles, Layers,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchStats, fetchDetailedStats, fetchExams } from '../api/client'
import StatsCard from '../components/StatsCard'
import { PageSkeleton } from '../components/Skeleton'
import { Link } from 'react-router-dom'
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTheme } from '../contexts/ThemeContext'

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function Dashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  })

  const { data: detailed } = useQuery({
    queryKey: ['detailed-stats'],
    queryFn: fetchDetailedStats,
  })

  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams,
  })

  if (isLoading) return <PageSkeleton />

  /* ── Chart colors ── */
  const gridStroke = isDark ? '#27272A' : '#E5E7EB'

  /* ── Data preparation ── */
  const dailyChart = (detailed?.daily || []).slice(-14).map((d) => ({
    date: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
    revisoes: d.total,
  }))

  const totalPeriodReviews = dailyChart.reduce((acc, curr) => acc + curr.revisoes, 0)
  const activeDaysCount = dailyChart.filter((d) => d.revisoes > 0).length
  const maxDayPeak = Math.max(...dailyChart.map((d) => d.revisoes), 0)
  const avgDailyReviews = dailyChart.length > 0 ? (totalPeriodReviews / dailyChart.length).toFixed(1) : '0'

  const weakTopics = (detailed?.by_topic || [])
    .filter((t) => t.total_reviews >= 1)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4)

  const subjectAccuracy = (detailed?.by_subject || [])
    .sort((a, b) => b.total_reviews - a.total_reviews)
    .slice(0, 6)

  const nextExam = exams
    ?.filter((e) => e.days_remaining >= 0)
    .sort((a, b) => a.days_remaining - b.days_remaining)[0]

  /* ── Stats ── */
  const todayPending   = stats?.pending_reviews  ?? 0
  const pendingQuestions  = stats?.pending_questions  ?? 0
  const pendingFlashcards = stats?.pending_flashcards ?? 0
  const todayDone      = stats?.today_reviews    ?? 0
  const totalQuestions = stats?.total_questions  ?? 0
  const totalReviews   = stats?.total_reviews    ?? 0
  const accuracy       = stats?.accuracy         ?? 0
  const todayAccuracy  = stats?.today_accuracy   ?? 0
  const streak         = detailed?.streak?.current ?? 0

  const dailyProgress = (todayDone + todayPending) > 0
    ? Math.min(100, Math.round((todayDone / (todayDone + todayPending)) * 100))
    : 0

  /* ── Stat cards config with semantic colors ── */
  const statCards = [
    {
      title:  'Total de Questões',
      value:  totalQuestions,
      icon:   <Brain size={17} />,
      color:  '#4F46E5',
    },
    {
      title:  'Revisões Hoje',
      value:  todayDone,
      icon:   <BookOpen size={17} />,
      color:  '#0EA5E9',
    },
    {
      title:  'Taxa de Acerto',
      value:  `${accuracy.toFixed(1)}%`,
      icon:   <Target size={17} />,
      color:  '#059669',
    },
    {
      title:  'Acerto Hoje',
      value:  `${todayAccuracy.toFixed(1)}%`,
      icon:   <Zap size={17} />,
      color:  '#D97706',
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Hero section ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em' }}>
            {streak > 0 ? `${streak} dias seguidos 🔥` : 'Bom estudo!'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--lumi-text2)' }}>
            {(pendingQuestions > 0 || pendingFlashcards > 0)
              ? [
                  pendingQuestions > 0
                    ? `${pendingQuestions} ${pendingQuestions === 1 ? 'questão pendente' : 'questões pendentes'}`
                    : null,
                  pendingFlashcards > 0
                    ? `${pendingFlashcards} ${pendingFlashcards === 1 ? 'flashcard pendente' : 'flashcards pendentes'}`
                    : null,
                ].filter(Boolean).join(' + ') + ' para hoje'
              : todayDone > 0
              ? 'Você completou todas as revisões de hoje!'
              : 'Comece adicionando questões ao seu banco.'}
          </p>
        </div>

        {/* CTA: review pending — escolha entre questões e flashcards */}
        {(pendingQuestions > 0 || pendingFlashcards > 0) && (
          <div className="flex flex-wrap gap-2 shrink-0 self-start">
            {pendingQuestions > 0 && (
              <Link
                to="/review"
                className="btn btn-primary"
              >
                <BookOpen size={14} />
                Revisar {pendingQuestions} {pendingQuestions === 1 ? 'questão' : 'questões'}
                <ArrowRight size={14} />
              </Link>
            )}
            {pendingFlashcards > 0 && (
              <Link
                to="/review/flashcards"
                className="btn btn-secondary"
              >
                <Layers size={14} />
                Flashcards ({pendingFlashcards})
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}

        {/* CTA: add first question */}
        {totalQuestions === 0 && (
          <Link
            to="/questions/new"
            className="btn btn-primary shrink-0 self-start"
          >
            <PlusCircle size={14} />
            Adicionar questão
          </Link>
        )}

        {/* Exam countdown */}
        {nextExam && nextExam.days_remaining <= 60 && (
          <Link
            to="/exams"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border card shrink-0 hover:border-lumi-border2 transition-colors"
          >
            <Timer size={14} style={{ color: 'var(--lumi-text3)' }} />
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--lumi-text3)' }}>Próxima prova</p>
              <p className="text-sm font-semibold tabular-nums" style={{ color: nextExam.days_remaining <= 7 ? 'var(--lumi-danger)' : 'var(--lumi-text)' }}>
                {nextExam.days_remaining === 0 ? 'Hoje!' : `em ${nextExam.days_remaining}d`}
              </p>
            </div>
          </Link>
        )}
      </motion.div>

      {/* ── Stats cards ── */}
      <motion.div
        className="grid-stats"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {statCards.map((card, i) => (
          <motion.div key={i} variants={fadeUp}>
            <StatsCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Activity chart — 3/5 */}
        <motion.div
          className="lg:col-span-3 card overflow-hidden flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {/* Header with Title and Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 pt-5 pb-2 gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: 'var(--lumi-accent)' }} />
              <h2 className="section-title text-base font-semibold">Atividade — 14 dias</h2>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: 'var(--lumi-surface2)',
                  color: 'var(--lumi-text2)',
                  border: '1px solid var(--lumi-border)',
                }}
              >
                Total: <strong style={{ color: 'var(--lumi-text)' }}>{totalPeriodReviews}</strong>
              </span>
              <Link
                to="/stats"
                className="flex items-center gap-0.5 text-[12px] font-medium transition-colors ml-1"
                style={{ color: 'var(--lumi-text3)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--lumi-accent)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--lumi-text3)' }}
              >
                Ver tudo <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="px-2 pb-3 pt-2 flex-1 min-h-[190px]">
            {dailyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChart} margin={{ top: 12, right: 16, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--lumi-accent)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--lumi-accent)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--lumi-text3)', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--lumi-text3)', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value
                        return (
                          <div
                            className="px-3 py-2 rounded-xl shadow-lg text-xs border"
                            style={{
                              backgroundColor: 'var(--lumi-surface)',
                              borderColor: 'var(--lumi-border)',
                              color: 'var(--lumi-text)',
                            }}
                          >
                            <p className="text-[11px] font-medium" style={{ color: 'var(--lumi-text3)' }}>
                              Dia {label}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 font-semibold">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: 'var(--lumi-accent)' }}
                              />
                              <span>{val} {val === 1 ? 'revisão' : 'revisões'}</span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                    cursor={{ stroke: 'var(--lumi-accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revisoes"
                    stroke="var(--lumi-accent)"
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--lumi-accent)', strokeWidth: 2.5, stroke: 'var(--lumi-surface)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[190px] gap-2">
                <TrendingUp size={20} style={{ color: 'var(--lumi-text3)' }} />
                <p className="text-sm" style={{ color: 'var(--lumi-text3)' }}>Nenhuma atividade ainda</p>
              </div>
            )}
          </div>

          {/* Micro-Stats Footer */}
          {dailyChart.length > 0 && (
            <div
              className="px-5 py-3 border-t grid grid-cols-3 gap-2 text-center"
              style={{ borderColor: 'var(--lumi-border)', backgroundColor: 'var(--lumi-surface2)' }}
            >
              <div>
                <p className="text-[11px] font-medium" style={{ color: 'var(--lumi-text3)' }}>Total de Revisões</p>
                <p className="text-sm font-semibold mt-0.5 tabular-nums" style={{ color: 'var(--lumi-text)' }}>
                  {totalPeriodReviews}
                </p>
              </div>
              <div className="border-x" style={{ borderColor: 'var(--lumi-border)' }}>
                <p className="text-[11px] font-medium" style={{ color: 'var(--lumi-text3)' }}>Dias Ativos</p>
                <p className="text-sm font-semibold mt-0.5 tabular-nums" style={{ color: 'var(--lumi-text)' }}>
                  {activeDaysCount} <span className="text-[11px] font-normal text-lumi-text3">/ 14d</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium" style={{ color: 'var(--lumi-text3)' }}>Maior Pico</p>
                <p className="text-sm font-semibold mt-0.5 tabular-nums" style={{ color: 'var(--lumi-accent)' }}>
                  {maxDayPeak} <span className="text-[11px] font-normal text-lumi-text3">rev.</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right column — 2/5 */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Today's progress */}
          <motion.div
            className="card p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target size={14} style={{ color: 'var(--lumi-accent)' }} />
              <h2 className="section-title">Hoje</h2>
            </div>

            {/* Always show this block — even when empty */}
            {(todayDone > 0 || todayPending > 0) ? (
              <>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'var(--lumi-text3)' }}>
                    <span>Progresso</span>
                    <span className="font-medium tabular-nums">{todayDone} / {todayDone + todayPending}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${dailyProgress}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="stat-value">{todayDone}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--lumi-text3)' }}>revisadas</p>
                  </div>
                  {todayPending > 0 && (
                    <div>
                      <p className="stat-value" style={{ color: 'var(--lumi-warning)' }}>{todayPending}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--lumi-text3)' }}>pendentes</p>
                    </div>
                  )}
                  <div>
                    <p className="stat-value">{todayAccuracy.toFixed(0)}%</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--lumi-text3)' }}>acerto</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <Sparkles size={20} style={{ color: 'var(--lumi-text3)' }} className="mb-2" />
                <p className="text-sm font-medium" style={{ color: 'var(--lumi-text2)' }}>Nenhuma revisão hoje</p>
                <p className="text-[11px] mt-0.5 mb-3" style={{ color: 'var(--lumi-text3)' }}>Adicione questões para começar</p>
                <Link to="/questions/new" className="btn btn-secondary btn-sm">
                  <PlusCircle size={12} /> Adicionar
                </Link>
              </div>
            )}

            {/* Weak topics */}
            {weakTopics.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--lumi-border)' }}>
                <p className="section-label mb-2.5">Precisa de atenção</p>
                <div className="space-y-2.5">
                  {weakTopics.map((t) => (
                    <div key={t.topic}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] truncate mr-2" style={{ color: 'var(--lumi-text2)' }}>{t.topic}</span>
                        <span
                          className="text-[11px] font-semibold tabular-nums shrink-0"
                          style={{ color: t.accuracy < 50 ? 'var(--lumi-danger)' : t.accuracy < 70 ? 'var(--lumi-warning)' : 'var(--lumi-text2)' }}
                        >
                          {t.accuracy.toFixed(0)}%
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: '4px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, t.accuracy)}%`,
                            backgroundColor: t.accuracy < 50
                              ? 'var(--lumi-danger)'
                              : t.accuracy < 70
                              ? 'var(--lumi-warning)'
                              : 'var(--lumi-success)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Summary mini-stats */}
          <motion.div
            className="card p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          >
            <div className="grid grid-cols-3 divide-x" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {[
                { label: 'Total',    value: totalReviews.toLocaleString('pt-BR'),      icon: BarChart3 },
                { label: 'Streak',   value: `${streak}d`,                               icon: Flame },
                { label: 'Matérias', value: String(detailed?.by_subject?.length ?? 0),  icon: BookOpen },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center justify-center py-2 px-2">
                  <Icon size={13} style={{ color: 'var(--lumi-text3)' }} className="mb-1.5" />
                  <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--lumi-text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</p>
                  <p className="text-[10px] font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--lumi-text3)' }}>{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Subject performance ── */}
      {subjectAccuracy.length > 0 && (
        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} style={{ color: 'var(--lumi-accent)' }} />
              <h2 className="section-title">Desempenho por Matéria</h2>
            </div>
            <Link
              to="/stats"
              className="flex items-center gap-0.5 text-[12px] font-medium transition-colors"
              style={{ color: 'var(--lumi-text3)' }}
            >
              Detalhes <ChevronRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {subjectAccuracy.map((s) => (
              <div key={s.subject_id} className="flex items-center gap-4">
                {/* Color dot */}
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || 'var(--lumi-accent)' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--lumi-text)' }}>{s.subject_name}</p>
                    <p
                      className="text-[12px] font-semibold tabular-nums ml-3 shrink-0"
                      style={{ color: s.accuracy >= 70 ? 'var(--lumi-success)' : s.accuracy >= 50 ? 'var(--lumi-warning)' : 'var(--lumi-danger)' }}
                    >
                      {s.accuracy.toFixed(0)}%
                    </p>
                  </div>
                  <div className="progress-bar" style={{ height: '5px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, s.accuracy)}%`,
                        backgroundColor: s.color || 'var(--lumi-accent)',
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--lumi-text3)' }}>
                    {s.total} {s.total === 1 ? 'questão' : 'questões'} · {s.total_reviews} revisões
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Empty state — no questions at all ── */}
      {totalQuestions === 0 && (
        <motion.div
          className="card p-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.2 }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-accent) 10%, transparent)' }}>
            <Brain size={24} style={{ color: 'var(--lumi-accent)' }} />
          </div>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--lumi-text)' }}>
            Comece seu banco de questões
          </h2>
          <p className="text-[13px] mb-5 max-w-sm mx-auto" style={{ color: 'var(--lumi-text2)' }}>
            Adicione questões de concursos, ENEM ou qualquer área que esteja estudando. O sistema vai espaçar as revisões automaticamente.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/questions/new" className="btn btn-primary">
              <PlusCircle size={14} /> Criar questão
            </Link>
            <Link to="/questions/import" className="btn btn-secondary">
              Importar questões
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
