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
  group: string | null
  published_on: string | null
  valid_upto: string | null
  no_of_revision: number
  amendment_count: number
  reaffirmation_year: number | null
  matched_requirements: string[]
  reason: string
  evidence: unknown[]
  related_standards: RelatedStandard[]
  allied_standards: RelatedStandard[]
}

export interface PdfPageSummary {
  page: number
  characters: number
  preview: string
}

export interface PdfAnalysisSummary {
  file_name: string
  page_count: number
  readable_pages: number
  character_count: number
  word_count: number
  detected_is_numbers: string[]
  detected_sections: string[]
  detected_references: string[]
  document_title: string | null
  document_subject: string | null
  pages: PdfPageSummary[]
  extraction_warnings: string[]
}

export interface RecommendResponse {
  request_id: string
  query: string
  recommendations: RecommendationItem[]
  similarity_map: SimilarityMapPoint[]
  pdf_analysis?: PdfAnalysisSummary | null
}

export type SimilarityMapPoint = {
  standard_id: number
  is_number: string
  title: string
  x: number
  y: number
  score: number
  is_query: boolean
}
