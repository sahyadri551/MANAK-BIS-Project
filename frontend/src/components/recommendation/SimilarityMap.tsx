import {
  Scatter,
  ScatterChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'

type SimilarityMapPoint = {
  standard_id: number
  is_number: string
  title: string
  x: number
  y: number
  score: number
  is_query: boolean
}

type Props = {
  points: SimilarityMapPoint[]
}

export function SimilarityMap({
  points,
}: Props) {
  if (points.length === 0) {
    return null
  }

  const queryPoint = points.find(
    (point) => point.is_query,
  )

  const standards = points.filter(
    (point) => !point.is_query,
  )

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold text-slate-100">
          Semantic Similarity Map
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Closer points represent more semantically similar standards.
        </p>
      </div>

      <ResponsiveContainer
        width="100%"
        height={360}
      >
        <ScatterChart
          margin={{
            top: 20,
            right: 30,
            bottom: 20,
            left: 20,
          }}
        >
          <XAxis
            type="number"
            dataKey="x"
            domain={[-1, 1]}
            hide
          />

          <YAxis
            type="number"
            dataKey="y"
            domain={[-1, 1]}
            hide
          />

          <ReferenceLine
            x={0}
            stroke="#334155"
            strokeDasharray="4 4"
          />

          <ReferenceLine
            y={0}
            stroke="#334155"
            strokeDasharray="4 4"
          />

          <Tooltip
            cursor={{
              strokeDasharray: '3 3',
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) {
                return null
              }

              const point =
                payload[0]?.payload as SimilarityMapPoint

              if (!point) {
                return null
              }

              return (
                <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-lg">
                  <div className="font-mono text-xs text-accent">
                    {point.is_query
                      ? 'Your Query'
                      : point.is_number}
                  </div>

                  {!point.is_query && (
                    <>
                      <div className="mt-1 max-w-[260px] text-xs text-slate-200">
                        {point.title}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        Match:{' '}
                        {Math.round(
                          point.score * 100,
                        )}
                        %
                      </div>
                    </>
                  )}
                </div>
              )
            }}
          />

          <Scatter
            name="Standards"
            data={standards}
            fill="#64748b"
            shape="circle"
          />

          {queryPoint && (
            <Scatter
              name="Your Query"
              data={[queryPoint]}
              fill="#3b82f6"
              shape="star"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
          BIS Standard
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="text-sm text-accent">★</span>
          Your Query
        </span>
      </div>
    </div>
  )
}