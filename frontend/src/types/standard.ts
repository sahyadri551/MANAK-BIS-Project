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

export type AlliedStandardCategory =
  | 'normative_reference'
  | 'test_method'
  | 'terminology'
  | 'safety'
  | 'installation'
  | 'product_spec'
  | 'supersedes'
  | 'superseded_by'

export interface RelatedStandard {
  id: number
  is_number: string
  title: string
  status: StandardStatus
  relationship_type: string
  category: AlliedStandardCategory | null
}

export type AlliedStandards = Partial<Record<AlliedStandardCategory, RelatedStandard[]>>

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
  certification_scheme: 'ISI_MANDATORY' | 'ISI_VOLUNTARY' | 'CRS' | 'HALLMARKING' | 'NONE'
  certification_mandatory: boolean
}

export interface StandardDetail extends StandardSummary {
  description: string
  scope: string
  keywords: string[]
  requirements: string[]
  reaffirmation_year: number | null
  review_on: string | null
  no_of_revision: number
  latest_version: string | null
  standard_base: string | null
  ics_code: string | null
  language: string | null
  member_secretary: string | null
  group_classification: string | null
  has_qco_gazette: string | null
  sdg_goals: unknown[]
  cross_references: unknown[]
  referenced_by: unknown[]
  supersedes: unknown[]
  superseded_by: unknown[]
  title_hi: string | null
  scope_hi: string | null
  requirements_hi: unknown[]
  i18n: Record<string, unknown> | null
  source_standard_id: number | null
  source_standard_enc_id: string | null
  source_department_id: number | null
  source_committee_id: number | null
  raw_is_status: number | null
  created_at: string | null
  updated_at: string | null
  related_standards: RelatedStandard[]
  allied_standards: RelatedStandard[]
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
