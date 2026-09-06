import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Loader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16 text-slate-400', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
