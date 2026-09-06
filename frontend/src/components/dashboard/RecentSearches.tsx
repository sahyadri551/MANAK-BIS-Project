import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { formatDate, truncate } from '../../utils/format'
import { useI18n } from '../../i18n'
import type { SearchHistoryEntry } from '../../types/api'

export function RecentSearches({ entries }: { entries: SearchHistoryEntry[] }) {
  const { t } = useI18n()
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-slate-100">{t('dash.recent')}</h3>
        <Link to="/history" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover">
          {t('dash.viewAll')} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{t('dash.noSearches')}</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {entries.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-200">{truncate(e.query, 60)}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(e.created_at)}
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-hairline bg-base/50 px-2 py-1 font-mono text-xs text-slate-300">
                {e.result_count} {t('dash.hits')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
