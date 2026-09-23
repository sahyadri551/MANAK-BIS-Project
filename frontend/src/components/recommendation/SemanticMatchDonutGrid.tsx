import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type { RecommendationItem } from '../../types/recommendation'
import { useI18n } from '../../i18n'
import { pdfCopy } from '../../i18n/pdfCopy'

type Props = {
  items: RecommendationItem[]
}

const CELL = 150
const RADIUS = 42
const STROKE = 12

// Sapphire ramp: t=0 -> palest, t=1 -> darkest.
function lerpColor(t: number): string {
  const stops: [number, number, number][] = [
    [147, 197, 253],
    [59, 130, 246],
    [29, 78, 216],
    [15, 61, 145],
  ]
  const clamped = Math.min(1, Math.max(0, t))
  const seg = Math.min(2, Math.floor(clamped * 3))
  const localT = clamped * 3 - seg
  const [r1, g1, b1] = stops[seg]
  const [r2, g2, b2] = stops[seg + 1]
  const r = Math.round(r1 + (r2 - r1) * localT)
  const g = Math.round(g1 + (g2 - g1) * localT)
  const b = Math.round(b1 + (b2 - b1) * localT)
  return `rgb(${r}, ${g}, ${b})`
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, endDeg)
  const end = polar(cx, cy, r, startDeg)
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export function SemanticMatchDonutGrid({ items }: Props) {
  const { lang } = useI18n()
  const navigate = useNavigate()

  if (items.length === 0) return null

  const chartData = useMemo(
    () => items.map((item) => ({
      name: item.is_number,
      score: Math.round(item.score * 100),
      title: item.title,
      standardId: item.standard_id,
    })),
    [items],
  )

  // Color scale is driven by the actual score value, not list position —
  // the highest match is always darkest and the lowest is always lightest,
  // regardless of the order items happen to be sorted or filtered in.
  const { min, max } = useMemo(() => {
    const scores = chartData.map((d) => d.score)
    return { min: Math.min(...scores), max: Math.max(...scores) }
  }, [chartData])

  const cy = CELL / 2 - 10

  return (
    <div className="panel overflow-hidden p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            {pdfCopy(lang, 'semanticTitle')}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {pdfCopy(lang, 'semanticDesc')}
          </p>
        </div>
        <span className="hidden rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-accent sm:inline-flex">
          {items.length} {pdfCopy(lang, 'matches')}
        </span>
      </div>

      {/* Responsive grid: each donut is its own small SVG sized by its cell,
          so items reflow and stay evenly spaced at any viewport width
          instead of one fixed-pixel chart that either stretches or scrolls. */}
      <div
        className="grid justify-items-center gap-y-6"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${CELL}px, 1fr))` }}
      >
        {chartData.map((entry) => {
          const t = (entry.score - min) / ((max - min) || 1)
          const color = lerpColor(t)
          const label = entry.name.length > 14 ? `${entry.name.slice(0, 13)}…` : entry.name

          return (
            <svg
              key={entry.standardId}
              viewBox={`0 0 ${CELL} ${CELL}`}
              className="h-auto w-full max-w-[150px] cursor-pointer outline-none"
              role="link"
              tabIndex={0}
              aria-label={`Open ${entry.name}: ${entry.title}`}
              onClick={() => navigate(`/standards/${entry.standardId}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/standards/${entry.standardId}`)
                }
              }}
            >
              <circle cx={CELL / 2} cy={cy} r={RADIUS} fill="none" stroke="#e5edfb" strokeWidth={STROKE} />
              <path
                d={arcPath(CELL / 2, cy, RADIUS, 0, (entry.score / 100) * 360)}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
              <text x={CELL / 2} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">
                {entry.score}%
              </text>
              <text x={CELL / 2} y={cy + RADIUS + 22} textAnchor="middle" fontSize="10" fill="#475569">
                {label}
              </text>
              <title>{`${entry.name} — ${entry.title}`}</title>
            </svg>
          )
        })}
      </div>
    </div>
  )
}