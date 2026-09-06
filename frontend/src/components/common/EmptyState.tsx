import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}) {
  return (
    <div
      data-testid="empty-state"
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-hairline bg-surface-2/60">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-200">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  )
}
