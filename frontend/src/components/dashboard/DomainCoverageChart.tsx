import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useI18n } from '../../i18n'

const ASPECT_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#4f46e5',
  '#9333ea',
  '#0d9488',
  '#65a30d',
  '#dc2626',
]

export function DomainCoverageChart({
  data,
}: {
  data: Record<string, number>
}) {
  const { t } = useI18n()

  const rows = Object.entries(data)
    .filter(([aspect]) => aspect.trim())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([aspect, count], index) => ({
      aspect,
      label: aspect,
      count,
      fill: ASPECT_COLORS[index % ASPECT_COLORS.length],
    }))

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-slate-100">
          Coverage by Aspect
        </h3>

        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {t('dash.standards')}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{
            left: 8,
            right: 16,
            top: 4,
            bottom: 4,
          }}
        >
          <XAxis type="number" hide />

          <YAxis
            type="category"
            dataKey="label"
            width={155}
            tick={{
              fill: '#94a3b8',
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{
              fill: 'rgba(148,163,184,0.08)',
            }}
            contentStyle={{
              background: '#172033',
              border: '1px solid #334155',
              borderRadius: 10,
              color: '#e2e8f0',
              fontSize: 12,
            }}
            formatter={(value: number) => [
              value.toLocaleString(),
              t('dash.standards'),
            ]}
            labelFormatter={(label) => String(label)}
          />

          <Bar
            dataKey="count"
            radius={[0, 7, 7, 0]}
            barSize={20}
            isAnimationActive={false}
          >
            {rows.map((row) => (
              <Cell
                key={row.aspect}
                fill={row.fill}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}