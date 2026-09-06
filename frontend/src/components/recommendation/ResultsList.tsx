import { SearchX } from 'lucide-react'
import { RecommendationCard } from './RecommendationCard'
import { EmptyState } from '../common/EmptyState'
import { useI18n } from '../../i18n'
import type { RecommendationItem } from '../../types/recommendation'

export function ResultsList({ items }: { items: RecommendationItem[] }) {
  const { t } = useI18n()
  if (items.length === 0) {
    return <EmptyState icon={SearchX} title={t('results.none')} description={t('results.noneDesc')} />
  }

  return (
    <div data-testid="recommendation-results" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {items.map((item, i) => (
        <RecommendationCard key={item.standard_id} item={item} index={i} />
      ))}
    </div>
  )
}
