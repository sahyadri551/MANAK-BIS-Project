import { api } from './api'
import type { SummaryRequest, SummaryResponse } from '../types/recommendation'

export async function getSummary(body: SummaryRequest): Promise<SummaryResponse> {
  const { data } = await api.post('/summary', body)
  return data
}
