import { Link } from 'react-router-dom'
import { ArrowUpRight, Link2 } from 'lucide-react'
import { StatusBadge } from '../common/StatusBadge'
import { ScoreBadge } from '../common/ScoreBadge'
import { useI18n } from '../../i18n'
import type { RecommendationItem } from '../../types/recommendation'

export function RecommendationCard({ item, index }: { item: RecommendationItem; index: number }) {
  const { t } = useI18n()
  return (
    <Link
      to={`/standards/${item.standard_id}`}
      data-testid={`recommendation-card-${item.is_number}`}
      style={{ animationDelay: `${index * 60}ms` }}
      className="panel group block animate-fade-up p-5 transition-colors hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-accent">{item.is_number}</span>
            <StatusBadge status={item.status} />
          </div>
          <h3 className="mt-1.5 truncate font-display text-base font-semibold text-slate-100 group-hover:text-gray-400">
            {item.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {item.department}
            {item.aspect ? ` · ${item.aspect}` : ''}
          </p>
        </div>
        <ScoreBadge score={item.score} testId={`match-score-badge-${item.is_number}`} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.reason}</p>

      {item.matched_requirements.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.matched_requirements.map((req, i) => (
            <span
              key={i}
              data-testid="requirement-chip"
              className="rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] text-blue-200"
            >
              {req}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          {item.related_standards.length} {t('card.related')}
        </span>
        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-accent">
          {t('card.viewDetails')}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  )
}
