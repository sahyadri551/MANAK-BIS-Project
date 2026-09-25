import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
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
        <button
          type="button"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          aria-label="Open command palette"
          className="pointer-events-auto absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-slate-500 hover:text-slate-300 sm:block"
        >
          Ctrl K
        </button>
      </div>

      <div className=" flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}