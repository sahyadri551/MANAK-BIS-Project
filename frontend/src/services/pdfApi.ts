import { api } from './api'
import type { RecommendationFilters, RecommendResponse } from '../types/recommendation'

export async function analyzePdf(file: File, filters: RecommendationFilters): Promise<RecommendResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<RecommendResponse>('/pdf/analyze', formData, {
    params: {
      status: filters.status ?? undefined,
      department: filters.department ?? undefined,
      aspect: filters.aspect ?? undefined,
    },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
