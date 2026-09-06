import { useEffect, useState } from 'react'
import { getFilterOptions } from '../services/standardsApi'
import type { FilterOptions } from '../types/standard'

const EMPTY: FilterOptions = { statuses: [], departments: [], aspects: [], domains: [] }

export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>(EMPTY)

  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(() => setOptions(EMPTY))
  }, [])

  return options
}
