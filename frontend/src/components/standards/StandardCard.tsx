import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { StatusBadge } from '../common/StatusBadge'
import type { AlliedStandardCategory, RelatedStandard } from '../../types/standard'

const CATEGORY_LABELS: Record<AlliedStandardCategory, string> = {
  normative_reference: 'Normative Reference',
  test_method: 'Test Method',
  terminology: 'Terminology',
  safety: 'Safety',
  installation: 'Installation',
  product_spec: 'Product Specification',
  supersedes: 'Supersedes',
  superseded_by: 'Superseded By',
}

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
      {standard.category && (
        <span className="self-start rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-accent">
          {CATEGORY_LABELS[standard.category]}
        </span>
      )}
      <p className="line-clamp-2 text-sm text-slate-300">{standard.title}</p>
      <StatusBadge status={standard.status} className="self-start" />
    </Link>
  )
}
