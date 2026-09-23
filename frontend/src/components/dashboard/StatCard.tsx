import type { LucideIcon } from 'lucide-react'

const COLORS = {
  accent: { icon: 'text-accent', border: 'border-t-accent' },
  ratified: { icon: 'text-ratified', border: 'border-t-ratified' },
  sky: { icon: 'text-sky-500', border: 'border-t-sky-500' },
  violet: { icon: 'text-violet-500', border: 'border-t-violet-500' },
} as const

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
  return (
    <div data-testid={testId} className={`panel border-t-2 ${c.border}/40 p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${c.icon}`} />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold text-slate-100">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}