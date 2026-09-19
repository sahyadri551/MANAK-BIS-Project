import { useEffect, useState } from 'react'
import { Activity, Gauge, TrendingUp } from 'lucide-react'
import { StatCard } from '../../components/dashboard/StatCard'
import { Loader } from '../../components/common/Loader'
import { useI18n } from '../../i18n'
import { getDashboard, type DashboardData } from '../../services/dashboardApi'

function healthClass(status: string): string {
  if (status === 'online') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
  if (status === 'planned') return 'border-amber-400/20 bg-amber-400/10 text-amber-300'
  return 'border-hairline bg-surface-2 text-slate-400'
}

export default function Analytics() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getDashboard(lang).then(setData).finally(() => setLoading(false)) }, [lang])
  if (loading || !data) return <Loader />
  const avg = data.ai_performance.find((item) => item.metric === 'Avg. recommendation confidence (last 20 runs)')?.value ?? null
  return (
    <div data-testid="analytics-page" className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold text-slate-100">{t('analytics.title')}</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">{t('analytics.subtitle')}</p></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard testId="analytics-total" icon={Activity} label={t('dataStatus.total')} value={data.stats.total} />
        <StatCard testId="analytics-recommendations" icon={TrendingUp} label={t('dash.recommendations')} value={data.stats.recommendations} accent="text-cyan-400" />
        <StatCard testId="analytics-confidence" icon={Gauge} label="Avg. recommendation confidence" value={avg === null ? t('analytics.noValue') : avg + '%'} accent="text-amber-400" />
      </div>
      <section className="panel p-5 sm:p-6"><h2 className="mb-4 font-display text-lg font-semibold text-slate-100">{t('analytics.systemHealth')}</h2>
        <div className="divide-y divide-hairline">{data.system_health.map((item) => <div key={item.name} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-200">{item.name}</p><p className="mt-0.5 text-xs text-slate-500">{item.detail}</p></div><div className="flex items-center gap-3"><span className="font-mono text-xs text-slate-500">{t('analytics.latency')}: {item.latency_ms} ms</span><span className={'rounded-full border px-2.5 py-0.5 text-[11px] font-medium ' + healthClass(item.status)}>{item.status === 'online' ? t('analytics.online') : item.status === 'planned' ? t('analytics.planned') : item.status}</span></div></div>)}</div>
      </section>
      <section className="panel p-5 sm:p-6"><h2 className="mb-4 font-display text-lg font-semibold text-slate-100">{t('analytics.aiPerformance')}</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{data.ai_performance.map((item) => <div key={item.metric} className="rounded-xl border border-hairline bg-base/30 p-4"><p className="text-xs text-slate-500">{item.metric}</p><p className="mt-2 text-lg font-semibold text-slate-200">{item.value === null ? t('analytics.noValue') : item.value + '%'}</p></div>)}</div></section>
    </div>
  )
}
