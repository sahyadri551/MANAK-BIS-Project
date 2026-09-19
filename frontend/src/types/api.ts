import type { RecommendationFilters } from './recommendation'

export interface ApiError {
  detail: string
}

export interface SearchHistoryEntry {
  id: number
  request_id: string
  query: string
  document_name: string | null
  filters: RecommendationFilters
  result_count: number
  created_at: string
}

export type ListParams = {
  status?: string
  department?: string
  aspect?: string
  domain?: string
  group?: string
  ministry?: string
  search?: string
  limit?: number
  lang?: string
}
