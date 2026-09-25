import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

const COLORS = {
  accent: { icon: 'text-accent', border: 'border-t-accent' },
  ratified: { icon: 'text-ratified', border: 'border-t-ratified' },
  sky: { icon: 'text-sky-500', border: 'border-t-sky-500' },
  violet: { icon: 'text-violet-500', border: 'border-t-violet-500' },
} as const

// Eases a displayed number up from 0 to its target whenever the target
// changes, instead of popping straight to the final value. Purely a
// presentation touch — falls back to displaying the raw value as-is for
// non-numeric or NaN inputs.
function useCountUp(target: number, durationMs = 900) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setDisplay(target)
      return
    }
    const from = fromRef.current
    const delta = target - from
    if (delta === 0) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + delta * eased
      setDisplay(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return display
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color = 'accent',
  testId,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  color?: keyof typeof COLORS
  testId?: string
}) {
  const c = COLORS[color]
  const numericValue = typeof value === 'number' ? value : Number(value)
  const isCountable = Number.isFinite(numericValue) && typeof value !== 'string'
  const animated = useCountUp(isCountable ? numericValue : 0)
  const displayValue = isCountable ? Math.round(animated).toLocaleString() : value

  return (
    <div data-testid={testId} className={`panel border-t-2 ${c.border}/40 p-5 transition-colors duration-300`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${c.icon}`} />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold text-slate-100 tabular-nums">
        {displayValue}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}