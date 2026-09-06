import { api } from './api'
import type { ListParams, SearchHistoryEntry } from '../types/api'
import type {
  FilterOptions,
  StandardDetail,
  StandardSummary,
  StatsOverview,
} from '../types/standard'

export async function listStandards(params: ListParams = {}): Promise<StandardSummary[]> {
  const { data } = await api.get('/standards', { params })
  return data
}

export async function getStandard(id: number | string): Promise<StandardDetail> {
  const { data } = await api.get(`/standards/${id}`)
  return data
}

export async function getStats(): Promise<StatsOverview> {
  const { data } = await api.get('/standards/stats/overview')
  return data
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const { data } = await api.get('/standards/meta/filters')
  return data
}

export async function getSearchHistory(limit = 50): Promise<SearchHistoryEntry[]> {
  const { data } = await api.get('/search/history', { params: { limit } })
  return data
}
