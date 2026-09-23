import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Loader } from '../../components/common/Loader'
import { EmptyState } from '../../components/common/EmptyState'
import { getCachedStandards, listStandards } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import { deptTab } from '../../utils/constants'
import { cn } from '../../utils/cn'
import type { StandardSummary } from '../../types/standard'

const INITIAL_LIMIT = 40

export default function SearchStandards() {
  const { t, lang } = useI18n()
  const [searchParams] = useSearchParams()
  const departmentParam = searchParams.get('department')?.trim() || ''
  const aspectParam = searchParams.get('aspect')?.trim() || ''
  const groupParam = searchParams.get('group')?.trim() || ''
  const ministryParam = searchParams.get('ministry')?.trim() || ''
  const [term, setTerm] = useState('')
  const [items, setItems] = useState<StandardSummary[]>(() => getCachedStandards({ limit: INITIAL_LIMIT }) ?? [])
  const [loading, setLoading] = useState(items.length === 0)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let active = true
    const search = term.trim()
    const filters = {
      department: departmentParam || undefined,
      aspect: aspectParam || undefined,
      group: groupParam || undefined,
      ministry: ministryParam || undefined,
    }
    const hasFilter = Object.values(filters).some(Boolean)
    const params = search
      ? { search, ...filters, limit: 100, lang }
      : hasFilter
        ? { ...filters, limit: 100, lang }
        : { limit: INITIAL_LIMIT, lang }
    const cached = getCachedStandards(params)

    if (cached) {
      setItems(cached)
      setLoading(false)
      setSearching(false)
      return () => { active = false }
    }

    setSearching(Boolean(search))
    if (!search && items.length > 0) setLoading(false)
    else setLoading(true)

    const delay = window.setTimeout(() => {
      listStandards(params)
        .then((data) => {
          if (active) setItems(data)
        })
        .finally(() => {
          if (active) {
            setLoading(false)
            setSearching(false)
          }
        })
    }, search ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(delay)
    }
  }, [term, lang, departmentParam, aspectParam, groupParam, ministryParam])

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
      {loading && items.length === 0 ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title={t('results.none')} />
      ) : (
        <div className="relative">
          {searching && <div className="absolute right-2 -top-10 text-xs text-slate-500">{t('results.searching')}</div>}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.map((s) => (
              <Link
                key={s.id}
                to={`/standards/${s.id}`}
                data-testid={`search-result-${s.is_number}`}
                className={cn('panel border-l-2 p-5 transition-colors hover:border-accent/40', deptTab(s.department))}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-accent">{s.is_number}</span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-200">{s.title}</p>
                <p className="mt-1.5 text-xs text-slate-500">{s.department}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}