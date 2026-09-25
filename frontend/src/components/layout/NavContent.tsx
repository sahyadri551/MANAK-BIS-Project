import { NavLink } from 'react-router-dom'
import { FileSearch, GitCompare, History, LayoutDashboard, LayoutGrid, Plus, Search, ShieldCheck } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'
import { getBrowseOptions, getSearchHistory } from '../../services/standardsApi'

const MAIN = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, testId: 'nav-dashboard-link', end: true },
  { to: '/recommendation', key: 'nav.newRec', icon: Plus, testId: 'nav-recommendation-link' },
  { to: '/pdf-analysis', key: 'nav.pdfAnalysis', icon: FileSearch, testId: 'nav-pdf-analysis-link' },
  { to: '/search-standards', key: 'nav.searchStd', icon: Search, testId: 'nav-search-link' },
  { to: '/history', key: 'nav.history', icon: History, testId: 'nav-history-link' },
  { to: '/compliance', key: 'nav.compliance', icon: ShieldCheck, testId: 'nav-compliance-link' },
  { to: '/browse', key: 'nav.browse', icon: LayoutGrid, testId: 'nav-browse-link' },
  { to: '/compare-standards', key: 'nav.comparison', icon: GitCompare, testId: 'nav-comparison-link' },
]

const FOOT: typeof MAIN = []

// Warm the relevant cache just before navigation lands, so the page can render
// from cache instead of showing a spinner. Cheap no-ops if already cached/in-flight.
function prefetch(to: string, lang: string) {
  if (to === '/browse') void getBrowseOptions(lang)
  if (to === '/history') void getSearchHistory(100)
}

function item(collapsed: boolean, t: (k: string) => string, lang: string, onNavigate?: () => void, testPrefix = '') {
  return ({ to, key, icon: Icon, testId, end }: (typeof MAIN)[number]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      title={collapsed ? t(key) : undefined}
      data-testid={`${testPrefix}${testId}`}
      onClick={onNavigate}
      onMouseEnter={() => prefetch(to, lang)}
      onFocus={() => prefetch(to, lang)}
      onTouchStart={() => prefetch(to, lang)}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md border text-sm transition-colors',
          collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
          isActive
            ? 'border-accent/30 bg-accent/[0.06] font-medium text-accent'
            : collapsed
              ? 'border-transparent text-slate-500 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:bg-surface-2/70 hover:text-slate-200',
        )
      }
    >
      <Icon className="h-4.5 w-4.5 shrink-0" style={{ height: 18, width: 18 }} />
      {collapsed ? (
        <span role="tooltip" className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-hairline bg-surface px-2 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-panel transition-opacity duration-150 group-hover:opacity-100">
          {t(key)}
        </span>
      ) : t(key)}
    </NavLink>
  )
}

export function NavContent({
  collapsed = false,
  onNavigate,
  testPrefix = '',
}: {
  collapsed?: boolean
  onNavigate?: () => void
  testPrefix?: string
}) {
  const { t, lang } = useI18n()
  const render = item(collapsed, t, lang, onNavigate, testPrefix)
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className={cn('flex items-center gap-3 px-2', collapsed && 'justify-center px-0')}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10">
          <span className="font-display text-lg font-semibold text-accent">BIS</span>
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
        <div className="mt-3 rounded-md border-l-2 border-l-accent border-y border-r border-hairline bg-base/50 p-4">
          <p className="text-xs text-slate-400">{t('nav.standards')}</p>
          <p className="mt-0.5 font-display text-sm font-semibold text-accent">{t('nav.slogan')}</p>
          <p className="mt-3 font-mono text-[10px] text-slate-500">{t('nav.version')}</p>
        </div>
      )}
    </div>
  )
}