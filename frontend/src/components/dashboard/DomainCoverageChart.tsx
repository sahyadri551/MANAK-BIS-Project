import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { domainMeta } from '../../utils/constants'
import { useI18n } from '../../i18n'

export function DomainCoverageChart({ data }: { data: Record<string, number> }) {
  const { t } = useI18n()
  const rows = Object.entries(data).map(([domain, count]) => ({
    domain,
    label: domainMeta(domain).label,
    count,
    fill: domainMeta(domain).chart,
  }))

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-slate-100">{t('dash.coverage')}</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{t('dash.standards')}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              background: '#121721',
              border: '1px solid #212B3A',
              borderRadius: 10,
              color: '#e2e8f0',
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.domain} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
