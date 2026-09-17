import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Network } from 'lucide-react'
import type { AlliedStandardCategory, RelatedStandard } from '../../types/standard'

type Props = {
  standard: {
    id: number
    is_number: string
    title: string
  }
  standards: RelatedStandard[]
}

type Point = {
  x: number
  y: number
}

type CategoryMeta = {
  label: string
  stroke: string
  fill: string
}

const CATEGORY_META: Record<AlliedStandardCategory, CategoryMeta> = {
  normative_reference: { label: 'Normative References', stroke: '#60a5fa', fill: '#172554' },
  test_method: { label: 'Test Methods', stroke: '#34d399', fill: '#052e2b' },
  terminology: { label: 'Terminology', stroke: '#a78bfa', fill: '#2e1065' },
  safety: { label: 'Safety Standards', stroke: '#f59e0b', fill: '#451a03' },
  installation: { label: 'Installation', stroke: '#22d3ee', fill: '#083344' },
  product_spec: { label: 'Product Specifications', stroke: '#f472b6', fill: '#500724' },
  supersedes: { label: 'Supersedes', stroke: '#fb7185', fill: '#4c0519' },
  superseded_by: { label: 'Superseded By', stroke: '#c084fc', fill: '#3b0764' },
}

const CATEGORY_ORDER: AlliedStandardCategory[] = [
  'normative_reference',
  'test_method',
  'terminology',
  'safety',
  'installation',
  'product_spec',
  'supersedes',
  'superseded_by',
]

function nodePositions(count: number): Point[] {
  if (count === 1) return [{ x: 500, y: 82 }]
  const radius = count > 8 ? 250 : 235
  return Array.from({ length: count }, (_, index) => {
    const angle = (-Math.PI / 2) + (index * Math.PI * 2) / count
    return {
      x: 500 + Math.cos(angle) * radius,
      y: 260 + Math.sin(angle) * radius * 0.72,
    }
  })
}

function categoryAnchor(categoryIndex: number, categoryCount: number): Point {
  const angle = (-Math.PI / 2) + (categoryIndex * Math.PI * 2) / Math.max(categoryCount, 1)
  return {
    x: 500 + Math.cos(angle) * 150,
    y: 260 + Math.sin(angle) * 105,
  }
}

export function AlliedStandardsNetwork({ standard, standards }: Props) {
  const navigate = useNavigate()

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

    grouped.forEach(({ category, items }, categoryIndex) => {
      const anchor = categoryAnchor(categoryIndex, categoryCount)
      const positions = nodePositions(items.length)
      items.forEach((item, itemIndex) => {
        const base = positions[itemIndex]
        const point = {
          x: anchor.x + (base.x - 500) * 0.45,
          y: anchor.y + (base.y - 260) * 0.45,
        }
        nodes.push({ item, point, category })
        edges.push({ from: { x: 500, y: 260 }, to: point, category })
      })
    })

    return { nodes, edges }
  }, [grouped])

  if (!standards.length || !grouped.length) return null

  function openStandard(id: number) {
    navigate(`/standards/${id}`)
  }

  return (
    <section className="panel overflow-hidden p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-100">
            <Network className="h-4 w-4 text-accent" />
            Allied Standards Network
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Graphical overview of normative, test, safety, terminology, installation and supersession relationships.
          </p>
        </div>
        <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {standards.length} connected standards
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-base/20">
        <svg viewBox="0 0 1000 520" className="h-[460px] min-w-[760px] w-full" role="img" aria-label={`Allied standards network for ${standard.is_number}`}>
          <defs>
            <radialGradient id="allied-network-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="500" cy="260" r="105" fill="url(#allied-network-glow)" />

          {layout.edges.map((edge, index) => (
            <line
              key={`edge-${edge.category}-${index}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke={CATEGORY_META[edge.category].stroke}
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
          ))}

          {grouped.map(({ category }, categoryIndex) => {
            const anchor = categoryAnchor(categoryIndex, grouped.length)
            const meta = CATEGORY_META[category]
            return (
              <g key={`category-${category}`}>
                <circle cx={anchor.x} cy={anchor.y} r="22" fill={meta.fill} stroke={meta.stroke} strokeOpacity="0.35" />
                <text x={anchor.x} y={anchor.y + 3} textAnchor="middle" fill={meta.stroke} fontSize="9" fontWeight="700">
                  {categoryIndex + 1}
                </text>
                <text x={anchor.x} y={anchor.y + 38} textAnchor="middle" fill="#94a3b8" fontSize="10">
                  {meta.label}
                </text>
              </g>
            )
          })}

          <g>
            <circle cx="500" cy="260" r="62" fill="#0f172a" stroke="#60a5fa" strokeWidth="2" />
            <text x="500" y="252" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="700">
              {standard.is_number}
            </text>
            <text x="500" y="272" textAnchor="middle" fill="#cbd5e1" fontSize="10">
              Current Standard
            </text>
          </g>

          {layout.nodes.map(({ item, point, category }) => {
            const meta = CATEGORY_META[category]
            return (
              <g
                key={`${category}-${item.id}`}
                role="link"
                tabIndex={0}
                aria-label={`Open ${item.is_number}: ${item.title}`}
                className="cursor-pointer outline-none"
                onClick={() => openStandard(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openStandard(item.id)
                  }
                }}
              >
                <circle cx={point.x} cy={point.y} r="29" fill={meta.fill} stroke={meta.stroke} strokeWidth="1.5" />
                <text x={point.x} y={point.y - 3} textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="700">
                  {item.is_number.length > 15 ? `${item.is_number.slice(0, 14)}…` : item.is_number}
                </text>
                <text x={point.x} y={point.y + 11} textAnchor="middle" fill="#64748b" fontSize="8">
                  {item.status}
                </text>
                <title>{`${item.is_number} — ${item.title}`}</title>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">
        {grouped.map(({ category }) => {
          const meta = CATEGORY_META[category]
          return (
            <div key={category} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.stroke }} />
              <span>{meta.label}</span>
            </div>
          )
        })}
        <span className="ml-auto text-slate-600">Click a node to open its standard</span>
      </div>
    </section>
  )
}
