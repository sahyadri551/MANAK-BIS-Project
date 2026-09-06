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
  Active: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
  Withdrawn: 'bg-red-950/70 text-red-400 border-red-800/60',
  Draft: 'bg-amber-950/70 text-amber-400 border-amber-800/60',
  Superseded: 'bg-slate-800 text-slate-400 border-slate-700',
}

export function domainMeta(domain: string | null | undefined) {
  return (domain && DOMAINS[domain]) || {
    label: domain ?? 'General',
    icon: 'FileText',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    chart: '#64748b',
  }
}
