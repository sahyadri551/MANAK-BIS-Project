import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, History, RotateCw, Search } from 'lucide-react'
import { Loader } from '../../components/common/Loader'
import { EmptyState } from '../../components/common/EmptyState'
import { getCachedSearchHistory, getSearchHistory } from '../../services/standardsApi'
import { formatDate } from '../../utils/format'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'
import type { SearchHistoryEntry } from '../../types/api'

function filterChips(e: SearchHistoryEntry): string[] {
  return Object.values(e.filters).filter(Boolean) as string[]
}

function historyLabel(entry: SearchHistoryEntry): string {
  return entry.document_name ? `PDF Search: ${entry.document_name}` : entry.query
}

export default function SearchHistory() {
  const { t } = useI18n()
  const cachedEntries = getCachedSearchHistory(100)
  const [entries, setEntries] = useState<SearchHistoryEntry[]>(cachedEntries ?? [])
  const [loading, setLoading] = useState(!cachedEntries)
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [dept, setDept] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getSearchHistory(100)
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  const statuses = useMemo(
    () => [...new Set(entries.map((e) => e.filters.status).filter(Boolean) as string[])],
    [entries],
  )
  const departments = useMemo(
    () => [...new Set(entries.map((e) => e.filters.department).filter(Boolean) as string[])],
    [entries],
  )

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          historyLabel(e).toLowerCase().includes(term.toLowerCase()) &&
          (!status || e.filters.status === status) &&
          (!dept || e.filters.department === dept),
      ),
    [entries, term, status, dept],
  )

  const rerun = (query: string) => navigate('/recommendation', { state: { query } })

  if (loading) return <Loader />

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
      active
        ? 'border-accent/50 bg-accent/15 text-slate-100'
        : 'border-hairline bg-surface-2/40 text-slate-400 hover:text-slate-200',
    )

  return (
    <div data-testid="search-history-page" className="space-y-5">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input data-testid="history-search-input" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('history.filter')} className="field pl-9" />
      </div>

      {(statuses.length > 0 || departments.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{t('history.quickFilter')}</span>
          {statuses.map((s) => <button key={`s-${s}`} data-testid={`history-chip-status-${s}`} onClick={() => setStatus((v) => (v === s ? null : s))} className={chip(status === s)}>{s}</button>)}
          {departments.map((d) => <button key={`d-${d}`} data-testid={`history-chip-dept-${d}`} onClick={() => setDept((v) => (v === d ? null : d))} className={chip(dept === d)}>{d}</button>)}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={History} title={t('history.empty')} description={t('history.emptyDesc')} />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((e) => (
              <div key={e.id} data-testid={`history-card-${e.id}`} className="panel p-4">
                <p className="text-sm font-medium text-slate-100">{historyLabel(e)}</p>
                <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-slate-500"><Clock className="h-3 w-3" /> {formatDate(e.created_at)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {filterChips(e).map((f) => <span key={f} className="rounded border border-hairline bg-base/50 px-1.5 py-0.5 text-[11px] text-slate-400">{f}</span>)}
                  <span className="rounded-md border border-hairline bg-base/50 px-2 py-0.5 font-mono text-[11px] text-slate-300">{e.result_count} {t('history.matches').toLowerCase()}</span>
                </div>
                <button data-testid={`history-rerun-mobile-${e.id}`} onClick={() => rerun(e.query)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface-2/40 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-accent/50 hover:text-accent"><RotateCw className="h-3.5 w-3.5" /> {t('history.rerun')}</button>
              </div>
            ))}
          </div>

          <div className="panel hidden overflow-x-auto md:block">
            <table data-testid="search-history-table" className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-hairline font-mono text-[10px] uppercase tracking-widest text-slate-500"><th className="px-5 py-3 font-medium">{t('history.timestamp')}</th><th className="px-5 py-3 font-medium">{t('history.query')}</th><th className="px-5 py-3 font-medium">{t('history.filters')}</th><th className="px-5 py-3 text-right font-medium">{t('history.matches')}</th><th className="px-5 py-3" /></tr></thead>
              <tbody className="divide-y divide-hairline">
                {filtered.map((e) => (
                  <tr key={e.id} data-testid={`history-row-${e.id}`} className="transition-colors hover:bg-surface-2/40">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">{formatDate(e.created_at)}</td>
                    <td className="max-w-md px-5 py-3 text-slate-200"><span className="line-clamp-2">{historyLabel(e)}</span></td>
                    <td className="px-5 py-3"><div className="flex flex-wrap gap-1">{filterChips(e).length === 0 ? <span className="text-xs text-slate-600">—</span> : filterChips(e).map((f) => <span key={f} className="rounded border border-hairline bg-base/50 px-1.5 py-0.5 text-[11px] text-slate-400">{f}</span>)}</div></td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{e.result_count}</td>
                    <td className="px-5 py-3 text-right"><button data-testid={`history-rerun-${e.id}`} onClick={() => rerun(e.query)} className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-xs text-slate-400 transition-colors hover:border-accent/50 hover:text-accent"><RotateCw className="h-3 w-3" /> {t('history.rerun')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
