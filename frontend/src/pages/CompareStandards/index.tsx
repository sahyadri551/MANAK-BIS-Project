import { useEffect, useMemo, useState } from 'react'
import { Search, GitCompare, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../../components/common/EmptyState'
import { Loader } from '../../components/common/Loader'
import { ComparisonPanel } from '../../components/recommendation/ComparisonPanel'
import { getStandard, listStandards } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { StandardDetail, StandardSummary } from '../../types/standard'

const MAX_SELECTED = 4
const INITIAL_LIMIT = 40

function parseIds(value: string | null): number[] {
  if (!value) return []
  return Array.from(new Set(value.split(',').map(Number).filter((id) => Number.isInteger(id) && id > 0))).slice(0, MAX_SELECTED)
}

export default function CompareStandards() {
  const { t, lang } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialIds = useMemo(() => parseIds(searchParams.get('ids')), [searchParams])
  const [term, setTerm] = useState('')
  const [items, setItems] = useState<StandardSummary[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds)
  const [comparisonIds, setComparisonIds] = useState<number[]>(initialIds)
  const [comparison, setComparison] = useState<StandardDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [comparisonLoading, setComparisonLoading] = useState(initialIds.length >= 2)
  const [showSelector, setShowSelector] = useState(initialIds.length < 2)

  useEffect(() => {
    let active = true
    const params = term.trim()
      ? { search: term.trim(), limit: 100, lang }
      : { limit: INITIAL_LIMIT, lang }

    const delay = window.setTimeout(() => {
      listStandards(params)
        .then((data) => { if (active) setItems(data) })
        .finally(() => { if (active) setLoading(false) })
    }, term.trim() ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(delay)
    }
  }, [term, lang])

  useEffect(() => {
    if (initialIds.length < 2) {
      setComparison([])
      setComparisonIds([])
      setComparisonLoading(false)
      return
    }
    let active = true
    setComparisonLoading(true)
    Promise.all(initialIds.map((id) => getStandard(id, lang)))
      .then((data) => {
        if (active) {
          setComparison(data)
          setComparisonIds(initialIds)
        }
      })
      .catch(() => {
        if (active) {
          setComparison([])
          toast.error('Could not load one or more selected standards.')
        }
      })
      .finally(() => { if (active) setComparisonLoading(false) })

    return () => { active = false }
  }, [initialIds, lang])

  function toggleSelected(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id)
      if (current.length >= MAX_SELECTED) {
        toast.error(t('comparison.maximum'))
        return current
      }
      return [...current, id]
    })
  }

  function compareSelected() {
    if (selectedIds.length < 2) {
      toast.error(t('comparison.minimum'))
      return
    }
    setSearchParams({ ids: selectedIds.join(',') })
  }

  function clearSelection() {
    setSelectedIds([])
    setComparison([])
    setComparisonIds([])
    setSearchParams({})
    setShowSelector(true)
  }

  function changeSelection() {
    setShowSelector(true)
    setComparison([])
    setComparisonIds([])
  }

  const comparisonMode = comparisonIds.length >= 2 && !showSelector

  useEffect(() => {
    if (comparisonMode) {
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [comparisonMode])

  return (
    <div data-testid="compare-standards-page" className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100">{t('comparison.title')}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{t('comparison.subtitle')}</p>
      </div>

      {comparisonMode ? (
        comparisonLoading ? (
          <Loader label={t('comparison.loading')} />
        ) : comparison.length >= 2 ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button type="button" onClick={changeSelection} className="rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-surface-2 hover:text-slate-200">
                {t('comparison.changeSelection')}
              </button>
            </div>
            <ComparisonPanel items={comparison} />
          </div>
        ) : (
          <div className="panel flex min-h-[220px] items-center justify-center p-8 text-center">
            <p className="max-w-md text-sm text-slate-500">{t('comparison.noSelection')}</p>
          </div>
        )
      ) : showSelector ? (
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-100">{t('comparison.selected')}: {selectedIds.length}/4</h2>
            <p className="mt-1 text-xs text-slate-500">{selectedIds.length < 2 ? t('comparison.minimum') : t('comparison.compareSelected')}</p>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && <button type="button" onClick={clearSelection} className="rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-surface-2">{t('comparison.clear')}</button>}
            <button type="button" onClick={compareSelected} disabled={selectedIds.length < 2} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              <GitCompare className="h-4 w-4" />
              {t('comparison.compareSelected')}
            </button>
          </div>
        </div>

        <div className="relative mt-5 max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={t('comparison.searchPlaceholder')} className="field pl-9" data-testid="compare-search-input" />
        </div>

        {loading && items.length === 0 ? (
          <div className="mt-5"><Loader /></div>
        ) : items.length === 0 ? (
          <div className="mt-5"><EmptyState icon={Search} title={t('results.none')} /></div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const checked = selectedIds.includes(item.id)
              return (
                <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${checked ? 'border-accent/50 bg-accent/10' : 'border-hairline bg-base/20 hover:border-accent/30'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleSelected(item.id)} className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent accent-blue-500" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-accent">{item.is_number}</span>
                      {checked && <Check className="h-4 w-4 text-accent" />}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm font-medium text-slate-200">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.department || '—'}</span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </section>
      ) : null}

        <Loader label={t('comparison.loading')} />
      ) : comparisonIds.length >= 2 && comparison.length >= 2 ? (
        <ComparisonPanel items={comparison} />
      ) : (
        <div className="panel flex min-h-[220px] items-center justify-center p-8 text-center">
          <p className="max-w-md text-sm text-slate-500">{t('comparison.noSelection')}</p>
        </div>
      )}
    </div>
  )
}
