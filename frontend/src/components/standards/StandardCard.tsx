import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { StatusBadge } from '../common/StatusBadge'
import type { RelatedStandard } from '../../types/standard'

export function StandardCard({ standard }: { standard: RelatedStandard }) {
  return (
    <Link
      to={`/standards/${standard.id}`}
      data-testid={`related-standard-${standard.is_number}`}
      className="panel group flex flex-col gap-2 p-4 transition-colors hover:border-accent/40"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold text-accent">{standard.is_number}</span>
        <ArrowUpRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-accent" />
      </div>
      <p className="line-clamp-2 text-sm text-slate-300">{standard.title}</p>
      <StatusBadge status={standard.status} className="self-start" />
    </Link>
  )
}
