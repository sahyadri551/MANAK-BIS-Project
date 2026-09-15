import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NavContent } from './NavContent'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  return (
    <aside
      className={cn(
        'hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-hairline bg-surface/50 py-6 transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[76px] px-2' : 'w-64 px-4',
      )}
    >
      <NavContent collapsed={collapsed} />
      <button
        type="button"
        onClick={onToggle}
        data-testid="sidebar-collapse-toggle"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'mt-4 inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-2/40 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-100',
          collapsed ? 'justify-center px-0' : 'px-3',
        )}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> {t('nav.collapse')}</>}
      </button>
    </aside>
  )
}
