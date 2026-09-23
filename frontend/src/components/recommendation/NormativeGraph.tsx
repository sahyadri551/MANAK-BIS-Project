import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { PdfAnalysisSummary, RecommendationItem } from '../../types/recommendation'

type Props = {
  query: string
  items: RecommendationItem[]
  pdfAnalysis?: PdfAnalysisSummary | null
}

type NodeType = 'spec' | 'requirement' | 'standard' | 'compliance' | 'support'

const NODE_META: Record<NodeType, { label: string; fill: string; stroke: string; text: string }> = {
  spec: { label: 'Procurement Specification', fill: '#1d4ed8', stroke: '#60a5fa', text: '#eff6ff' },
  requirement: { label: 'Requirement', fill: '#b45309', stroke: '#f59e0b', text: '#fffbeb' },
  standard: { label: 'Indian Standard', fill: '#15803d', stroke: '#22c55e', text: '#f0fdf4' },
  compliance: { label: 'Compliance Requirement', fill: '#b91c1c', stroke: '#ef4444', text: '#fef2f2' },
  support: { label: 'Supporting Information', fill: '#334155', stroke: '#94a3b8', text: '#f1f5f9' },
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

function requirementLabel(item: RecommendationItem): string {
  const matched = item.matched_requirements?.[0]
  if (matched) return truncate(matched, 40)
  return truncate(item.aspect || item.department || item.group || 'General requirement', 40)
}

function complianceLabel(item: RecommendationItem): string {
  const scheme = item.certification_scheme && item.certification_scheme !== 'NONE'
    ? item.certification_scheme.replace(/_/g, ' ')
    : null
  const mandatory = item.certification_mandatory ? 'Mandatory' : 'Voluntary'
  return scheme ? `${scheme} · ${mandatory}` : 'No certification scheme on record'
}

export function NormativeGraph({ query, items, pdfAnalysis }: Props) {
  const navigate = useNavigate()
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
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
      const label = requirementLabel(item)
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
  }, [items, pdfAnalysis])

  if (!layout) return null
  const { columns, colX, groups, reqX, specX, hasSupport, supportX, width } = layout

  const supportLines = pdfAnalysis
    ? [
        pdfAnalysis.document_title || pdfAnalysis.file_name,
        pdfAnalysis.detected_sections.length ? `Sections: ${pdfAnalysis.detected_sections.slice(0, 3).join(', ')}` : null,
        pdfAnalysis.detected_is_numbers.length ? `${pdfAnalysis.detected_is_numbers.length} IS number(s) detected` : null,
      ].filter(Boolean) as string[]
    : []

  return (
    <section className="panel overflow-hidden p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-100">
            <GitBranch className="h-4 w-4 text-accent" />
            Normative Graph
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Procurement Specification → Requirement → Indian Standard → Compliance Requirement
          </p>
        </div>
        <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {columns.length} standard{columns.length === 1 ? '' : 's'} mapped
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-hairline bg-base/20">
        <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-2/90 backdrop-blur">
          <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => zoomBy(1.25)} className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100">
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-px w-full bg-hairline" />
          <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => zoomBy(0.8)} className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100">
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-px w-full bg-hairline" />
          <button type="button" aria-label="Reset view" title="Reset view" onClick={resetView} className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} 560`}
          preserveAspectRatio="xMidYMid meet"
          className="h-[520px] w-full cursor-grab touch-none active:cursor-grabbing"
          role="img"
          aria-label="Normative graph from procurement specification to compliance requirements"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`} style={{ transformOrigin: `${width / 2}px 280px` }}>

            {/* spec -> requirement edges */}
            {groups.map((g) => (
              <line key={`spec-req-${g.label}`} x1={specX} y1={SPEC_Y + NODE_H / 2} x2={reqX.get(g.label)} y2={REQ_Y - NODE_H / 2} stroke={NODE_META.requirement.stroke} strokeOpacity="0.5" strokeWidth="1.5" />
            ))}
            {groups.length > 0 && (
              <text x={(specX + (reqX.get(groups[0].label) ?? specX)) / 2 - 40} y={(SPEC_Y + REQ_Y) / 2} fontSize="9" fill="#94a3b8">requires</text>
            )}

            {/* requirement -> standard edges */}
            {columns.map((c, i) => (
              <line key={`req-std-${i}`} x1={reqX.get(c.reqLabel)} y1={REQ_Y + NODE_H / 2} x2={colX[i]} y2={STD_Y - NODE_H / 2} stroke={NODE_META.standard.stroke} strokeOpacity="0.5" strokeWidth="1.5" />
            ))}
            {columns.length > 0 && (
              <text x={colX[0] + 8} y={(REQ_Y + STD_Y) / 2} fontSize="9" fill="#94a3b8">mapped to</text>
            )}

            {/* standard -> compliance edges */}
            {columns.map((_, i) => (
              <line key={`std-comp-${i}`} x1={colX[i]} y1={STD_Y + NODE_H / 2} x2={colX[i]} y2={COMP_Y - NODE_H / 2} stroke={NODE_META.compliance.stroke} strokeOpacity="0.5" strokeWidth="1.5" />
            ))}
            {columns.length > 0 && (
              <text x={colX[0] + 8} y={(STD_Y + COMP_Y) / 2} fontSize="9" fill="#94a3b8">leads to</text>
            )}

            {/* spec -> support dashed edge */}
            {hasSupport && (
              <>
                <line x1={specX + NODE_W / 2} y1={SPEC_Y} x2={supportX - NODE_W / 2} y2={SPEC_Y} stroke={NODE_META.support.stroke} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="5 4" />
                <text x={(specX + supportX) / 2 - 30} y={SPEC_Y - 8} fontSize="9" fill="#94a3b8">references</text>
              </>
            )}

            {/* spec node */}
            <g>
              <rect x={specX - NODE_W / 2} y={SPEC_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.spec.fill} fillOpacity="0.9" stroke={NODE_META.spec.stroke} strokeWidth="2" />
              <text x={specX} y={SPEC_Y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={NODE_META.spec.text}>{NODE_META.spec.label}</text>
              <text x={specX} y={SPEC_Y + 12} textAnchor="middle" fontSize="8" fill={NODE_META.spec.text} opacity="0.85">{truncate(query, 34)}</text>
              <title>{query}</title>
            </g>

            {/* support node */}
            {hasSupport && (
              <g>
                <rect x={supportX - NODE_W / 2} y={SPEC_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.support.fill} fillOpacity="0.9" stroke={NODE_META.support.stroke} strokeWidth="2" />
                <text x={supportX} y={SPEC_Y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={NODE_META.support.text}>{NODE_META.support.label}</text>
                <text x={supportX} y={SPEC_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.support.text} opacity="0.85">{truncate(supportLines[0] || 'From uploaded PDF', 30)}</text>
                <title>{supportLines.join(' · ') || 'Supporting information from uploaded document'}</title>
              </g>
            )}

            {/* requirement nodes */}
            {groups.map((g) => {
              const x = reqX.get(g.label) ?? specX
              return (
                <g key={`req-node-${g.label}`}>
                  <rect x={x - NODE_W / 2} y={REQ_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.requirement.fill} fillOpacity="0.9" stroke={NODE_META.requirement.stroke} strokeWidth="2" />
                  <text x={x} y={REQ_Y - 6} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={NODE_META.requirement.text}>{truncate(g.label, 26)}</text>
                  <text x={x} y={REQ_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.requirement.text} opacity="0.85">{g.items.length} standard{g.items.length === 1 ? '' : 's'}</text>
                  <title>{g.label}</title>
                </g>
              )
            })}

            {/* standard nodes */}
            {columns.map(({ item }, i) => (
              <g key={`std-node-${item.standard_id}`} role="link" tabIndex={0} className="cursor-pointer outline-none" onClick={() => navigate(`/standards/${item.standard_id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/standards/${item.standard_id}`) } }}>
                <rect x={colX[i] - NODE_W / 2} y={STD_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.standard.fill} fillOpacity="0.9" stroke={NODE_META.standard.stroke} strokeWidth="2" />
                <text x={colX[i]} y={STD_Y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={NODE_META.standard.text}>{item.is_number}</text>
                <text x={colX[i]} y={STD_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.standard.text} opacity="0.85">{truncate(item.title, 28)}</text>
                <title>{`${item.is_number} — ${item.title}`}</title>
              </g>
            ))}

            {/* compliance nodes */}
            {columns.map(({ item }, i) => (
              <g key={`comp-node-${item.standard_id}`}>
                <rect x={colX[i] - NODE_W / 2} y={COMP_Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="12" fill={NODE_META.compliance.fill} fillOpacity="0.9" stroke={NODE_META.compliance.stroke} strokeWidth="2" />
                <text x={colX[i]} y={COMP_Y - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill={NODE_META.compliance.text}>Compliance</text>
                <text x={colX[i]} y={COMP_Y + 12} textAnchor="middle" fontSize="7.5" fill={NODE_META.compliance.text} opacity="0.85">{truncate(complianceLabel(item), 30)}</text>
                <title>{complianceLabel(item)}</title>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {items.length > MAX_COLUMNS && (
        <p className="mt-2 text-[10px] text-slate-600">Graph shows the top {MAX_COLUMNS} matched standards; all results remain available in the list below.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">
        {(Object.keys(NODE_META) as NodeType[])
          .filter((key) => key !== 'support' || hasSupport)
          .map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_META[key].stroke }} />
              <span>{NODE_META[key].label}</span>
            </div>
          ))}
        <span className="ml-auto text-slate-600">Scroll or drag to pan/zoom · click a standard to open its details</span>
      </div>
    </section>
  )
}