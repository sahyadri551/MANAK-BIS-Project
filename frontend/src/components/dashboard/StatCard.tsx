import type { LucideIcon } from 'lucide-react'

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'text-accent',
  testId,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  accent?: string
  testId?: string
}) {
  return (
    <div data-testid={testId} className="panel animate-fade-up p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="mt-3 font-display text-3xl font-bold text-slate-100">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
