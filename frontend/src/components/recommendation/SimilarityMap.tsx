import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import type { SimilarityMapPoint } from '../../types/recommendation'

type Props = {
  points: SimilarityMapPoint[]
}

type TooltipProps = {
  active?: boolean
  payload?: Array<{
    payload: SimilarityMapPoint
  }>
}

function MapTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0].payload

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 px-3 py-2.5 shadow-2xl backdrop-blur">
      <p className="font-mono text-xs font-semibold text-accent">
        {point.is_query ? 'QUERY' : point.is_number}
      </p>

      <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-300">
        {point.title}
      </p>

      {!point.is_query && (
        <p className="mt-1 text-[11px] text-slate-500">
          Match score: {(point.score * 100).toFixed(1)}%
        </p>
      )}
    </div>
  )
}

export function SimilarityMap({ points }: Props) {
  if (!points || points.length === 0) {
    return null
  }

  const queryPoints = points.filter((point) => point.is_query)
  const standardPoints = points.filter((point) => !point.is_query)

  return (
    <div className="panel overflow-hidden p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            Semantic Similarity Map
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Standards closer to the query are semantically more similar.
          </p>
        </div>
        <div className="hidden items-center gap-2 text-[10px] text-slate-500 sm:flex">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          Standards
          <span className="ml-2 h-2 w-2 rounded-full bg-amber-400" />
          Query
        </div>
      </div>

      <div className="h-[420px] w-full rounded-xl border border-hairline bg-surface-2/30 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 10,
            }}
          >
            <CartesianGrid
              stroke="#334155"
              strokeDasharray="3 6"
              opacity={0.45}
            />

            <XAxis
              type="number"
              dataKey="x"
              name="X"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />

            <YAxis
              type="number"
              dataKey="y"
              name="Y"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />

            <Tooltip
              cursor={{ stroke: '#64748b', strokeDasharray: '4 4' }}
              content={<MapTooltip />}
            />

            <Scatter
              name="Standards"
              data={standardPoints}
              fill="#38bdf8"
              line={false}
              shape="circle"
            />

            <Scatter
              name="Query"
              data={queryPoints}
              fill="#f59e0b"
              shape="star"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-5 text-xs text-slate-500 sm:hidden">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          <span>BIS Standards</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-amber-400">★</span>
          <span>Query</span>
        </div>
      </div>
    </div>
  )
}