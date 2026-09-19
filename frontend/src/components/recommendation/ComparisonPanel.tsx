import { X } from 'lucide-react'
import type { StandardDetail } from '../../types/standard'
import { useI18n } from '../../i18n'

type Props = {
  items: StandardDetail[]
  onRemove?: (standardId: number) => void
  onClear?: () => void
}

const ROWS: Array<{ key: keyof StandardDetail; labelKey: string; render?: (item: StandardDetail) => string }> = [
  { key: 'status', labelKey: 'comparison.status' },
  { key: 'department', labelKey: 'comparison.department' },
  { key: 'aspect', labelKey: 'comparison.aspect' },
  { key: 'group', labelKey: 'comparison.group' },
  { key: 'ministry', labelKey: 'comparison.ministry' },
  { key: 'committee_name', labelKey: 'comparison.committee' },
  { key: 'published_on', labelKey: 'comparison.published' },
  { key: 'valid_upto', labelKey: 'comparison.valid' },
  { key: 'latest_version', labelKey: 'comparison.latestVersion' },
  { key: 'no_of_revision', labelKey: 'comparison.revisions', render: (item) => item.no_of_revision > 0 ? String(item.no_of_revision) : '—' },
  { key: 'amendment_count', labelKey: 'comparison.amendments', render: (item) => item.amendment_count > 0 ? String(item.amendment_count) : '—' },
  { key: 'reaffirmation_year', labelKey: 'comparison.reaffirmation', render: (item) => item.reaffirmation_year == null ? '—' : String(item.reaffirmation_year) },
  { key: 'degree_of_equivalence', labelKey: 'comparison.equivalence' },
  { key: 'certification', labelKey: 'comparison.certification' },
  { key: 'scope', labelKey: 'comparison.scope' },
]

export function ComparisonPanel({ items, onRemove, onClear }: Props) {
  const { t } = useI18n()

  if (items.length === 0) return null

  return (
    <section className="panel overflow-hidden" data-testid="comparison-results">
      <div className="flex items-center justify-between gap-4 border-b border-hairline bg-surface-2/40 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-100">{t('comparison.results')}</h2>
          <p className="mt-1 text-xs text-slate-500">{items.length} selected IS standards</p>
        </div>
        {onClear && (
          <button type="button" onClick={onClear} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-surface-2 hover:text-red-400">
            {t('comparison.clear')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left">
              <th className="w-44 px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-slate-500">Attribute</th>
              {items.map((item) => (
                <th key={item.id} className="min-w-[230px] px-4 py-4 align-top">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-accent">{item.is_number}</div>
                      <div className="mt-1.5 text-sm font-semibold leading-snug text-slate-200">{item.title}</div>
                    </div>
                    {onRemove && (
                      <button type="button" onClick={() => onRemove(item.id)} className="shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-surface-2 hover:text-red-400" aria-label={`Remove ${item.is_number}`}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={String(row.key)} className="border-b border-hairline last:border-b-0">
                <td className="px-4 py-4 align-top font-medium text-slate-500">{t(row.labelKey)}</td>
                {items.map((item) => {
                  const raw = row.render ? row.render(item) : item[row.key]
                  const value = Array.isArray(raw) ? raw.join(', ') : raw
                  return <td key={item.id} className="max-w-[360px] px-4 py-4 align-top leading-relaxed text-slate-300">{value == null || value === '' ? '—' : String(value)}</td>
                })}
              </tr>
            ))}
            <tr>
              <td className="px-4 py-4 align-top font-medium text-slate-500">{t('comparison.requirements')}</td>
              {items.map((item) => (
                <td key={item.id} className="px-4 py-4 align-top">
                  {item.requirements.length > 0 ? (
                    <div className="space-y-2">
                      {item.requirements.map((requirement, index) => (
                        <div key={index} className="rounded-lg border border-accent/15 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-slate-300">{requirement}</div>
                      ))}
                    </div>
                  ) : <span className="text-xs text-slate-600">{t('comparison.noRequirements')}</span>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
