import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { MAIN } from '../layout/NavContent'
import { useI18n } from '../../i18n'
import { cn } from '../../utils/cn'

// Lightweight Ctrl+K / Cmd+K launcher that jumps to any section of the app.
// Built without an external dependency so it doesn't add a new package to
// install — just reuses the same nav list the sidebar renders.
export function CommandPalette() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = MAIN.map((item) => ({ ...item, label: t(item.key) }))
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [query, t])

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Wait a tick so the input exists before focusing.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function go(to: string) {
    navigate(to)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel animate-scale-in"
      >
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter' && results[activeIndex]) {
                go(results[activeIndex].to)
              }
            }}
            placeholder="Jump to a page…"
            className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
          />
          <kbd className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            Esc
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-500">No matching page.</p>
          )}
          {results.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={item.to}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => go(item.to)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  i === activeIndex ? 'bg-accent/10 text-accent' : 'text-slate-300 hover:bg-surface-2/70',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}