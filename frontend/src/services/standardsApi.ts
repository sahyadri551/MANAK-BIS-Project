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

const statsCache = new Map<string, CacheEntry<StatsOverview>>()
const statsRequests = new Map<string, Promise<StatsOverview>>()
const standardsCache = new Map<string, CacheEntry<StandardSummary[]>>()
const standardsRequests = new Map<string, Promise<StandardSummary[]>>()
const historyCache = new Map<number, CacheEntry<SearchHistoryEntry[]>>()
const historyRequests = new Map<number, Promise<SearchHistoryEntry[]>>()

function standardsCacheKey(params: ListParams): string {
  return JSON.stringify({
    status: params.status ?? null,
    department: params.department ?? null,
    aspect: params.aspect ?? null,
    domain: params.domain ?? null,
    search: params.search ?? null,
    limit: params.limit ?? null,
    lang: params.lang ?? null,
  })
}

async function refreshStandards(params: ListParams, key: string): Promise<StandardSummary[]> {
  const pending = standardsRequests.get(key)
  if (pending) return pending

  const request = api
    .get('/standards', { params })
    .then(({ data }) => {
      standardsCache.set(key, { data, fetchedAt: Date.now() })
      return data as StandardSummary[]
    })
    .finally(() => {
      standardsRequests.delete(key)
    })

  standardsRequests.set(key, request)
  return request
}

export async function listStandards(params: ListParams = {}, options: { force?: boolean } = {}): Promise<StandardSummary[]> {
  const key = standardsCacheKey(params)
  const cached = standardsCache.get(key)
  if (!options.force && cached) {
    if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data
    void refreshStandards(params, key)
    return cached.data
  }
  return refreshStandards(params, key)
}

export function getCachedStandards(params: ListParams = {}): StandardSummary[] | null {
  return standardsCache.get(standardsCacheKey(params))?.data ?? null
}

export function invalidateStandards(): void {
  standardsCache.clear()
}

export async function getStandard(id: number | string, lang: string): Promise<StandardDetail> {
  const { data } = await api.get(`/standards/${id}`, { params: { lang } })
  return data
}

export async function downloadStandardPdf(id: number | string, lang: string): Promise<void> {
  const response = await api.get(`/standards/${id}/pdf`, { responseType: 'blob', params: { lang } })
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

async function refreshStats(lang: string): Promise<StatsOverview> {
  const pending = statsRequests.get(lang)
  if (pending) return pending
  const request = api
    .get('/standards/stats/overview', { params: { lang } })
    .then(({ data }) => {
      statsCache.set(lang, { data, fetchedAt: Date.now() })
      return data as StatsOverview
    })
    .finally(() => {
      statsRequests.delete(lang)
    })
  statsRequests.set(lang, request)
  return request
}

export function getCachedStats(lang = 'en'): StatsOverview | null {
  return statsCache.get(lang)?.data ?? null
}

export async function getStats(lang: string, options: { force?: boolean } = {}): Promise<StatsOverview> {
  const cached = statsCache.get(lang)
  if (!options.force && cached) {
    if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data
    void refreshStats(lang)
    return cached.data
  }
  return refreshStats(lang)
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

export async function getFilterOptions(lang: string): Promise<FilterOptions> {
  const { data } = await api.get('/standards/meta/filters', { params: { lang } })
  return data
}
