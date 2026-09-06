import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu, Search } from 'lucide-react'
import { ThemeToggle } from '../common/ThemeToggle'
import { LanguageSwitcher } from '../common/LanguageSwitcher'
import { useI18n } from '../../i18n'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  return (
    <header className="z-20 flex items-center justify-between gap-3 border-b border-hairline bg-base/70 px-4 py-3 backdrop-blur-md md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        data-testid="mobile-menu-button"
        aria-label="Open menu"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-2/40 text-slate-300 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1 md:max-w-2xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          data-testid="topbar-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate('/search-standards')
          }}
          onFocus={() => navigate('/search-standards')}
          placeholder={t('topbar.searchPlaceholder')}
          className="field h-10 rounded-xl pl-9 pr-14"
        />
        {/* <span className=" pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:block">
          Ctrl + K
        </span> */}
      </div>

      <div className=" flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        {/* <button
          data-testid="notifications-button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface-2/40 text-slate-400 hover:text-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button> */}
        {/* <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2/40 py-1 pl-1 pr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">S</div>
          <div className="hidden leading-tight sm:block">
            <div className="text-xs font-semibold text-slate-200">Sahyadri</div>
            <div className="text-[10px] text-slate-500">{t('user.role')}</div>
          </div>
        </div> */}
      </div>
    </header>
  )
}
