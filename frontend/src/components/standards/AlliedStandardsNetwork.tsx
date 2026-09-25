import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { AlliedStandardCategory, RelatedStandard } from '../../types/standard'
import { useTheme } from '../../hooks/useTheme'

type Props = {
  standard: {
    id: number
    is_number: string
    title: string
  }
  standards: RelatedStandard[]
}

type Point = { x: number; y: number }
type CategoryMeta = { label: string; stroke: string }

// Eight hues spread evenly around the color wheel (45° apart) so every
// category reads as visually distinct at a glance, even at small node sizes.
const CATEGORY_META: Record<AlliedStandardCategory, CategoryMeta> = {
  normative_reference: { label: 'Normative References', stroke: '#3b82f6' }, // blue
  test_method: { label: 'Test Methods', stroke: '#10b981' }, // green
  terminology: { label: 'Terminology', stroke: '#8b5cf6' }, // violet
  safety: { label: 'Safety Standards', stroke: '#f97316' }, // orange
  installation: { label: 'Installation', stroke: '#06b6d4' }, // cyan
  product_spec: { label: 'Product Specifications', stroke: '#ec4899' }, // pink
  supersedes: { label: 'Supersedes', stroke: '#ef4444' }, // red
  superseded_by: { label: 'Superseded By', stroke: '#84cc16' }, // lime
}

const CATEGORY_ORDER: AlliedStandardCategory[] = [
  'normative_reference', 'test_method', 'terminology', 'safety',
  'installation', 'product_spec', 'supersedes', 'superseded_by',
]

const MAX_GRAPH_NODES_PER_CATEGORY = 8
const MIN_SCALE = 0.6
const MAX_SCALE = 3

// Canvas geometry — all radii chosen so leaf nodes can never land closer to
// the center than the anchor ring, no matter what angle they fall at.
const CENTER: Point = { x: 600, y: 420 }
const CENTER_R = 64
const ANCHOR_R = 24
const LEAF_R = 28
const ANCHOR_RX = 210
const ANCHOR_RY = 165
const LEAF_RX = 430
const LEAF_RY = 290
// Leaves past the third in a category are pushed onto this wider ring in an
// alternating (near/far) pattern, so dense categories get real breathing
// room instead of only relying on angle to keep circles apart.
const LEAF_RING_GAP = 55

function polar(angle: number, rx: number, ry: number): Point {
  return { x: CENTER.x + Math.cos(angle) * rx, y: CENTER.y + Math.sin(angle) * ry }
}

function categoryAngle(categoryIndex: number, categoryCount: number): number {
  return (-Math.PI / 2) + (categoryIndex * Math.PI * 2) / Math.max(categoryCount, 1)
}

// Spread a category's leaf nodes in a fan centered on that category's own
// angle, rather than around the full circle — this keeps every leaf on the
// outward-facing side of its anchor so it can't drift back toward the center.
// The fan is also clamped to a share of that category's own slice of the
// circle (sectorRad), so a category with lots of items can never spread far
// enough to bleed into — and overlap — its neighbors' nodes.
function leafAngles(anchorAngle: number, count: number, sectorRad: number): number[] {
  if (count === 1) return [anchorAngle]
  const perItemRad = (24 * Math.PI) / 180
  const maxSpreadRad = Math.min((150 * Math.PI) / 180, sectorRad * 0.82)
  const spreadRad = Math.min(maxSpreadRad, perItemRad * (count - 1))
  const step = spreadRad / (count - 1)
  const start = anchorAngle - spreadRad / 2
  return Array.from({ length: count }, (_, i) => start + i * step)
}

export function AlliedStandardsNetwork({ standard, standards }: Props) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  // Labels that sit directly on the panel background (not inside a colored
  // node) need theme-aware colors — a fixed dark navy reads fine in light
  // mode but disappears against a dark panel.
  const labelColor = isDark ? '#e2e8f0' : '#1e293b'
  const mutedLabelColor = isDark ? '#94a3b8' : '#64748b'

  // --- pan/zoom state ---
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false, startX: 0, startY: 0, originX: 0, originY: 0,
  })

  const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))

  const zoomBy = useCallback((factor: number) => {
    setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale * factor) }))
  }, [])

  const resetView = useCallback(() => setTransform({ scale: 1, x: 0, y: 0 }), [])

  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale * factor) }))
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
    }
    svgRef.current?.setPointerCapture(event.pointerId)
  }, [transform.x, transform.y])

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.dragging) return
    const dx = event.clientX - dragRef.current.startX
    const dy = event.clientY - dragRef.current.startY
    setTransform((prev) => ({ ...prev, x: dragRef.current.originX + dx, y: dragRef.current.originY + dy }))
  }, [])

  const handlePointerUp = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current.dragging = false
    svgRef.current?.releasePointerCapture(event.pointerId)
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<AlliedStandardCategory, RelatedStandard[]>()
    for (const item of standards) {
      if (!item.category) continue
      const items = map.get(item.category) ?? []
      items.push(item)
      map.set(item.category, items)
    }
    return CATEGORY_ORDER
      .filter((category) => map.has(category))
      .map((category) => ({ category, items: map.get(category)! }))
  }, [standards])

  const layout = useMemo(() => {
    const nodes: Array<{ item: RelatedStandard; point: Point; category: AlliedStandardCategory }> = []
    const edges: Array<{ from: Point; to: Point; category: AlliedStandardCategory }> = []
    const categoryCount = grouped.length
    const sectorRad = (Math.PI * 2) / Math.max(categoryCount, 1)

    grouped.forEach(({ category, items }, categoryIndex) => {
      const visibleItems = items.slice(0, MAX_GRAPH_NODES_PER_CATEGORY)
      const anchorAngle = categoryAngle(categoryIndex, categoryCount)
      const angles = leafAngles(anchorAngle, visibleItems.length, sectorRad)
      visibleItems.forEach((item, itemIndex) => {
        // Once a category has more than 3 leaves, alternate every other one
        // onto a wider ring so tightly angled neighbors don't touch.
        const onFarRing = visibleItems.length > 3 && itemIndex % 2 === 1
        const rx = LEAF_RX + (onFarRing ? LEAF_RING_GAP : 0)
        const ry = LEAF_RY + (onFarRing ? LEAF_RING_GAP : 0)
        const point = polar(angles[itemIndex], rx, ry)
        nodes.push({ item, point, category })
        edges.push({ from: CENTER, to: point, category })
      })
    })

    return { nodes, edges }
  }, [grouped])

  if (!standards.length || !grouped.length) return null

  return (
    <section className="panel overflow-hidden p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-100">
            <Network className="h-4 w-4 text-accent" />
            Allied Standards Network
          </h2>
          <p className="mt-1 text-xs text-slate-500">Graphical overview of allied and normative relationships.</p>
        </div>
        <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {standards.length} connected standards
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-hairline bg-base/20">
        {/* zoom controls */}
        <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-2/90 backdrop-blur">
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => zoomBy(1.25)}
            className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-px w-full bg-hairline" />
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => zoomBy(0.8)}
            className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-px w-full bg-hairline" />
          <button
            type="button"
            aria-label="Reset view"
            title="Reset view"
            onClick={resetView}
            className="flex h-8 w-8 items-center justify-center text-slate-300 transition hover:bg-surface-3 hover:text-slate-100"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 1200 860"
          className="h-[600px] min-w-[860px] w-full cursor-grab touch-none active:cursor-grabbing"
          role="img"
          aria-label={`Allied standards network for ${standard.is_number}`}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`} style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}>
            <circle cx={CENTER.x} cy={CENTER.y} r={CENTER_R + 45} fill="#60a5fa" fillOpacity="0.05" />

            {layout.edges.map((edge, index) => (
              <line key={`edge-${edge.category}-${index}`} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} stroke={CATEGORY_META[edge.category].stroke} strokeOpacity="0.35" strokeWidth="1.25" />
            ))}

            {grouped.map(({ category, items }, categoryIndex) => {
              const anchor = polar(categoryAngle(categoryIndex, grouped.length), ANCHOR_RX, ANCHOR_RY)
              const meta = CATEGORY_META[category]
              return (
                <g key={`category-${category}`} tabIndex={0} className="outline-none">
                  {/* Soft halo behind the solid badge, purely decorative. */}
                  <circle cx={anchor.x} cy={anchor.y} r={ANCHOR_R + 6} fill={meta.stroke} fillOpacity="0.18" />
                  {/* Solid, fully-opaque badge so the number stays readable
                      against both light and dark panel backgrounds. */}
                  <circle cx={anchor.x} cy={anchor.y} r={ANCHOR_R} fill={meta.stroke} stroke={meta.stroke} strokeWidth="2" />
                  <text x={anchor.x} y={anchor.y + 4} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">{categoryIndex + 1}</text>
                  <text x={anchor.x} y={anchor.y + ANCHOR_R + 16} textAnchor="middle" fill={mutedLabelColor} fontSize="10">{meta.label}</text>
                  <title>{`${meta.label} — ${items.length} standard${items.length === 1 ? '' : 's'}`}</title>
                </g>
              )
            })}

            <g>
              <circle cx={CENTER.x} cy={CENTER.y} r={CENTER_R} fill="#0f172a" stroke="#60a5fa" strokeWidth="2" />
              <text x={CENTER.x} y={CENTER.y - 6} textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="700">{standard.is_number}</text>
              <text x={CENTER.x} y={CENTER.y + 13} textAnchor="middle" fill="#cbd5e1" fontSize="10">Current Standard</text>
            </g>

            {layout.nodes.map(({ item, point, category }) => {
              const meta = CATEGORY_META[category]
              return (
                <g key={`${category}-${item.id}`} role="link" tabIndex={0} aria-label={`Open ${item.is_number}: ${item.title}`} className="cursor-pointer outline-none" onClick={() => navigate(`/standards/${item.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/standards/${item.id}`) } }}>
                  <text x={point.x} y={point.y - LEAF_R - 8} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="700">{item.is_number.length > 16 ? `${item.is_number.slice(0, 15)}…` : item.is_number}</text>
                  <circle cx={point.x} cy={point.y} r={LEAF_R} fill={meta.stroke} fillOpacity="0.32" stroke={meta.stroke} strokeWidth="2" />
                  <text x={point.x} y={point.y + 4} textAnchor="middle" fill={meta.stroke} fontSize="9" fontWeight="600">{item.status}</text>
                  <title>{`${item.is_number} — ${item.title}`}</title>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {grouped.some(({ items }) => items.length > MAX_GRAPH_NODES_PER_CATEGORY) && (
        <p className="mt-2 text-[10px] text-slate-600">Graph shows up to {MAX_GRAPH_NODES_PER_CATEGORY} standards per category; all references remain available in the detailed lists below.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">
        {grouped.map(({ category }) => {
          const meta = CATEGORY_META[category]
          return <div key={category} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.stroke }} /><span>{meta.label}</span></div>
        })}
        <span className="ml-auto text-slate-600">Scroll or drag to pan/zoom · click a node to open its standard</span>
      </div>
    </section>
  )
}