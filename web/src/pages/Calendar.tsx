import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchCalendarReviews, fetchHeatmap } from '../api/client'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { PageSkeleton } from '../components/Skeleton'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const LEGEND_ITEMS = [
  { count: 0, label: '0 revisões' },
  { count: 1, label: '1 - 2 revisões' },
  { count: 4, label: '3 - 5 revisões' },
  { count: 8, label: '6 - 10 revisões' },
  { count: 12, label: '11+ revisões' },
]

function getHeatmapStyle(count: number): React.CSSProperties {
  if (count === 0) {
    return {
      backgroundColor: 'var(--lumi-surface2)',
      border: '1px solid var(--lumi-border)',
    }
  }
  if (count <= 2) {
    return {
      backgroundColor: 'rgba(79, 70, 229, 0.25)',
      border: '1px solid rgba(79, 70, 229, 0.35)',
    }
  }
  if (count <= 5) {
    return {
      backgroundColor: 'rgba(79, 70, 229, 0.50)',
      border: '1px solid rgba(79, 70, 229, 0.60)',
    }
  }
  if (count <= 10) {
    return {
      backgroundColor: 'rgba(79, 70, 229, 0.75)',
      border: '1px solid rgba(79, 70, 229, 0.85)',
    }
  }
  return {
    backgroundColor: 'var(--lumi-accent)',
    border: '1px solid var(--lumi-accent2)',
  }
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear())

  const { data: calendarDays, isLoading: loadingCal } = useQuery({
    queryKey: ['calendar-reviews', currentMonth.getFullYear(), currentMonth.getMonth() + 1],
    queryFn: () => fetchCalendarReviews(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
  })

  const { data: heatmapData, isLoading: loadingHeat } = useQuery({
    queryKey: ['heatmap', heatmapYear],
    queryFn: () => fetchHeatmap(heatmapYear),
  })

  const calendarMap = useMemo(() => {
    const map = new Map<string, number>()
    if (calendarDays) calendarDays.forEach((d) => map.set(d.date, d.count))
    return map
  }, [calendarDays])

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const heatmapWeeks = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return []

    const weeks: ({ date: string; count: number } | null)[][] = []
    let currentWeek: ({ date: string; count: number } | null)[] = []

    // Pad first week to align Sunday (dow 0) -> Saturday (dow 6)
    const firstDow = new Date(heatmapData[0].date + 'T00:00:00').getDay()
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push(null)
    }

    for (const d of heatmapData) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(d)
    }

    // Pad last week if incomplete
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }

    return weeks
  }, [heatmapData])

  const monthLabels = useMemo(() => {
    if (!heatmapWeeks.length) return []
    const labels: { label: string; col: number; span: number }[] = []
    let lastMonth = ''

    heatmapWeeks.forEach((week, i) => {
      const validDay = week.find((d) => d !== null)
      if (!validDay) return

      const month = format(new Date(validDay.date + 'T00:00:00'), 'MMM', { locale: ptBR })
      if (month !== lastMonth) {
        if (labels.length > 0) {
          labels[labels.length - 1].span = i - labels[labels.length - 1].col
        }
        labels.push({ label: month, col: i, span: 1 })
        lastMonth = month
      }
    })

    if (labels.length > 0) {
      labels[labels.length - 1].span = heatmapWeeks.length - labels[labels.length - 1].col
    }
    return labels
  }, [heatmapWeeks])

  if (loadingCal && loadingHeat) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader title="Calendário" description="Acompanhe sua consistência de estudos" icon={<CalendarDays size={20} style={{ color: 'var(--lumi-accent)' }} />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-icon">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-sm font-semibold capitalize" style={{ color: 'var(--lumi-text)' }}>
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-icon">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-[11px] font-medium py-1.5" style={{ color: 'var(--lumi-text3)' }}>{wd}</div>
            ))}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const count = calendarMap.get(dateStr) || 0
              const inMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)
              return (
                <div
                  key={dateStr}
                  className={`relative text-center py-2 rounded-lg text-sm transition-all ${
                    !inMonth ? 'opacity-30' : ''
                  } ${today ? 'font-bold ring-1' : 'hover:bg-lumi-surface2'}`}
                  style={{
                    color: inMonth ? 'var(--lumi-text)' : 'var(--lumi-text3)',
                    backgroundColor: today ? 'var(--lumi-selection)' : undefined,
                    borderColor: today ? 'var(--lumi-ring)' : undefined,
                  }}
                >
                  {format(day, 'd')}
                  {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm" style={{ backgroundColor: 'var(--lumi-accent)' }}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'var(--lumi-text3)' }}>Os círculos indicam revisões agendadas naquele dia.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--lumi-text)' }}>Mapa de Atividade</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setHeatmapYear((y) => y - 1)} className="btn-icon"><ChevronLeft size={16} /></button>
              <span className="text-sm font-medium w-14 text-center" style={{ color: 'var(--lumi-text2)' }}>{heatmapYear}</span>
              <button onClick={() => setHeatmapYear((y) => y + 1)} className="btn-icon"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="inline-flex flex-col gap-[3px]">
              {/* Month Header */}
              <div className="flex gap-[3px] pl-[22px]">
                {monthLabels.map((ml) => (
                  <span key={ml.label + ml.col} className="text-[10px] capitalize leading-[14px]" style={{ width: `${ml.span * 17 - 3}px`, color: 'var(--lumi-text3)' }}>
                    {ml.label}
                  </span>
                ))}
              </div>

              <div className="flex gap-[3px]">
                {/* Day Labels Column */}
                <div className="relative w-5 h-[116px] text-[9px] shrink-0" style={{ color: 'var(--lumi-text3)' }}>
                  <span className="absolute top-[17px] left-0 leading-[14px]">Seg</span>
                  <span className="absolute top-[51px] left-0 leading-[14px]">Qua</span>
                  <span className="absolute top-[85px] left-0 leading-[14px]">Sex</span>
                </div>

                {/* Heatmap Grid */}
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => (
                      day ? (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.count} ${day.count === 1 ? 'revisão' : 'revisões'}`}
                          className="w-[14px] h-[14px] rounded-[3px] transition-all hover:scale-110"
                          style={getHeatmapStyle(day.count)}
                        />
                      ) : (
                        <div
                          key={`empty-${wi}-${di}`}
                          className="w-[14px] h-[14px] opacity-0"
                        />
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-4 text-[11px]" style={{ color: 'var(--lumi-text3)' }}>
            <span>Menos</span>
            {LEGEND_ITEMS.map((item, i) => (
              <div
                key={i}
                title={item.label}
                className="w-[14px] h-[14px] rounded-[3px]"
                style={getHeatmapStyle(item.count)}
              />
            ))}
            <span>Mais</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
