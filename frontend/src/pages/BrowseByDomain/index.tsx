import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LayoutGrid } from 'lucide-react'
import { DomainBadge } from '../../components/common/DomainBadge'
import { EmptyState } from '../../components/common/EmptyState'
import { Loader } from '../../components/common/Loader'
import { getStats } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import { DOMAINS } from '../../utils/constants'

export default function BrowseByDomain() {
  const { t, lang } = useI18n()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getStats(lang)
      .then((data) => {
        if (active) setCounts(data.by_domain || {})
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [lang])

  const domains = Object.keys(DOMAINS)
  if (loading) return <Loader />

  return (
    <div data-testid="browse-by-domain-page" className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-accent" />
          <h1 className="font-display text-2xl font-bold text-slate-100">{t('browse.title')}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t('browse.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {domains.map((domain) => (
          <Link key={domain} to={`/search-standards?domain=${encodeURIComponent(domain)}`} data-testid={`browse-domain-${domain}`} className="panel group p-5 transition-colors hover:border-accent/40">
            <div className="flex items-start justify-between gap-4"><DomainBadge domain={domain} /><ArrowRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-accent" /></div>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div><h2 className="font-display text-lg font-semibold text-slate-100">{DOMAINS[domain].label}</h2><p className="mt-1 text-xs text-slate-500">{counts[domain] ?? 0} {t('browse.standards')}</p></div>
              <span className="text-xs font-medium text-accent">{t('browse.view')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}