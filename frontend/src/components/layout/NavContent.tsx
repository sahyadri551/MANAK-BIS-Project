import { NavLink } from 'react-router-dom'
import { History, LayoutDashboard, Plus, Search} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'

// const MAIN = [
//   { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, testId: 'nav-dashboard-link', end: true },
//   { to: '/recommendation', key: 'nav.newRec', icon: Plus, testId: 'nav-recommendation-link' },
//   { to: '/search-standards', key: 'nav.searchStd', icon: Search, testId: 'nav-search-link' },
//   { to: '/soon/browse', key: 'nav.browse', icon: LayoutGrid, testId: 'nav-browse-link' },
//   { to: '/soon/comparison', key: 'nav.comparison', icon: GitCompare, testId: 'nav-comparison-link' },
//   { to: '/soon/compliance', key: 'nav.compliance', icon: CheckSquare, testId: 'nav-compliance-link' },
//   { to: '/history', key: 'nav.history', icon: History, testId: 'nav-history-link' },
//   { to: '/soon/analytics', key: 'nav.analytics', icon: BarChart3, testId: 'nav-analytics-link' },
//   { to: '/soon/data', key: 'nav.dataStatus', icon: Database, testId: 'nav-data-link' },
// ]
const MAIN = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, testId: 'nav-dashboard-link', end: true },
  { to: '/recommendation', key: 'nav.newRec', icon: Plus, testId: 'nav-recommendation-link' },
  { to: '/search-standards', key: 'nav.searchStd', icon: Search, testId: 'nav-search-link' },
  { to: '/history', key: 'nav.history', icon: History, testId: 'nav-history-link' },
]

// const FOOT = [
//   { to: '/soon/settings', key: 'nav.settings', icon: Settings, testId: 'nav-settings-link' },
//   { to: '/soon/help', key: 'nav.help', icon: HelpCircle, testId: 'nav-help-link' },
// ]
const FOOT = []

function item(collapsed: boolean, t: (k: string) => string) {
  return ({ to, key, icon: Icon, testId, end }: (typeof MAIN)[number]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      title={collapsed ? t(key) : undefined}
      data-testid={testId}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
          isActive
            ? 'bg-accent/10 text-accent ring-1 ring-accent/20'
            : 'text-slate-500 hover:bg-surface-2/70 hover:text-slate-200',
        )
      }
    >
      <Icon className="h-4.5 w-4.5 shrink-0" style={{ height: 18, width: 18 }} />
      {collapsed ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-hairline bg-surface px-2 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-panel transition-opacity duration-150 group-hover:opacity-100"
        >
          {t(key)}
        </span>
      ) : (
        t(key)
      )}
    </NavLink>
  )
}

export function NavContent({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useI18n()
  const render = item(collapsed, t)
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className={cn('flex items-center gap-3 px-2', collapsed && 'justify-center px-0')}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/25">
          <span className="font-display text-lg font-extrabold text-accent">BIS</span>
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-[13px] font-bold text-slate-100">{t('topbar.orgName')}</div>
            <div className="text-[10px] text-slate-500">{t('topbar.orgSub')}</div>
          </div>
        )}
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {MAIN.map(render)}
        <div className="my-3 border-t border-hairline" />
        {FOOT.map(render)}
      </nav>

      {!collapsed && (
        <div className="mt-3 rounded-xl border border-hairline bg-base/50 p-4">
          <p className="text-xs font-semibold text-slate-200">{t('nav.standards')}</p>
          <p className="mt-0.5 text-sm font-bold text-accent">{t('nav.slogan')}</p>
          <div className="mt-2 h-1 rounded-full bg-gradient-to-r from-accent via-signal to-amber-400" />
          <p className="mt-3 font-mono text-[10px] text-slate-500">{t('nav.version')}</p>
        </div>
      )}
    </div>
  )
}
