import { useEffect, useState } from 'react'
import { Database, Gauge, Layers, Search } from 'lucide-react'
import { StatCard } from '../../components/dashboard/StatCard'
import { DomainCoverageChart } from '../../components/dashboard/DomainCoverageChart'
import { RecentSearches } from '../../components/dashboard/RecentSearches'
import { QuickSpec } from '../../components/dashboard/QuickSpec'
import { Loader } from '../../components/common/Loader'
import { getSearchHistory, getStats } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { StatsOverview } from '../../types/standard'
import type { SearchHistoryEntry } from '../../types/api'

export default function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [history, setHistory] = useState<SearchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getSearchHistory(10)])
      .then(([s, h]) => {
        setStats(s)
        setHistory(h)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) return <Loader />

  const activeCount = stats.by_status['Active'] ?? 0
  const aspectCount = Object.keys(stats.by_aspect).length

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard testId="stat-total" icon={Database} label={t('dash.total')} value={stats.total} hint={t('dash.totalHint')} />
        <StatCard testId="stat-active" icon={Gauge} label={t('dash.active')} value={activeCount} accent="text-emerald-400" hint={t('dash.activeHint')} />
        <StatCard testId="stat-aspects" icon={Layers} label="Aspects" value={aspectCount} accent="text-cyan-400" hint="Classification aspects in the BIS catalogue" />
        <StatCard testId="stat-searches" icon={Search} label={t('dash.searches')} value={history.length} accent="text-amber-400" hint={t('dash.searchesHint')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DomainCoverageChart data={stats.by_aspect} />
          <RecentSearches entries={history} />
        </div>
        <QuickSpec />
      </div>
    </div>
  )
}
