import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { RecommendationItem } from '../../types/recommendation'

type Props = {
  items: RecommendationItem[]
}

export function SemanticMatchChart({ items }: Props) {
  if (items.length === 0) {
    return null
  }

  const chartData = items.map((item) => ({
    name: item.is_number,
    score: Math.round(item.score * 100),
    title: item.title,
  }))

  return (
    <div className="panel overflow-hidden p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            Semantic Match Overview
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Standards ranked by semantic similarity to your search.
          </p>
        </div>
        <span className="hidden rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-accent sm:inline-flex">
          {items.length} matches
        </span>
      </div>

      <ResponsiveContainer
        width="100%"
        height={Math.max(280, items.length * 44)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 8,
            right: 28,
            left: 12,
            bottom: 8,
          }}
          barCategoryGap="28%"
        >
          <defs>
            <linearGradient id="semanticMatchGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>

          <CartesianGrid
            horizontal={false}
            stroke="#263244"
            strokeDasharray="3 5"
            opacity={0.7}
          />

          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={175}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: '#94a3b8',
            }}
          />

          <Tooltip
            cursor={{ fill: '#334155', opacity: 0.18 }}
            formatter={(value) => [`${value}%`, 'Match score']}
            labelFormatter={(label) => {
              const item = chartData.find((row) => row.name === label)
              return item?.title ?? label
            }}
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              color: '#e2e8f0',
              fontSize: 12,
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
            }}
          />

          <Bar
            dataKey="score"
            radius={[0, 8, 8, 0]}
            barSize={26}
            background={{ fill: '#172033', radius: 8 }}
            isAnimationActive={true}
            animationDuration={650}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill="url(#semanticMatchGradient)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}