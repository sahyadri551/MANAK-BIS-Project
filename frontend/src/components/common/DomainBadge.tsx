import { Apple, Building2, Cpu, FileText, Shirt } from 'lucide-react'
import { cn } from '../../utils/cn'
import { domainMeta } from '../../utils/constants'

const ICONS = { Building2, Shirt, Cpu, Apple, FileText }

export function DomainBadge({
  domain,
  className,
  withLabel = true,
}: {
  domain: string | null
  className?: string
  withLabel?: boolean
}) {
  const meta = domainMeta(domain)
  const Icon = ICONS[meta.icon as keyof typeof ICONS] ?? FileText
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        meta.badge,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {withLabel && meta.label}
    </span>
  )
}
