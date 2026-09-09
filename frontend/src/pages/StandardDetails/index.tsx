import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Flag,
  Globe2,
  Hash,
  Layers,
  ListChecks,
  Network,
  ScrollText,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react'

import { StatusBadge } from '../../components/common/StatusBadge'
import { Loader } from '../../components/common/Loader'
import { EmptyState } from '../../components/common/EmptyState'
import { StandardCard } from '../../components/standards/StandardCard'
import {
  downloadStandardPdf,
  getStandard,
} from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { StandardDetail } from '../../types/standard'

function valueOrDash(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function formatList(values: unknown[] | null | undefined): string[] {
  if (!Array.isArray(values)) return []

  return values
    .map((value) => {
      if (typeof value === 'string') return value

      if (
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return String(value)
      }

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>

        const preferredKeys = [
          'name',
          'title',
          'is_number',
          'standard',
          'id',
          'value',
        ]

        for (const key of preferredKeys) {
          if (
            record[key] !== null &&
            record[key] !== undefined &&
            record[key] !== ''
          ) {
            return String(record[key])
          }
        }

        return JSON.stringify(value)
      }

      return ''
    })
    .filter(Boolean)
}

function formatDate(value: string | null): string {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function Attribute({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-hairline bg-base/30 p-4">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>

      <div className="break-words text-sm font-medium text-slate-200">
        {value}
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText
  title: string
  children: ReactNode
}) {
  return (
    <section className="panel p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-slate-100">
        <Icon className="h-4 w-4 text-accent" />
        {title}
      </h2>

      {children}
    </section>
  )
}

function MetadataGrid({
  items,
}: {
  items: Array<{
    icon: typeof Building2
    label: string
    value: string
  }>
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Attribute
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  )
}

function ListBlock({
  values,
  emptyText = 'No information available',
}: {
  values: string[]
  emptyText?: string
}) {
  if (values.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {emptyText}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="rounded-lg border border-hairline bg-surface-2/50 px-3 py-1.5 text-sm text-slate-300"
        >
          {value}
        </span>
      ))}
    </div>
  )
}

export default function StandardDetails() {
  const { id } = useParams()
  const { t, lang } = useI18n()

  const [standard, setStandard] =
    useState<StandardDetail | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [downloading, setDownloading] =
    useState(false)

  const [notFound, setNotFound] =
    useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)

    getStandard(id!)
      .then(setStandard)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id, lang])

  async function handleDownloadPdf() {
    if (!id || downloading) return

    try {
      setDownloading(true)
      await downloadStandardPdf(id)
    } catch (error) {
      console.error('Failed to generate PDF report', error)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  if (notFound || !standard) {
    return (
      <EmptyState
        icon={ScrollText}
        title={t('details.notFound')}
        description={t('details.notFoundDesc')}
      />
    )
  }

  const department =
    standard.department_name ||
    standard.department ||
    '—'

  const sdgGoals = formatList(standard.sdg_goals)
  const crossReferences = formatList(standard.cross_references)
  const referencedBy = formatList(standard.referenced_by)
  const supersedes = formatList(standard.supersedes)
  const supersededBy = formatList(standard.superseded_by)

  const requirements = standard.requirements || []
  const keywords = standard.keywords || []

  return (
    <div
      data-testid="standard-details-container"
      className="mx-auto max-w-6xl space-y-6"
    >
      {/* Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/recommendation"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('details.back')}
        </Link>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Generating PDF...' : 'Generate PDF Report'}
        </button>
      </div>

      {/* Hero */}
      <div className="panel animate-scale-in overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5 font-mono text-lg font-bold text-accent">
              {standard.is_number}
            </span>

            <StatusBadge status={standard.status} />

            {standard.domain && (
              <span className="rounded-full border border-hairline bg-surface-2 px-3 py-1 text-xs text-slate-400">
                {standard.domain}
              </span>
            )}

            {standard.latest_version && (
              <span className="rounded-full border border-hairline bg-surface-2 px-3 py-1 text-xs text-slate-400">
                Latest: {standard.latest_version}
              </span>
            )}
          </div>

          <h1 className="mt-4 max-w-5xl font-display text-2xl font-bold leading-tight text-slate-100 sm:text-3xl">
            {standard.title}
          </h1>

          {standard.short_title && (
            <p className="mt-2 text-sm text-slate-500">
              {standard.short_title}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Attribute
              icon={Building2}
              label="Department"
              value={department}
            />

            <Attribute
              icon={Layers}
              label="Aspect"
              value={valueOrDash(standard.aspect)}
            />

            <Attribute
              icon={CalendarClock}
              label="Year"
              value={
                standard.year
                  ? String(standard.year)
                  : '—'
              }
            />

            <Attribute
              icon={CalendarClock}
              label="Reaffirmation Year"
              value={
                standard.reaffirmation_year
                  ? String(standard.reaffirmation_year)
                  : '—'
              }
            />
          </div>
        </div>
      </div>

      {/* Classification */}
      <Section icon={Layers} title="Classification">
        <MetadataGrid
          items={[
            {
              icon: Layers,
              label: 'Group Classification',
              value: valueOrDash(
                standard.group_classification,
              ),
            },
            {
              icon: Layers,
              label: 'Group',
              value: valueOrDash(
                standard.group,
              ),
            },
            {
              icon: Layers,
              label: 'Sub Group',
              value: valueOrDash(
                standard.sub_group,
              ),
            },
            {
              icon: Layers,
              label: 'Sub Sub Group',
              value: valueOrDash(
                standard.sub_sub_group,
              ),
            },
            {
              icon: Globe2,
              label: 'Language',
              value: valueOrDash(
                standard.language,
              ),
            },
            {
              icon: Hash,
              label: 'ICS Code',
              value: valueOrDash(
                standard.ics_code,
              ),
            },
          ]}
        />
      </Section>

      {/* Publication / validity */}
      <Section
        icon={CalendarClock}
        title="Publication & Validity"
      >
        <MetadataGrid
          items={[
            {
              icon: CalendarClock,
              label: 'Published On',
              value: formatDate(
                standard.published_on,
              ),
            },
            {
              icon: CalendarClock,
              label: 'Valid Upto',
              value: formatDate(
                standard.valid_upto,
              ),
            },
            {
              icon: CalendarClock,
              label: 'Review On',
              value: formatDate(
                standard.review_on,
              ),
            },
            {
              icon: CheckCircle2,
              label: 'Reaffirmation Year',
              value: valueOrDash(
                standard.reaffirmation_year,
              ),
            },
            {
              icon: Network,
              label: 'Standard Base',
              value: valueOrDash(
                standard.standard_base,
              ),
            },
            {
              icon: ScrollText,
              label: 'Latest Version',
              value: valueOrDash(
                standard.latest_version,
              ),
            },
          ]}
        />
      </Section>

      {/* Revision / amendment */}
      <Section
        icon={ScrollText}
        title="Revision & Amendments"
      >
        <MetadataGrid
          items={[
            {
              icon: ScrollText,
              label: 'No. of Revision',
              value:
                standard.no_of_revision > 0
                  ? String(
                      standard.no_of_revision,
                    )
                  : '—',
            },
            {
              icon: ScrollText,
              label: 'Amendment Count',
              value:
                standard.amendment_count > 0
                  ? String(
                      standard.amendment_count,
                    )
                  : '—',
            },
            {
              icon: ShieldCheck,
              label: 'Degree of Equivalence',
              value: valueOrDash(
                standard.degree_of_equivalence,
              ),
            },
          ]}
        />
      </Section>

      {/* Organization */}
      <Section
        icon={Building2}
        title="Organization"
      >
        <MetadataGrid
          items={[
            {
              icon: Building2,
              label: 'Department',
              value: department,
            },
            {
              icon: Building2,
              label: 'Ministry',
              value: valueOrDash(
                standard.ministry,
              ),
            },
            {
              icon: Users,
              label: 'Committee',
              value: valueOrDash(
                standard.committee_name,
              ),
            },
            {
              icon: Users,
              label: 'Member Secretary',
              value: valueOrDash(
                standard.member_secretary,
              ),
            },
            {
              icon: Tag,
              label: 'Department Alias',
              value: valueOrDash(
                standard.department_alias,
              ),
            },
          ]}
        />
      </Section>

      {/* Certification / QCO */}
      <Section
        icon={ShieldCheck}
        title="Certification & Policy"
      >
        <MetadataGrid
          items={[
            {
              icon: ShieldCheck,
              label: 'Certification',
              value: valueOrDash(
                standard.certification,
              ),
            },
            {
              icon: CheckCircle2,
              label: 'QCO Gazette',
              value: valueOrDash(
                standard.has_qco_gazette,
              ),
            },
          ]}
        />
      </Section>

      {/* Description */}
      {standard.description && (
        <Section icon={FileText} title="Description">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
            {standard.description}
          </p>
        </Section>
      )}

      {/* Scope */}
      {standard.scope && (
        <Section
          icon={FileText}
          title={t('details.scope')}
        >
          <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
            {standard.scope}
          </p>
        </Section>
      )}

      {/* Requirements */}
      <Section
        icon={ListChecks}
        title={t('details.keyReq')}
      >
        {requirements.length > 0 ? (
          <ol className="space-y-3">
            {requirements.map(
              (requirement, index) => (
                <li
                  key={`${requirement}-${index}`}
                  className="flex gap-3 text-sm leading-6 text-slate-300"
                >
                  <span className="mt-0.5 shrink-0 font-mono text-xs font-semibold text-accent">
                    {String(index + 1).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <span>{requirement}</span>
                </li>
              ),
            )}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">
            No requirements available
          </p>
        )}
      </Section>

      {/* Keywords */}
      {keywords.length > 0 && (
        <Section icon={Tag} title="Keywords">
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-lg border border-hairline bg-surface-2/50 px-3 py-1.5 text-xs text-slate-400"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* SDG */}
      <Section icon={Flag} title="SDG Goals">
        <ListBlock values={sdgGoals} />
      </Section>

      {/* References */}
      <Section
        icon={Network}
        title="References & Relationships"
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Cross References
            </h3>
            <ListBlock values={crossReferences} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Referenced By
            </h3>
            <ListBlock values={referencedBy} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Supersedes
            </h3>
            <ListBlock values={supersedes} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              Superseded By
            </h3>
            <ListBlock values={supersededBy} />
          </div>
        </div>
      </Section>

      {/* Hindi / i18n */}
      {(standard.title_hi ||
        standard.scope_hi ||
        standard.requirements_hi.length > 0) && (
        <Section
          icon={Globe2}
          title="Hindi / Internationalization"
        >
          <div className="space-y-5">
            {standard.title_hi && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">
                  Hindi Title
                </h3>

                <p className="text-sm leading-6 text-slate-300">
                  {standard.title_hi}
                </p>
              </div>
            )}

            {standard.scope_hi && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">
                  Hindi Scope
                </h3>

                <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
                  {standard.scope_hi}
                </p>
              </div>
            )}

            {standard.requirements_hi.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">
                  Hindi Requirements
                </h3>

                <ListBlock
                  values={formatList(
                    standard.requirements_hi,
                  )}
                />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Source information */}
      <Section
        icon={Hash}
        title="Source Information"
      >
        <MetadataGrid
          items={[
            {
              icon: Hash,
              label: 'Source Standard ID',
              value: valueOrDash(
                standard.source_standard_id,
              ),
            },
            {
              icon: Hash,
              label: 'Source Standard Enc ID',
              value: valueOrDash(
                standard.source_standard_enc_id,
              ),
            },
            {
              icon: Hash,
              label: 'Source Department ID',
              value: valueOrDash(
                standard.source_department_id,
              ),
            },
            {
              icon: Hash,
              label: 'Source Committee ID',
              value: valueOrDash(
                standard.source_committee_id,
              ),
            },
            {
              icon: Hash,
              label: 'Raw IS Status',
              value: valueOrDash(
                standard.raw_is_status,
              ),
            },
          ]}
        />
      </Section>

      {/* Related standards */}
      {standard.related_standards.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-slate-100">
            {t('details.related')}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {standard.related_standards.map(
              (related) => (
                <StandardCard
                  key={related.id}
                  standard={related}
                />
              ),
            )}
          </div>
        </section>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-4 pb-4 text-xs text-slate-600">
        <span>
          Created:{' '}
          {formatDate(standard.created_at)}
        </span>

        <span>
          Updated:{' '}
          {formatDate(standard.updated_at)}
        </span>
      </div>
    </div>
  )
}
