import { cn } from '../../utils/cn'
import { scorePercent, scoreTier } from '../../utils/format'
import { useI18n } from '../../i18n'

const TIER = {
  high: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  medium: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  low: 'text-slate-400 border-slate-500/40 bg-slate-500/10',
}

export function ScoreBadge({
  score,
  testId,
  size = 'md',
}: {
  score: number
  testId?: string
  size?: 'sm' | 'md'
}) {
  const { t } = useI18n()
  const tier = scoreTier(score)
  const pct = scorePercent(score)
  return (
    <div
      data-testid={testId}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border font-mono font-semibold',
        TIER[tier],
        size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs',
      )}
    >
      {pct}
      <span className="text-[0.65em] opacity-70">% {t('score.match')}</span>
    </div>
  )
}
