import { ShieldCheck } from 'lucide-react'

type Scheme = 'ISI_MANDATORY' | 'ISI_VOLUNTARY' | 'CRS' | 'HALLMARKING' | 'NONE'

type Props = { scheme: Scheme; prominent?: boolean }

const LABELS: Record<Exclude<Scheme, 'NONE'>, string> = {
  ISI_MANDATORY: 'ISI Mark — Mandatory Certification',
  ISI_VOLUNTARY: 'ISI Mark — Voluntary Certification',
  CRS: 'CRS — Mandatory Registration',
  HALLMARKING: 'Hallmarking — Mandatory Certification',
}

export function CertificationBadge({ scheme, prominent = false }: Props) {
  if (scheme === 'NONE') return null
  return <span className={prominent ? 'inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-200' : 'inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200'}><ShieldCheck className="h-3.5 w-3.5" />{LABELS[scheme]}</span>
}
