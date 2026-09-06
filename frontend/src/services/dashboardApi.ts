import { api } from './api'

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
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get('/dashboard')
  return data
}
