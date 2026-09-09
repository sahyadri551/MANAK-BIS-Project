import { X } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
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

const SCORE_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
]

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
    <div
      id="comparison-panel"
      className="panel mt-6 overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-hairline bg-surface-2/40 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-100">
              Compare Selected Standards
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Comparing {items.length} recommended standards
            </p>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-surface-2 hover:text-red-400"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left">
              <th className="w-44 px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Attribute
              </th>

              {items.map((item, index) => (
                <th
                  key={item.standard_id}
                  className="px-4 py-4 align-top"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-accent">
                        {item.is_number}
                      </div>

                      <div className="mt-1.5 max-w-[240px] text-sm font-semibold leading-snug text-slate-200">
                        {item.title}
                      </div>

                      <div className="mt-2 inline-flex items-center rounded-md border border-accent/20 bg-accent/10 px-2 py-1 font-mono text-[10px] text-blue-200">
                        #{index + 1} recommended
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.standard_id)}
                      className="shrink-0 rounded-md p-1.5 text-slate-600 transition-colors hover:bg-surface-2 hover:text-red-400"
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
            {/* Match score */}
            <tr className="border-b border-hairline">
              <td className="px-4 py-4 font-medium text-slate-500">
                Match score
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-4 py-4"
                >
                  <div className="min-w-[150px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-lg font-bold text-accent">
                        {Math.round(item.score * 100)}%
                      </span>

                      <span className="text-[10px] uppercase tracking-wider text-slate-600">
                        relevance
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, item.score * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
              ))}
            </tr>

            {/* Status */}
            <tr className="border-b border-hairline">
              <td className="px-4 py-4 font-medium text-slate-500">
                Status
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-4 py-4"
                >
                  <span
                    className={[
                      'inline-flex rounded-md border px-2.5 py-1 text-xs font-medium',
                      item.status === 'Active'
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                        : item.status === 'Withdrawn'
                          ? 'border-red-400/20 bg-red-400/10 text-red-300'
                          : item.status === 'Superseded'
                            ? 'border-slate-400/20 bg-slate-400/10 text-slate-300'
                            : 'border-amber-400/20 bg-amber-400/10 text-amber-300',
                    ].join(' ')}
                  >
                    {item.status}
                  </span>
                </td>
              ))}
            </tr>

            {/* Department */}
            <tr className="border-b border-hairline">
              <td className="px-4 py-4 font-medium text-slate-500">
                Department
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-4 py-4 align-top text-slate-300"
                >
                  <div className="max-w-[240px] leading-relaxed">
                    {item.department || '—'}
                  </div>
                </td>
              ))}
            </tr>

            {/* Aspect */}
            <tr className="border-b border-hairline">
              <td className="px-4 py-4 font-medium text-slate-500">
                Aspect
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-4 py-4 align-top"
                >
                  {item.aspect ? (
                    <span className="inline-flex rounded-md border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs text-violet-300">
                      {item.aspect}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Matched requirements */}
            <tr>
              <td className="px-4 py-4 align-top font-medium text-slate-500">
                Matched requirements
              </td>

              {items.map((item) => (
                <td
                  key={item.standard_id}
                  className="px-4 py-4 align-top"
                >
                  {item.matched_requirements.length > 0 ? (
                    <div className="space-y-2">
                      {item.matched_requirements.map(
                        (requirement, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-accent/15 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-slate-300"
                          >
                            {requirement}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">
                      No matched requirements
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Department
  </td>

  {items.map((item) => (
    <td
      key={item.standard_id}
      className="px-4 py-4 align-top text-slate-300"
    >
      {item.department || '—'}
    </td>
  ))}
</tr>

<tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Aspect
  </td>

  {items.map((item) => (
    <td key={item.standard_id} className="px-4 py-4 align-top">
      {item.aspect || '—'}
    </td>
  ))}
</tr>

<tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Group
  </td>

  {items.map((item) => (
    <td
      key={item.standard_id}
      className="px-4 py-4 align-top text-slate-300"
    >
      {item.group || '—'}
    </td>
  ))}
</tr>

<tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Published On
  </td>

  {items.map((item) => (
    <td
      key={item.standard_id}
      className="px-4 py-4 text-slate-300"
    >
      {item.published_on || '—'}
    </td>
  ))}
</tr>

<tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Valid Upto
  </td>

  {items.map((item) => (
    <td
      key={item.standard_id}
      className="px-4 py-4 text-slate-300"
    >
      {item.valid_upto || '—'}
    </td>
  ))}
</tr>

<tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Revision
  </td>

  {items.map((item) => (
    <td
      key={item.standard_id}
      className="px-4 py-4 text-slate-300"
    >
      {item.no_of_revision > 0
        ? item.no_of_revision
        : '—'}
    </td>
  ))}
</tr>

<tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Amendments
  </td>

  {items.map((item) => (
    <td
      key={item.standard_id}
      className="px-4 py-4 text-slate-300"
    >
      {item.amendment_count > 0
        ? item.amendment_count
        : '—'}
    </td>
  ))}
</tr>

<tr className="border-b border-hairline">
  <td className="px-4 py-4 font-medium text-slate-500">
    Reaffirmation Year
  </td>

  {items.map((item) => (
    <td
      key={item.standard_id}
      className="px-4 py-4 text-slate-300"
    >
      {item.reaffirmation_year ?? '—'}
    </td>
  ))}
</tr>
          </tbody>
        </table>
      </div>

      {/* Score chart */}
      <div className="border-t border-hairline px-5 py-6">
        <div className="mb-4">
          <h4 className="font-display text-sm font-semibold text-slate-200">
            Match Score Comparison
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Higher score indicates stronger semantic relevance to the procurement specification.
          </p>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 24,
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
              width={165}
              stroke="#64748b"
            />

            <Tooltip
              formatter={(value) => [
                `${value}%`,
                'Match score',
              ]}
              contentStyle={{
                background: '#172033',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#e2e8f0',
                fontSize: 12,
              }}
            />

            <Bar
              dataKey="score"
              radius={[0, 7, 7, 0]}
              barSize={24}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={SCORE_COLORS[index % SCORE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}