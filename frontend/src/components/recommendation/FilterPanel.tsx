import { useFilterOptions } from '../../hooks/useFilterOptions'
import { useI18n } from '../../i18n'
import { labelFor } from '../../i18n/dataLabels'
import type { RecommendationFilters } from '../../types/recommendation'

type Props = {
  value: RecommendationFilters
  onChange: (next: RecommendationFilters) => void
}

const FIELDS: { key: keyof RecommendationFilters; labelKey: string; testId: string; optionsKey: 'statuses' | 'departments' | 'aspects' }[] = [
  { key: 'status', labelKey: 'filter.status', testId: 'filter-status-select', optionsKey: 'statuses' },
  { key: 'department', labelKey: 'filter.department', testId: 'filter-department-select', optionsKey: 'departments' },
  { key: 'aspect', labelKey: 'filter.aspect', testId: 'filter-aspect-select', optionsKey: 'aspects' },
]

export function FilterPanel({ value, onChange }: Props) {
  const options = useFilterOptions()
  const { t, lang } = useI18n()

  return (
    <div className="flex flex-col gap-5">
      {FIELDS.map(({ key, labelKey, testId, optionsKey }) => (
        <label key={key} className="block">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-slate-500">{t(labelKey)}</span>
          <select
            data-testid={testId}
            className="field appearance-none py-3"
            value={value[key] ?? ''}
            onChange={(e) => onChange({ ...value, [key]: e.target.value || null })}
          >
            <option value="">{t('filter.all')}</option>
            {options[optionsKey].map((opt) => (
              <option key={opt} value={opt}>
                {labelFor(optionsKey, opt, lang)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}