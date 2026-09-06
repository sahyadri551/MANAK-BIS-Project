import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Building2, Layers, ListChecks, ScrollText } from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DomainBadge } from '../../components/common/DomainBadge'
import { StandardCard } from '../../components/standards/StandardCard'
import { Loader } from '../../components/common/Loader'
import { EmptyState } from '../../components/common/EmptyState'
import { getStandard } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { StandardDetail } from '../../types/standard'

function Attribute({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-base/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm text-slate-200">{value}</div>
    </div>
  )
}

export default function StandardDetails() {
  const { id } = useParams()
  const { t, lang } = useI18n()
  const [standard, setStandard] = useState<StandardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    getStandard(id!)
      .then(setStandard)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id, lang])

  if (loading) return <Loader />
  if (notFound || !standard)
    return <EmptyState icon={ScrollText} title={t('details.notFound')} description={t('details.notFoundDesc')} />

  return (
    <div data-testid="standard-details-container" className="mx-auto max-w-4xl space-y-6">
      <Link to="/recommendation" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> {t('details.back')}
      </Link>

      <div className="panel animate-scale-in p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold text-accent">{standard.is_number}</span>
          <StatusBadge status={standard.status} />
          <DomainBadge domain={standard.domain} />
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold text-slate-100">{standard.title}</h1>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Attribute icon={Building2} label={t('attr.department')} value={standard.department ?? '—'} />
          <Attribute icon={Layers} label={t('attr.aspect')} value={standard.aspect ?? '—'} />
          <Attribute icon={CalendarClock} label={t('attr.year')} value={standard.year ? String(standard.year) : '—'} />
          <Attribute
            icon={CalendarClock}
            label={t('attr.reaffirmed')}
            value={standard.reaffirmation_year ? String(standard.reaffirmation_year) : '—'}
          />
        </div>
      </div>

      {standard.scope && (
        <div className="panel p-6">
          <h2 className="mb-2 font-display text-base font-semibold text-slate-100">{t('details.scope')}</h2>
          <p className="text-sm leading-relaxed text-slate-400">{standard.scope}</p>
        </div>
      )}

      {standard.requirements.length > 0 && (
        <div className="panel p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-slate-100">
            <ListChecks className="h-4 w-4 text-accent" /> {t('details.keyReq')}
          </h2>
          <ul className="space-y-2">
            {standard.requirements.map((req, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {standard.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {standard.keywords.map((k) => (
            <span key={k} className="rounded-md border border-hairline bg-surface-2/40 px-2 py-0.5 text-xs text-slate-400">
              #{k}
            </span>
          ))}
        </div>
      )}

      {standard.related_standards.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-slate-100">{t('details.related')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {standard.related_standards.map((r) => (
              <StandardCard key={r.id} standard={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
