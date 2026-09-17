import { api } from './api'
import type { ListParams, SearchHistoryEntry } from '../types/api'
import type {
  FilterOptions,
  StandardDetail,
  StandardSummary,
  StatsOverview,
} from '../types/standard'

const CACHE_TTL = 60_000

type CacheEntry<T> = {
  data: T
  fetchedAt: number
}

let statsCache: CacheEntry<StatsOverview> | null = null
let statsRequest: Promise<StatsOverview> | null = null
const historyCache = new Map<number, CacheEntry<SearchHistoryEntry[]>>()
const historyRequests = new Map<number, Promise<SearchHistoryEntry[]>>()

export async function listStandards(params: ListParams = {}): Promise<StandardSummary[]> {
  const { data } = await api.get('/standards', { params })
  return data
}

export async function getStandard(id: number | string): Promise<StandardDetail> {
  const { data } = await api.get(`/standards/${id}`)
  return data
}

export async function downloadStandardPdf(id: number | string): Promise<void> {
  const response = await api.get(`/standards/${id}/pdf`, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `BIS_Standard_Report_${String(id)}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

async function refreshStats(): Promise<StatsOverview> {
  if (statsRequest) return statsRequest
  statsRequest = api
    .get('/standards/stats/overview')
    .then(({ data }) => {
      statsCache = { data, fetchedAt: Date.now() }
      return data as StatsOverview
    })
    .finally(() => {
      statsRequest = null
    })
  return statsRequest
}

export function getCachedStats(): StatsOverview | null {
  return statsCache?.data ?? null
}

export async function getStats(options: { force?: boolean } = {}): Promise<StatsOverview> {
  const cached = statsCache
  if (!options.force && cached) {
    if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data
    void refreshStats()
    return cached.data
  }
  return refreshStats()
}

async function refreshSearchHistory(limit: number): Promise<SearchHistoryEntry[]> {
  const pending = historyRequests.get(limit)
  if (pending) return pending
  const request = api
    .get('/search/history', { params: { limit } })
    .then(({ data }) => {
      historyCache.set(limit, { data, fetchedAt: Date.now() })
      return data as SearchHistoryEntry[]
    })
    .finally(() => {
      historyRequests.delete(limit)
    })
  historyRequests.set(limit, request)
  return request
}

export function getCachedSearchHistory(limit = 50): SearchHistoryEntry[] | null {
  return historyCache.get(limit)?.data ?? null
}

export async function getSearchHistory(limit = 50, options: { force?: boolean } = {}): Promise<SearchHistoryEntry[]> {
  const cached = historyCache.get(limit)
  if (!options.force && cached) {
    if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data
    void refreshSearchHistory(limit)
    return cached.data
  }
  return refreshSearchHistory(limit)
}

export function invalidateSearchHistory(): void {
  historyCache.clear()
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const { data } = await api.get('/standards/meta/filters')
  return data
}
