import { useEffect, useState } from 'react'
import { CalendarClock, Cpu, Database, Settings2 } from 'lucide-react'
import { StatCard } from '../../components/dashboard/StatCard'
import { Loader } from '../../components/common/Loader'
import { useI18n } from '../../i18n'
import { getCatalogStatus, type CatalogStatus } from '../../services/dashboardApi'

function formatDate(value: string | null, fallback: string): string {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
export default function DataStatus() {
  const { t } = useI18n()
  const [data, setData] = useState<CatalogStatus | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getCatalogStatus().then(setData).finally(() => setLoading(false)) }, [])
  if (loading || !data) return <Loader />
  return <div data-testid="data-status-page" className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-slate-100">{t('dataStatus.title')}</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">{t('dataStatus.subtitle')}</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard testId="data-status-total" icon={Database} label={t('dataStatus.total')} value={data.total_standards} />
      <StatCard testId="data-status-provider" icon={Settings2} label={t('dataStatus.provider')} value={data.provider} accent="text-cyan-400" />
      <StatCard testId="data-status-embedding" icon={Cpu} label={t('dataStatus.embedding')} value={data.embedding_model} accent="text-amber-400" />
      <StatCard testId="data-status-updated" icon={CalendarClock} label={t('dataStatus.lastUpdated')} value={formatDate(data.last_updated, t('dataStatus.notAvailable'))} accent="text-emerald-400" />
    </div>
  </div>
}
