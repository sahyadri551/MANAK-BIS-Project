export type StandardStatus = 'Active' | 'Withdrawn' | 'Draft' | 'Superseded'

export type Domain = 'cement' | 'textiles' | 'electronics' | 'food_safety' | string

export interface RelatedStandard {
  id: number
  is_number: string
  title: string
  status: StandardStatus
  relationship_type: string
}

export interface StandardSummary {
  id: number
  is_number: string
  title: string
  status: StandardStatus
  department: string | null
  aspect: string | null
  domain: Domain | null
}

export interface StandardDetail extends StandardSummary {
  description: string
  scope: string
  keywords: string[]
  requirements: string[]
  year: number | null
  reaffirmation_year: number | null
  created_at: string | null
  related_standards: RelatedStandard[]
}

export interface StatsOverview {
  total: number
  by_status: Record<string, number>
  by_domain: Record<string, number>
  by_department: Record<string, number>
}

export interface FilterOptions {
  statuses: string[]
  departments: string[]
  aspects: string[]
  domains: string[]
}
