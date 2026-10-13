import { type ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; positive?: boolean }
  /** CSS color string, e.g. '#10b981' or 'var(--lumi-accent)' */
  color?: string
}

export default function StatsCard({ title, value, subtitle, icon, trend, color }: Props) {
  const accentColor = color || 'var(--lumi-accent)'
  const accentBg = color
    ? `color-mix(in srgb, ${color} 12%, transparent)`
    : 'color-mix(in srgb, var(--lumi-accent) 12%, transparent)'

  return (
    <div className="card p-5 relative overflow-hidden group">
      {/* Color accent strip at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-150 rounded-t-xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-label mb-1">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--lumi-text3)' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className="flex items-center gap-1 mt-1.5 text-[11px] font-medium"
              style={{ color: trend.positive ? 'var(--lumi-success)' : 'var(--lumi-danger)' }}
            >
              <span>{trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105"
            style={{ backgroundColor: accentBg, color: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
