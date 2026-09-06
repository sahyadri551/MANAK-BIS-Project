import { api } from './api'
import type { RecommendRequest, RecommendResponse } from '../types/recommendation'

export async function getRecommendations(body: RecommendRequest): Promise<RecommendResponse> {
  const { data } = await api.post('/recommend', body)
  return data
}
