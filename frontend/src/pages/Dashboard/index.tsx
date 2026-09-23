import { useEffect, useState } from 'react'
import { Database, Gauge, Layers, Search } from 'lucide-react'
import { StatCard } from '../../components/dashboard/StatCard'
import { DomainCoverageChart } from '../../components/dashboard/DomainCoverageChart'
import { RecentSearches } from '../../components/dashboard/RecentSearches'
import { QuickSpec } from '../../components/dashboard/QuickSpec'
import { Loader } from '../../components/common/Loader'
import { getCachedSearchHistory, getCachedStats, getSearchHistory, getSearchHistoryCount, getStats } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { StatsOverview } from '../../types/standard'
import type { SearchHistoryEntry } from '../../types/api'

export default function Dashboard() {
  const { t, lang } = useI18n()
  const cachedStats = getCachedStats(lang)
  const cachedHistory = getCachedSearchHistory(10)
  const [stats, setStats] = useState<StatsOverview | null>(cachedStats)
  const [history, setHistory] = useState<SearchHistoryEntry[]>(cachedHistory ?? [])
  const [searchTotal, setSearchTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(!cachedStats)

  useEffect(() => {
    Promise.all([getStats(lang), getSearchHistory(10), getSearchHistoryCount().catch(() => null)])
      .then(([nextStats, nextHistory, total]) => {
        setStats(nextStats)
        setHistory(nextHistory)
        setSearchTotal(total)
      })
      .finally(() => setLoading(false))
  }, [lang])

  if (loading || !stats) return <Loader />

  const activeCount = stats.by_status['Active'] ?? 0
  const aspectCount = Object.keys(stats.by_aspect).length

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard testId="stat-total" icon={Database} label={t('dash.total')} value={stats.total} hint={t('dash.totalHint')} />
        <StatCard testId="stat-active" icon={Gauge} label={t('dash.active')} value={activeCount} color="ratified" hint={t('dash.activeHint')} />
        <StatCard testId="stat-aspects" icon={Layers} label={t('dash.aspects')} value={aspectCount} color="sky" hint={t('dash.aspectsHint')} />
        <StatCard testId="stat-searches" icon={Search} label={t('dash.searches')} value={searchTotal ?? history.length} color="violet" hint={t('dash.searchesHint')} />
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