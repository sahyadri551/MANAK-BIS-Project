import type { RelatedStandard, StandardStatus } from './standard'

export interface RecommendationFilters {
  status: string | null
  department: string | null
  aspect: string | null
}

export interface RecommendRequest {
  query: string
  document_name: string | null
  filters: RecommendationFilters
}

export interface RecommendationItem {
  standard_id: number
  is_number: string
  title: string
  score: number
  status: StandardStatus
  department: string | null
  aspect: string | null
  matched_requirements: string[]
  reason: string
  evidence: unknown[]
  related_standards: RelatedStandard[]
}

export interface RecommendResponse {
  request_id: string
  query: string
  recommendations: RecommendationItem[]
  similarity_map: SimilarityMapPoint[]
}

export interface SimilarityMapPoint {
  standard_id: number
  is_number: string
  title: string
  x: number
  y: number
  score: number
  is_query: boolean
}
