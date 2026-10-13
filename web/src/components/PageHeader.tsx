import { type ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  children?: ReactNode
  icon?: ReactNode
}

export default function PageHeader({ title, description, children, icon }: Props) {
  return (
    <div className="page-header">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-lumi-accent/10 flex items-center justify-center shrink-0 text-lumi-accent">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="page-description">{description}</p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
