import { X } from 'lucide-react'
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
  onRemove: (standardId: number) => void
  onClear: () => void
}

export function ComparisonPanel({
  items,
  onRemove,
  onClear,
}: Props) {
  if (items.length === 0) {
    return null
  }

  const chartData = items.map((item) => ({
    name: item.is_number,
    score: Math.round(item.score * 100),
  }))

  return (
    <div  id="comparison-panel" className="panel mt-6 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-100">
            Compare Selected
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Comparing {items.length} recommended standards
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 transition-colors hover:text-red-400"
        >
          Clear all
        </button>
      </div>

      {/* Comparison table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left">
              <th className="w-40 px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Attribute
              </th>

              {items.map((item) => (
                <th
                  key={item.standard_id}
                  className="px-3 py-3 text-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-accent">
                        {item.is_number}
                      </div>

                      <div className="mt-1 max-w-[220px] truncate font-display text-sm">
                        {item.title}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.standard_id)}
                      className="rounded p-1 text-slate-600 hover:bg-surface-2 hover:text-red-400"
                      aria-label={`Remove ${item.is_number}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-hairline">
              <td className="px-3 py-3 text-slate-500">
                Match score
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-3 py-3 font-mono font-semibold text-accent"
                >
                  {Math.round(item.score * 100)}%
                </td>
              ))}
            </tr>

            <tr className="border-b border-hairline">
              <td className="px-3 py-3 text-slate-500">
                Status
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-3 py-3 text-slate-300"
                >
                  {item.status}
                </td>
              ))}
            </tr>

            <tr className="border-b border-hairline">
              <td className="px-3 py-3 text-slate-500">
                Department
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-3 py-3 text-slate-300"
                >
                  {item.department || '—'}
                </td>
              ))}
            </tr>

            <tr className="border-b border-hairline">
              <td className="px-3 py-3 text-slate-500">
                Aspect
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-3 py-3 text-slate-300"
                >
                  {item.aspect || '—'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="px-3 py-3 align-top text-slate-500">
                Matched requirements
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-3 py-3 align-top"
                >
                  {item.matched_requirements.length > 0 ? (
                    <div className="space-y-1.5">
                      {item.matched_requirements.map(
                        (requirement, index) => (
                          <div
                            key={index}
                            className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-xs text-blue-200"
                          >
                            {requirement}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-600">
                      None
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Graph */}
      <div className="mt-8">
        <div className="mb-4">
          <h4 className="font-display text-sm font-semibold text-slate-200">
            Match Score Comparison
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Higher score means stronger semantic similarity.
          </p>
        </div>

        <ResponsiveContainer width="100%" height={260}>
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
              width={150}
              stroke="#64748b"
            />

            <Tooltip
              formatter={(value) => [
                `${value}%`,
                'Match score',
              ]}
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
              barSize={26}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}