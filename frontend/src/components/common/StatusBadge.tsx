import { useI18n } from '../../i18n'
import { cn } from '../../utils/cn'
import { STATUS_STYLES } from '../../utils/constants'
import type { StandardStatus } from '../../types/standard'

const DOT: Record<string, string> = {
  Active: 'bg-emerald-400',
  Withdrawn: 'bg-red-400',
  Draft: 'bg-amber-400',
  Superseded: 'bg-slate-400',
}

const STATUS_KEYS: Record<string, string> = {
  Active: 'status.active',
  Withdrawn: 'status.withdrawn',
  Draft: 'status.draft',
  Superseded: 'status.superseded',
}

export function StatusBadge({ status, className }: { status: StandardStatus; className?: string }) {
  const { t } = useI18n()
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        STATUS_STYLES[status] ?? STATUS_STYLES.Superseded,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT[status] ?? 'bg-slate-400')} />
      {t(STATUS_KEYS[status] ?? '') || status}
    </span>
  )
}
