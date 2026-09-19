import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Search, ShieldCheck, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '../../components/common/EmptyState'
import { Loader } from '../../components/common/Loader'
import { StatusBadge } from '../../components/common/StatusBadge'
import { getStandard, listStandards } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { StandardDetail, StandardSummary } from '../../types/standard'

export default function ComplianceCheck() {
  const { t, lang } = useI18n()
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<StandardSummary[]>([])
  const [selected, setSelected] = useState<StandardDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const value = term.trim()
    if (!value) {
      setResults([])
      return
    }
    let active = true
    const timer = window.setTimeout(() => {
      listStandards({ search: value, limit: 20, lang })
        .then((data) => active && setResults(data))
        .catch(() => active && setResults([]))
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [term, lang])

  async function choose(standard: StandardSummary) {
    setSelected(null)
    setResults([])
    setLoading(true)
    try {
      const detail = await getStandard(standard.id, lang)
      setSelected(detail)
      setChecked({})
    } finally {
      setLoading(false)
    }
  }

  const requirements = selected?.requirements ?? []
  const completed = useMemo(() => requirements.filter((_, index) => checked[index]).length, [requirements, checked])
  const remaining = requirements.length - completed
  const scheme = selected?.certification_scheme ?? 'NONE'

  return (
    <div data-testid="compliance-page" className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100">{t('compliance.title')}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{t('compliance.subtitle')}</p>
      </div>

      <div className="panel p-5">
        <label htmlFor="compliance-search" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">{t('compliance.searchLabel')}</label>
        <div className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="compliance-search"
            data-testid="compliance-search-input"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t('compliance.searchPlaceholder')}
            className="field pl-9"
          />
        </div>
        {term.trim() && results.length > 0 && !selected && (
          <div className="mt-3 max-w-2xl overflow-hidden rounded-lg border border-hairline bg-surface-2/50">
            {results.map((item) => (
              <button key={item.id} type="button" onClick={() => choose(item)} className="block w-full border-b border-hairline px-4 py-3 text-left last:border-b-0 hover:bg-surface-2" data-testid={`compliance-result-${item.is_number}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold text-accent">{item.is_number}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-sm text-slate-200">{item.title}</p>
              </button>
            ))}
          </div>
        )}
        {term.trim() && !results.length && <p className="mt-3 text-xs text-slate-500">{t('compliance.notFound')}</p>}
      </div>

      {loading && <Loader label={t('compliance.loading')} />}
      {!selected && !loading && !term.trim() && <EmptyState icon={ShieldCheck} title={t('compliance.select')} description={t('compliance.catalogueNote')} />}

      {selected && !loading && (
        <div className="space-y-5">
          <div className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-accent">{selected.is_number}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold text-slate-100">{selected.title}</h2>
              </div>
              <Link to={`/standards/${selected.id}`} className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20">{t('compliance.openDetails')}</Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label={t('compliance.scheme')} value={scheme} />
              <Info label={t('compliance.mandatory')} value={selected.certification_mandatory ? t('compliance.mandatory') : t('compliance.notMandatory')} />
              <Info label={t('compliance.qco')} value={selected.has_qco_gazette || '—'} />
              <Info label={t('compliance.status')} value={selected.status} />
            </div>
            {selected.certification && <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-slate-300">{t('compliance.certification')}: {selected.certification}</p>}
            <p className="mt-4 text-xs text-slate-500">{t('compliance.catalogueNote')}</p>
          </div>

          <div className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-slate-100">{t('compliance.requirements')}</h2>
              <span className="font-mono text-xs text-slate-500">{completed} {t('compliance.checked')} · {remaining} {t('compliance.remaining')}</span>
            </div>
            {requirements.length ? (
              <div className="mt-4 space-y-2">
                {requirements.map((requirement, index) => {
                  const done = Boolean(checked[index])
                  return (
                    <label key={`${index}-${requirement}`} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${done ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-hairline bg-base/20 hover:border-accent/30'}`}>
                      <input type="checkbox" checked={done} onChange={() => setChecked((current) => ({ ...current, [index]: !done }))} className="mt-1 h-4 w-4 accent-emerald-500" />
                      {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />}
                      <span className={`text-sm leading-6 ${done ? 'text-emerald-100' : 'text-slate-300'}`}>{requirement}</span>
                    </label>
                  )
                })}
              </div>
            ) : <p className="mt-4 text-sm text-slate-500">No catalogue requirements are available for this standard.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-hairline bg-base/30 p-4"><div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</div><div className="break-words text-sm font-medium text-slate-200">{value}</div></div>
}
