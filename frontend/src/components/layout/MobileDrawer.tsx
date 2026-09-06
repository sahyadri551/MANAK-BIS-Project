import { useEffect } from 'react'
import { X } from 'lucide-react'
import { NavContent } from './NavContent'
import { cn } from '../../utils/cn'

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div
      className={cn('fixed inset-0 z-50 lg:hidden', !open && 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        data-testid="mobile-drawer"
        className={cn(
          'absolute left-0 top-0 h-full w-72 max-w-[82vw] border-r border-hairline bg-surface px-4 py-6 shadow-panel transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          data-testid="mobile-drawer-close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:text-slate-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <NavContent onNavigate={onClose} testPrefix="mobile-" />
      </aside>
    </div>
  )
}
