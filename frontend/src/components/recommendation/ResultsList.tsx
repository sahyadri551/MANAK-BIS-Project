import { SearchX } from 'lucide-react'

import { RecommendationCard } from './RecommendationCard'
import { EmptyState } from '../common/EmptyState'
import { useI18n } from '../../i18n'

import type { RecommendationItem } from '../../types/recommendation'

type Props = {
  items: RecommendationItem[] | null
  selectedIds?: Set<number>
  onToggleCompare?: (standardId: number) => void
  returnTo?: string
}

export function ResultsList({
  items,
  selectedIds = new Set<number>(),
  onToggleCompare,
  returnTo = '/recommendation',
}: Props) {
  const { t } = useI18n()

  // IMPORTANT:
  // Do not render the result list until results exist.
  if (items === null) {
    return null
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t('results.none')}
        description={t('results.noneDesc')}
      />
    )
  }

  return (
    <div
      data-testid="recommendation-results"
      className="grid grid-cols-1 gap-4 xl:grid-cols-2"
    >
      {items.map((item, i) => (
        <RecommendationCard
          key={item.standard_id}
          item={item}
          index={i}
          selected={selectedIds.has(item.standard_id)}
          onToggleCompare={() =>
            onToggleCompare?.(item.standard_id)
          }
          returnTo={returnTo}
        />
      ))}
    </div>
  )
}