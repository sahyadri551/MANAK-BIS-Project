import { useEffect, useState } from 'react'
import { ArrowRight, Layers3, Landmark, ListFilter, Network } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Loader } from '../../components/common/Loader'
import { getBrowseOptions } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import { labelFor } from '../../i18n/dataLabels'

type Item = { value: string; label: string; count: number }
type Dimension = { key: 'department' | 'aspect' | 'group' | 'ministry'; title: string; items: Item[]; icon: typeof Layers3 }

const ICONS = {
  department: Landmark,
  aspect: ListFilter,
  group: Layers3,
  ministry: Network,
} as const

const KIND = { department: 'departments', aspect: 'aspects', group: 'groups', ministry: 'ministries' } as const

export default function BrowseStandards() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<Record<string, Item[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getBrowseOptions(lang)
      .then((value) => active && setData(value))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [lang])

  const sortLocalized = (items: Item[], kind: 'groups' | 'ministries') =>
  [...items].sort((a, b) => labelFor(kind, a.value, lang).localeCompare(labelFor(kind, b.value, lang), lang))

  const dimensions: Dimension[] = [
    { key: 'department', title: t('browse.department'), items: data.departments ?? [], icon: ICONS.department },
    { key: 'aspect', title: t('browse.aspect'), items: data.aspects ?? [], icon: ICONS.aspect },
    { key: 'group', title: t('browse.group'), items: sortLocalized(data.groups ?? [], 'groups'), icon: ICONS.group },
    { key: 'ministry', title: t('browse.ministry'), items: sortLocalized(data.ministries ?? [], 'ministries'), icon: ICONS.ministry },
  ]

  return (
    <div data-testid="browse-standards-page" className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100">{t('browse.title')}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{t('browse.subtitle')}</p>
      </div>

      {loading ? <Loader /> : dimensions.map(({ key, title, items, icon: Icon }) => (
        <section key={key} className="panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-semibold text-slate-100">{title}</h2>
            </div>
            <span className="text-xs text-slate-500">{items.length} {t('browse.categories')}</span>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">{t('browse.empty')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.value}
                  to={`/search-standards?${key}=${encodeURIComponent(item.value)}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-hairline bg-base/20 px-4 py-3 transition-colors hover:border-accent/40 hover:bg-surface-2/60"
                  data-testid={`browse-${key}-${item.value}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200 group-hover:text-accent">{labelFor(KIND[key], key === 'group' || key === 'ministry' ? item.value : item.label, lang)}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.count.toLocaleString()} {t('browse.standards')}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-accent" />
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
