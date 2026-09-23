import { Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'

type Props = {
  loading: boolean
  overall: string | null
}

export function AiSummaryPanel({ loading, overall }: Props) {
  const { t } = useI18n()

  if (!loading && !overall) return null

  return (
    <div
      data-testid="ai-summary-panel"
      className="panel animate-fade-up border-accent/20 bg-gradient-to-br from-accent/[0.06] to-transparent p-5"
    >
      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="h-4 w-4" />
        <h3 className="font-display text-sm font-semibold">{t('summary.overallTitle')}</h3>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-500/15" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-500/15" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-500/15" />
        </div>
      ) : (
        <p className={cn('mt-3 text-sm leading-relaxed text-slate-300')}>{overall}</p>
      )}
    </div>
  )
}
