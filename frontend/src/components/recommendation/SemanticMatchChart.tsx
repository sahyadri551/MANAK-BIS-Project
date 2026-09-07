import {
  Bar,
  BarChart,
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
    <div className="panel p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold text-slate-100">
          Semantic Match Overview
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Standards ranked by semantic similarity to your search.
        </p>
      </div>

      <ResponsiveContainer
        width="100%"
        height={Math.max(260, items.length * 42)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#64748b"
          />

          <YAxis
            type="category"
            dataKey="name"
            width={160}
            stroke="#64748b"
            tick={{
              fontSize: 11,
            }}
          />

          <Tooltip
            formatter={(value) => [
              `${value}%`,
              'Match',
            ]}
            labelFormatter={(label) => {
              const item = chartData.find(
                (row) => row.name === label,
              )

              return item?.title ?? label
            }}
            contentStyle={{
              background: '#121721',
              border: '1px solid #212B3A',
              borderRadius: 10,
              color: '#e2e8f0',
              fontSize: 12,
            }}
          />

          <Bar
            dataKey="score"
            radius={[0, 6, 6, 0]}
            barSize={24}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}