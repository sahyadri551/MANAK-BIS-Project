export type StandardStatus =
  | 'Active'
  | 'Withdrawn'
  | 'Draft'
  | 'Superseded'

export type Domain =
  | 'cement'
  | 'textiles'
  | 'electronics'
  | 'food_safety'
  | string

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
  short_title: string | null

  status: StandardStatus

  department: string | null
  department_name: string | null
  department_alias: string | null

  aspect: string | null
  domain: Domain | null

  group: string | null
  sub_group: string | null
  sub_sub_group: string | null

  year: number | null

  published_on: string | null
  valid_upto: string | null

  amendment_count: number

  degree_of_equivalence: string | null

  ministry: string | null
  committee_name: string | null
  certification: string | null
}

export interface StandardDetail extends StandardSummary {
  // Content
  description: string
  scope: string
  keywords: string[]
  requirements: string[]

  // Publication / validity
  reaffirmation_year: number | null
  review_on: string | null

  // Revision
  no_of_revision: number
  latest_version: string | null
  standard_base: string | null

  // Technical
  ics_code: string | null
  language: string | null

  // Organization
  member_secretary: string | null

  // Group
  group_classification: string | null

  // Certification / policy
  has_qco_gazette: string | null

  // SDG
  sdg_goals: unknown[]

  // References
  cross_references: unknown[]
  referenced_by: unknown[]
  supersedes: unknown[]
  superseded_by: unknown[]

  // Hindi / i18n
  title_hi: string | null
  scope_hi: string | null
  requirements_hi: unknown[]
  i18n: Record<string, unknown> | null

  // Source information
  source_standard_id: number | null
  source_standard_enc_id: string | null
  source_department_id: number | null
  source_committee_id: number | null
  raw_is_status: number | null

  // Timestamps
  created_at: string | null
  updated_at: string | null

  // Relationships
  related_standards: RelatedStandard[]
}

export interface StatsOverview {
  total: number
  by_status: Record<string, number>
  by_domain: Record<string, number>
  by_aspect: Record<string, number>
  by_department: Record<string, number>
}

export interface FilterOptions {
  statuses: string[]
  departments: string[]
  aspects: string[]
  domains: string[]
  groups: string[]
  sub_groups: string[]
  sub_sub_groups: string[]
  ministries: string[]
  committees: string[]
}