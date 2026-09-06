import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Loader } from '../../components/common/Loader'
import { EmptyState } from '../../components/common/EmptyState'
import { listStandards } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { StandardSummary } from '../../types/standard'

export default function SearchStandards() {
  const { t, lang } = useI18n()
  const [term, setTerm] = useState('')
  const [items, setItems] = useState<StandardSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listStandards({ search: term || undefined, limit: 100 })
      .then(setItems)
      .finally(() => setLoading(false))
  }, [term, lang])

  return (
    <div data-testid="search-standards-page" className="space-y-5">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          data-testid="search-standards-input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t('topbar.searchPlaceholder')}
          className="field pl-9"
        />
      </div>
      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title="No standards found" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <Link
              key={s.id}
              to={`/standards/${s.id}`}
              data-testid={`search-result-${s.is_number}`}
              className="panel p-4 transition-colors hover:border-accent/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-accent">{s.is_number}</span>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-slate-200">{s.title}</p>
              <p className="mt-1 text-xs text-slate-500">{s.department}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
