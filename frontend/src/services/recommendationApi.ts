import { api } from './api'
import type { RecommendRequest, RecommendResponse } from '../types/recommendation'

export async function getRecommendations(body: RecommendRequest, lang: string): Promise<RecommendResponse> {
  const { data } = await api.post('/recommend', body, { params: { lang } })
  return data
}
