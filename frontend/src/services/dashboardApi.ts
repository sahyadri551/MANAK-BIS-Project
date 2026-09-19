import { api } from './api'

export interface CatalogStatus { total_standards: number; provider: string; embedding_model: string; last_updated: string | null }

export interface DashboardData {
  stats: {
    total: number
    active: number
    focus_domains: number
    recommendations: number
    trends: { total: string; active: string; recommendations: string }
  }
  coverage: { department: string; label: string; count: number }[]
  recent: {
    query: string
    is_number: string
    title: string
    relevance: number
    status: string
    created_at: string | null
  }[]
  system_health: { name: string; detail: string; status: string; latency_ms: number }[]
  ai_performance: { metric: string; value: number | null }[]
  catalog_status: CatalogStatus
}

export async function getDashboard(lang: string): Promise<DashboardData> {
  const { data } = await api.get('/dashboard', { params: { lang } })
  return data
}

export async function getCatalogStatus(): Promise<CatalogStatus> { const { data } = await api.get("/dashboard/catalog-status"); return data as CatalogStatus }
