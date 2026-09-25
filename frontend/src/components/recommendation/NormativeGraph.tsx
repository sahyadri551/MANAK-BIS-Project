import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { Lang } from '../../i18n'
import { labelFor } from '../../i18n/dataLabels'
import type { PdfAnalysisSummary, RecommendationItem } from '../../types/recommendation'

type Props = {
  query: string
  items: RecommendationItem[]
  pdfAnalysis?: PdfAnalysisSummary | null
}

type NodeType = 'spec' | 'requirement' | 'standard' | 'compliance' | 'support'

const NODE_META: Record<NodeType, { labelKey: string; fill: string; stroke: string; text: string }> = {
  spec: { labelKey: 'ng.spec', fill: '#1d4ed8', stroke: '#60a5fa', text: '#eff6ff' },
  requirement: { labelKey: 'ng.requirement', fill: '#b45309', stroke: '#f59e0b', text: '#fffbeb' },
  standard: { labelKey: 'ng.standard', fill: '#15803d', stroke: '#22c55e', text: '#f0fdf4' },
  compliance: { labelKey: 'ng.compliance', fill: '#b91c1c', stroke: '#ef4444', text: '#fef2f2' },
  support: { labelKey: 'ng.support', fill: '#334155', stroke: '#94a3b8', text: '#f1f5f9' },
}

const MAX_COLUMNS = 6
const MIN_SCALE = 0.6
const MAX_SCALE = 3
const NODE_W = 200
const NODE_H = 68
const SPEC_Y = 50
const REQ_Y = 190
const STD_Y = 330
const COMP_Y = 470
const MARGIN = 130
// Minimum horizontal gap between neighbouring node edges so labels never overlap.
const NODE_GAP = 40
const MIN_SPACING = NODE_W + NODE_GAP
const BASE_WIDTH = 1080

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function requirementLabel(item: RecommendationItem, fallback: string, lang: Lang): string {
  const matched = item.matched_requirements?.[0]
  if (matched) return truncate(matched, 40)
  // aspect/department/group are raw backend category values — route them
  // through the same translation dictionary the rest of the app uses for
  // these fields, so the node label follows the selected language too.
  if (item.aspect) return truncate(labelFor('aspects', item.aspect, lang), 40)
  if (item.department) return truncate(labelFor('departments', item.department, lang), 40)
  if (item.group) return truncate(labelFor('groups', item.group, lang), 40)
  return truncate(fallback, 40)
}

// Scheme acronyms (ISI, CRS) are proper names and stay as-is; the words around them are localized.
function complianceLabel(item: RecommendationItem, t: (k: string) => string): string {
  const raw = item.certification_scheme
  if (!raw || raw === 'NONE') return t('ng.noScheme')
  const name = raw.startsWith('ISI') ? 'ISI' : raw === 'HALLMARKING' ? t('ng.hallmarking') : raw.replace(/_/g, ' ')
  const mandatory = item.certification_mandatory ? t('ng.mandatory') : t('ng.voluntary')
  return `${name} · ${mandatory}`
}

function fill(text: string, n: number): string {
  return text.replace('{n}', String(n))
}

// Smooth vertical S-curve between two points — reads as a much more
// deliberate "org chart" connector than a straight line, and its midpoint
// bend gives edges a clear direction as they fan out.
function curvedLink(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
}

// What's currently under the pointer. Hovering a node highlights its whole
// branch (ancestors + descendants); everything else dims.
type HoverKey =
  | { kind: 'spec' }
  | { kind: 'support' }
  | { kind: 'group'; label: string }
  | { kind: 'column'; index: number }
  | null

const DIM_OPACITY = 0.16
const DIM_TEXT_OPACITY = 0.35

export function NormativeGraph({ query, items, pdfAnalysis }: Props) {
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const generalLabel = t('ng.general')
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const [hovered, setHovered] = useState<HoverKey>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })

  const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
  const zoomBy = useCallback((factor: number) => {
    setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale * factor) }))
  }, [])
  const resetView = useCallback(() => setTransform({ scale: 1, x: 0, y: 0 }), [])
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale * factor) }))
  }, [])
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: transform.x, originY: transform.y }
    svgRef.current?.setPointerCapture(e.pointerId)
  }, [transform.x, transform.y])
  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setTransform((prev) => ({ ...prev, x: dragRef.current.originX + dx, y: dragRef.current.originY + dy }))
  }, [])
  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current.dragging = false
    svgRef.current?.releasePointerCapture(e.pointerId)
  }, [])

  const layout = useMemo(() => {
    const trimmed = items.slice(0, MAX_COLUMNS)
    if (!trimmed.length) return null

    // Group by requirement label so items sharing a requirement fan out from one node.
    const buckets = new Map<string, RecommendationItem[]>()
    for (const item of trimmed) {
      const label = requirementLabel(item, generalLabel, lang)
      const list = buckets.get(label) ?? []
      list.push(item)
      buckets.set(label, list)
    }
    const groups = Array.from(buckets.entries()).map(([label, its]) => ({ label, items: its }))

    const columns = groups.flatMap((g) => g.items.map((item) => ({ item, reqLabel: g.label })))
    const count = columns.length
    // Width grows with the column count so nodes always keep at least MIN_SPACING
    // between their centers — fixes nodes/labels overlapping once there are 4+ columns.
    const neededWidth = count > 1 ? 2 * MARGIN + (count - 1) * MIN_SPACING : BASE_WIDTH
    const width = Math.max(BASE_WIDTH, neededWidth)
    const spacing = count > 1 ? (width - 2 * MARGIN) / (count - 1) : 0
    const colX = columns.map((_, i) => (count === 1 ? width / 2 : MARGIN + i * spacing))

    const reqX = new Map<string, number>()
    groups.forEach((g) => {
      const xs = columns.map((c, i) => (c.reqLabel === g.label ? colX[i] : null)).filter((x): x is number => x !== null)
      reqX.set(g.label, xs.reduce((a, b) => a + b, 0) / xs.length)
    })

    const specX = width / 2
    const hasSupport = Boolean(pdfAnalysis)
    const supportX = width - 90

    return { columns, colX, groups, reqX, specX, hasSupport, supportX, width }
  }, [items, pdfAnalysis, generalLabel, lang])

  if (!layout) return null
  const { columns, colX, groups, reqX, specX, hasSupport, supportX, width } = layout

  // Branch-highlight helpers — nothing hovered means everything reads at
  // full strength; hovering any node keeps the root plus that node's whole
  // branch bright and dims the rest.
  const groupOf = (i: number) => columns[i].reqLabel
  const groupActive = (label: string) =>
    !hovered ||
    hovered.kind === 'spec' ||
    (hovered.kind === 'group' && hovered.label === label) ||
    (hovered.kind === 'column' && groupOf(hovered.index) === label)
  const columnActive = (i: number) =>
    !hovered ||
    hovered.kind === 'spec' ||
    (hovered.kind === 'group' && hovered.label === groupOf(i)) ||
    (hovered.kind === 'column' && hovered.index === i)
  const supportActive = !hovered || hovered.kind === 'spec' || hovered.kind === 'support'
  const isHovered = (key: HoverKey) =>
    Boolean(hovered && key && hovered.kind === key.kind &&
      ((key.kind === 'group' && hovered.kind === 'group' && hovered.label === key.label) ||
        (key.kind === 'column' && hovered.kind === 'column' && hovered.index === key.index) ||
        key.kind === 'spec' || key.kind === 'support'))
  const nodeStyle = (active: boolean, hoveredNode: boolean) => ({
    opacity: active ? 1 : DIM_OPACITY,
    filter: hoveredNode ? 'url(#ngNodeGlow)' : undefined,
    transition: 'opacity 180ms ease, filter 180ms ease, transform 180ms ease',
  })
  const edgeStyle = (active: boolean) => ({
    opacity: active ? 1 : DIM_OPACITY,
    transition: 'opacity 180ms ease',
  })

  const supportLines = pdfAnalysis
    ? [
        pdfAnalysis.document_title || pdfAnalysis.file_name,
        pdfAnalysis.detected_sections.length ? `${t('ng.sections')}: ${pdfAnalysis.detected_sections.slice(0, 3).join(', ')}` : null,
        pdfAnalysis.detected_is_numbers.length ? fill(t('ng.isDetected'), pdfAnalysis.detected_is_numbers.length) : null,
      ].filter(Boolean) as string[]
    : []

  return (
    <section className="panel overflow-hidden p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-100">
            <GitBranch className="h-4 w-4 text-accent" />
            {t('ng.title')}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {[NODE_META.spec, NODE_META.requirement, NODE_META.standard, NODE_META.compliance].map((m) => t(m.labelKey)).join(' → ')}
          </p>
        </div>
        <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {fill(t('ng.mapped'), columns.length)}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-hairline bg-base/20">
        <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-2/90 backdrop-blur">
          <button type="button" aria-label={t('ng.zoomIn')} title={t('ng.zoomIn')} onClick={() => zoomBy(1.25)} className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100">
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-px w-full bg-hairline" />
          <button type="button" aria-label={t('ng.zoomOut')} title={t('ng.zoomOut')} onClick={() => zoomBy(0.8)} className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100">
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-px w-full bg-hairline" />
          <button type="button" aria-label={t('ng.reset')} title={t('ng.reset')} onClick={resetView} className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} 560`}
          preserveAspectRatio="xMidYMid meet"
          className="h-[520px] w-full cursor-grab touch-none active:cursor-grabbing"
          role="img"
          aria-label={t('ng.aria')}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Soft glow applied only to the node directly under the pointer,
                so it reads as the focal point of its highlighted branch. */}
            <filter id="ngNodeGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`} style={{ transformOrigin: `${width / 2}px 280px` }}>

            {/* spec -> requirement edges */}
            {groups.map((g) => (
              <path
                key={`spec-req-${g.label}`}
                d={curvedLink(specX, SPEC_Y + NODE_H / 2, reqX.get(g.label) ?? specX, REQ_Y - NODE_H / 2)}
                fill="none"
                stroke={NODE_META.requirement.stroke}
                strokeWidth={groupActive(g.label) ? 2 : 1.5}
                style={edgeStyle(groupActive(g.label))}
              />
            ))}
            {groups.length > 0 && (
              <text x={(specX + (reqX.get(groups[0].label) ?? specX)) / 2 - 40} y={(SPEC_Y + REQ_Y) / 2} fontSize="9" fill="#94a3b8" style={edgeStyle(groupActive(groups[0].label))}>{t('ng.requires')}</text>
            )}

            {/* requirement -> standard edges */}
            {columns.map((c, i) => (
              <path
                key={`req-std-${i}`}
                d={curvedLink(reqX.get(c.reqLabel) ?? specX, REQ_Y + NODE_H / 2, colX[i], STD_Y - NODE_H / 2)}
                fill="none"
                stroke={NODE_META.standard.stroke}
                strokeWidth={columnActive(i) ? 2 : 1.5}
                style={edgeStyle(columnActive(i))}
              />
            ))}
            {columns.length > 0 && (
              <text x={colX[0] + 8} y={(REQ_Y + STD_Y) / 2} fontSize="9" fill="#94a3b8" style={edgeStyle(columnActive(0))}>{t('ng.mappedTo')}</text>
            )}

            {/* standard -> compliance edges */}
            {columns.map((_, i) => (
              <path
                key={`std-comp-${i}`}
                d={curvedLink(colX[i], STD_Y + NODE_H / 2, colX[i], COMP_Y - NODE_H / 2)}
                fill="none"
                stroke={NODE_META.compliance.stroke}
                strokeWidth={columnActive(i) ? 2 : 1.5}
                style={edgeStyle(columnActive(i))}
              />
            ))}
            {columns.length > 0 && (
              <text x={colX[0] + 8} y={(STD_Y + COMP_Y) / 2} fontSize="9" fill="#94a3b8" style={edgeStyle(columnActive(0))}>{t('ng.leadsTo')}</text>
            )}

            {/* spec -> support dashed edge */}
            {hasSupport && (
              <>
                <line x1={specX + NODE_W / 2} y1={SPEC_Y} x2={supportX - NODE_W / 2} y2={SPEC_Y} stroke={NODE_META.support.stroke} strokeWidth={supportActive ? 2 : 1.5} strokeDasharray="5 4" style={edgeStyle(supportActive)} />
                <text x={(specX + supportX) / 2 - 30} y={SPEC_Y - 8} fontSize="9" fill="#94a3b8" style={edgeStyle(supportActive)}>{t('ng.references')}</text>
              </>
            )}

            {/* spec node */}
            <g
              onMouseEnter={() => setHovered({ kind: 'spec' })}
              onMouseLeave={() => setHovered(null)}
              style={{ ...nodeStyle(true, isHovered({ kind: 'spec' })), transformOrigin: `${specX}px ${SPEC_Y}px`, transform: isHovered({ kind: 'spec' }) ? 'scale(1.04)' : undefined }}
            >
              <rect x={specX - NODE_W / 2} y={SPEC_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.spec.fill} fillOpacity="0.9" stroke={NODE_META.spec.stroke} strokeWidth="2" />
              <text x={specX} y={SPEC_Y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={NODE_META.spec.text}>{t(NODE_META.spec.labelKey)}</text>
              <text x={specX} y={SPEC_Y + 12} textAnchor="middle" fontSize="8" fill={NODE_META.spec.text} opacity="0.85">{truncate(query, 34)}</text>
              <title>{query}</title>
            </g>

            {/* support node */}
            {hasSupport && (
              <g
                onMouseEnter={() => setHovered({ kind: 'support' })}
                onMouseLeave={() => setHovered(null)}
                style={{ ...nodeStyle(supportActive, isHovered({ kind: 'support' })), transformOrigin: `${supportX}px ${SPEC_Y}px`, transform: isHovered({ kind: 'support' }) ? 'scale(1.04)' : undefined }}
              >
                <rect x={supportX - NODE_W / 2} y={SPEC_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.support.fill} fillOpacity="0.9" stroke={NODE_META.support.stroke} strokeWidth="2" />
                <text x={supportX} y={SPEC_Y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={NODE_META.support.text}>{t(NODE_META.support.labelKey)}</text>
                <text x={supportX} y={SPEC_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.support.text} opacity="0.85">{truncate(supportLines[0] || t('ng.fromPdf'), 30)}</text>
                <title>{supportLines.join(' · ') || t('ng.supportFallback')}</title>
              </g>
            )}

            {/* requirement nodes */}
            {groups.map((g) => {
              const x = reqX.get(g.label) ?? specX
              const active = groupActive(g.label)
              const hoveredNode = isHovered({ kind: 'group', label: g.label })
              return (
                <g
                  key={`req-node-${g.label}`}
                  onMouseEnter={() => setHovered({ kind: 'group', label: g.label })}
                  onMouseLeave={() => setHovered(null)}
                  style={{ ...nodeStyle(active, hoveredNode), transformOrigin: `${x}px ${REQ_Y}px`, transform: hoveredNode ? 'scale(1.04)' : undefined }}
                >
                  <rect x={x - NODE_W / 2} y={REQ_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.requirement.fill} fillOpacity="0.9" stroke={NODE_META.requirement.stroke} strokeWidth="2" />
                  <text x={x} y={REQ_Y - 6} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={NODE_META.requirement.text}>{truncate(g.label, 26)}</text>
                  <text x={x} y={REQ_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.requirement.text} opacity="0.85">{fill(t('ng.count'), g.items.length)}</text>
                  <title>{g.label}</title>
                </g>
              )
            })}

            {/* standard nodes */}
            {columns.map(({ item }, i) => {
              const active = columnActive(i)
              const hoveredNode = isHovered({ kind: 'column', index: i })
              return (
                <g
                  key={`std-node-${item.standard_id}`}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer outline-none"
                  onClick={() => navigate(`/standards/${item.standard_id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/standards/${item.standard_id}`) } }}
                  onMouseEnter={() => setHovered({ kind: 'column', index: i })}
                  onMouseLeave={() => setHovered(null)}
                  style={{ ...nodeStyle(active, hoveredNode), transformOrigin: `${colX[i]}px ${STD_Y}px`, transform: hoveredNode ? 'scale(1.04)' : undefined }}
                >
                  <rect x={colX[i] - NODE_W / 2} y={STD_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.standard.fill} fillOpacity="0.9" stroke={NODE_META.standard.stroke} strokeWidth="2" />
                  <text x={colX[i]} y={STD_Y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={NODE_META.standard.text}>{item.is_number}</text>
                  <text x={colX[i]} y={STD_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.standard.text} opacity="0.85">{truncate(item.title, 28)}</text>
                  <title>{`${item.is_number} — ${item.title}`}</title>
                </g>
              )
            })}

            {/* compliance nodes */}
            {columns.map(({ item }, i) => {
              const active = columnActive(i)
              const hoveredNode = isHovered({ kind: 'column', index: i })
              return (
                <g
                  key={`comp-node-${item.standard_id}`}
                  onMouseEnter={() => setHovered({ kind: 'column', index: i })}
                  onMouseLeave={() => setHovered(null)}
                  style={{ ...nodeStyle(active, hoveredNode), transformOrigin: `${colX[i]}px ${COMP_Y}px`, transform: hoveredNode ? 'scale(1.04)' : undefined }}
                >
                  <rect x={colX[i] - NODE_W / 2} y={COMP_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.compliance.fill} fillOpacity="0.9" stroke={NODE_META.compliance.stroke} strokeWidth="2" />
                  <text x={colX[i]} y={COMP_Y - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill={NODE_META.compliance.text}>{t('ng.complianceShort')}</text>
                  <text x={colX[i]} y={COMP_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.compliance.text} opacity="0.85">{truncate(complianceLabel(item, t), 30)}</text>
                  <title>{complianceLabel(item, t)}</title>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {items.length > MAX_COLUMNS && (
        <p className="mt-2 text-[10px] text-slate-600">{fill(t('ng.topNote'), MAX_COLUMNS)}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">
        {(Object.keys(NODE_META) as NodeType[])
          .filter((key) => key !== 'support' || hasSupport)
          .map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_META[key].stroke }} />
              <span>{t(NODE_META[key].labelKey)}</span>
            </div>
          ))}
        <span className="ml-auto text-slate-600">{t('ng.hint')}</span>
      </div>
    </section>
  )
}