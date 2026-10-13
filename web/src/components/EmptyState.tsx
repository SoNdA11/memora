import { type ReactNode, type ElementType } from 'react'

interface Props {
  icon?: ElementType
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="empty-state animate-fade-in">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lumi-text) 6%, transparent)' }}>
          <Icon size={26} style={{ color: 'var(--lumi-text3)' }} />
        </div>
      )}
      <p className="empty-state-title">{title}</p>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  )
}
