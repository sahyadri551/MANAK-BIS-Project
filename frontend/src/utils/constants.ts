import type { StandardStatus } from '../types/standard'

export const DOMAINS: Record<
  string,
  { label: string; icon: string; badge: string; chart: string }
> = {
  cement: {
    label: 'Cement & Concrete',
    icon: 'Building2',
    badge: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
    chart: '#f59e0b',
  },
  textiles: {
    label: 'Textiles',
    icon: 'Shirt',
    badge: 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-800/50',
    chart: '#c026d3',
  },
  electronics: {
    label: 'Electronics & IT',
    icon: 'Cpu',
    badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
    chart: '#22d3ee',
  },
  food_safety: {
    label: 'Food Safety',
    icon: 'Apple',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
    chart: '#10b981',
  },
}

export const STATUS_STYLES: Record<StandardStatus, string> = {
  Active: 'bg-ratified/10 text-ratified border-ratified/30',
  Withdrawn: 'bg-flagged/10 text-flagged border-flagged/30',
  Draft: 'bg-accent/10 text-accent border-accent/30',
  Superseded: 'bg-slate-800 text-slate-400 border-slate-700',
}

// Stable per-department accent, borrowed from a physical filing register where
// each department gets its own tab color. Same input always maps to the same
// color, without needing a maintained lookup table for every department code.
const DEPT_TABS = [
  'border-l-accent',
  'border-l-ratified',
  'border-l-flagged',
  'border-l-sky-700',
  'border-l-violet-700',
  'border-l-teal-700',
]

export function deptTab(department: string | null | undefined) {
  if (!department) return DEPT_TABS[DEPT_TABS.length - 1]
  let hash = 0
  for (let i = 0; i < department.length; i++) hash = (hash * 31 + department.charCodeAt(i)) >>> 0
  return DEPT_TABS[hash % DEPT_TABS.length]
}

// Shared per-section identity used on Browse Standards: each dimension keeps
// one color for both its icon and its panel accent, everywhere it appears.
export const DIMENSION_COLORS = {
  department: { icon: 'text-accent', border: 'border-t-accent' },
  aspect: { icon: 'text-sky-500', border: 'border-t-sky-500' },
  group: { icon: 'text-violet-500', border: 'border-t-violet-500' },
  ministry: { icon: 'text-teal-500', border: 'border-t-teal-500' },
} as const

export function domainMeta(domain: string | null | undefined) {
  return (domain && DOMAINS[domain]) || {
    label: domain ?? 'General',
    icon: 'FileText',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    chart: '#64748b',
  }
}