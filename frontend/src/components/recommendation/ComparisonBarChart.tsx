import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import type { StandardDetail } from '../../types/standard'

type Props = {
  items: StandardDetail[]
}

// Distinct sapphire-family + accent colors, one per compared standard (max 4).
const SERIES_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b']

const METRICS: Array<{ key: string; label: string; value: (item: StandardDetail) => number }> = [
  { key: 'revisions', label: 'Revisions', value: (item) => item.no_of_revision ?? 0 },
  { key: 'amendments', label: 'Amendments', value: (item) => item.amendment_count ?? 0 },
  { key: 'requirements', label: 'Requirements', value: (item) => item.requirements?.length ?? 0 },
  { key: 'crossRefs', label: 'Cross References', value: (item) => item.cross_references?.length ?? 0 },
  { key: 'referencedBy', label: 'Referenced By', value: (item) => item.referenced_by?.length ?? 0 },
]

export function ComparisonBarChart({ items }: Props) {
  if (items.length < 2) return null

  const chartData = METRICS
    // Requirements is hidden when none of the compared standards has any; shown otherwise.
    .filter((metric) => metric.key !== 'requirements' || items.some((item) => metric.value(item) > 0))
    .map((metric) => {
      const row: Record<string, string | number> = { metric: metric.label }
      items.forEach((item) => {
        row[item.is_number] = metric.value(item)
      })
      return row
    })

  return (
    <section className="panel overflow-hidden p-5">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-100">
          <BarChart3 className="h-4 w-4 text-accent" />
          Comparison Overview
        </h2>
        <p className="mt-1 text-xs text-slate-500">Key numeric attributes side by side across the selected standards.</p>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="#263244" strokeDasharray="3 5" opacity={0.7} />

          <XAxis
            dataKey="metric"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />

          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />

          <Tooltip
            cursor={{ fill: '#334155', opacity: 0.18 }}
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              color: '#e2e8f0',
              fontSize: 12,
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
            }}
          />

          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />

          {items.map((item, index) => (
            <Bar
              key={item.id}
              dataKey={item.is_number}
              fill={SERIES_COLORS[index % SERIES_COLORS.length]}
              radius={[6, 6, 0, 0]}
              barSize={28}
              isAnimationActive
              animationDuration={550}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}