import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { getFilterOptions } from '../services/standardsApi'
import type { FilterOptions } from '../types/standard'

const EMPTY: FilterOptions = { statuses: [], departments: [], aspects: [], domains: [] }

export function useFilterOptions() {
  const { lang } = useI18n()
  const [options, setOptions] = useState<FilterOptions>(EMPTY)

  useEffect(() => {
    getFilterOptions(lang)
      .then(setOptions)
      .catch(() => setOptions(EMPTY))
  }, [lang])

  return options
}
