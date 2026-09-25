import { ListChecks } from 'lucide-react'

import { ResultsList } from './ResultsList'
import type { PdfLineItem } from '../../types/recommendation'

type Props = {
  items: PdfLineItem[]
  title: string
  description: string
  itemLabel: string
  noMatchesLabel: string
}

export function LineItemRecommendations({ items, title, description, itemLabel, noMatchesLabel }: Props) {
  if (items.length === 0) return null

  return (
    <div className="panel space-y-4 p-5" data-testid="pdf-line-items">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <ListChecks className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-slate-100">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="divide-y divide-hairline">
        {items.map((item) => (
          <details key={item.item_number} className="group py-3 first:pt-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-2/40 font-mono text-[11px] text-slate-400">
                {item.item_number}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-6 text-slate-300 line-clamp-2 group-open:line-clamp-none">
                {item.text}
              </span>
              <span className="shrink-0 rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 font-mono text-[11px] text-accent">
                {item.recommendations.length} {itemLabel}
              </span>
            </summary>
            <div className="mt-3 pl-9">
              {item.recommendations.length > 0 ? (
                <ResultsList items={item.recommendations} returnTo="/pdf-analysis" />
              ) : (
                <p className="text-xs text-slate-600">{noMatchesLabel}</p>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
