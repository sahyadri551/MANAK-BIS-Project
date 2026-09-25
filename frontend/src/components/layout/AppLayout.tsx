import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileDrawer } from './MobileDrawer'
import { FloatingChatbot } from '../common/FloatingChatbot'
import { CommandPalette } from '../common/CommandPalette'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('bis-sidebar') === '1')
  const location = useLocation()

  const toggleCollapse = () =>
    setCollapsed((v) => {
      localStorage.setItem('bis-sidebar', v ? '0' : '1')
      return !v
    })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapse} />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="grid-noise flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8">
          <div key={location.pathname} className="mx-auto w-full max-w-[1600px] animate-fade-up">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-hairline px-4 py-3 text-center text-[11px] text-slate-500 md:px-8">
          Built for Smart India Hackathon · Bureau of Indian Standards
        </footer>
      </div>
      <FloatingChatbot />
      <CommandPalette />
    </div>
  )
}