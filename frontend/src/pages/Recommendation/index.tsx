import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { SlidersHorizontal } from 'lucide-react'
import { SpecForm } from '../../components/recommendation/SpecForm'
import { PdfUploadZone } from '../../components/recommendation/PdfUploadZone'
import { FilterPanel } from '../../components/recommendation/FilterPanel'
import { ResultsList } from '../../components/recommendation/ResultsList'
import { Loader } from '../../components/common/Loader'
import { getRecommendations } from '../../services/recommendationApi'
import { useI18n } from '../../i18n'
import type { RecommendationFilters, RecommendationItem } from '../../types/recommendation'

const NO_FILTERS: RecommendationFilters = { status: null, department: null, aspect: null }

export default function Recommendation() {
  const location = useLocation()
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [filters, setFilters] = useState<RecommendationFilters>(NO_FILTERS)
  const [results, setResults] = useState<RecommendationItem[] | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function run(spec?: string) {
    const q = (spec ?? query).trim()
    if (!q) return
    setLoading(true)
    try {
      const res = await getRecommendations({ query: q, document_name: fileName, filters })
      setResults(res.recommendations)
      setRequestId(res.request_id)
      toast.success(`${res.recommendations.length} ${t('results.toast')}`)
    } catch {
      toast.error(t('results.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const passed = (location.state as { query?: string } | null)?.query
    if (passed) {
      setQuery(passed)
      run(passed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-run when language changes so results come back localized.
  useEffect(() => {
    if (results !== null && query.trim()) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  return (
    <div data-testid="recommendation-page" className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      <div className="space-y-5">
        <div className="panel p-5">
          <SpecForm query={query} onQueryChange={setQuery} onSubmit={() => run()} loading={loading} />
        </div>

        <div className="panel space-y-4 p-5">
          <div className="flex items-center gap-2 text-slate-300">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <h3 className="font-display text-sm font-semibold">{t('attach.title')}</h3>
          </div>
          <PdfUploadZone fileName={fileName} onFileNameChange={setFileName} />
          <FilterPanel value={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="min-w-0">
        {loading ? (
          <Loader label={t('form.matching')} />
        ) : results === null ? (
          <div className="panel flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-slate-200">{t('results.ready')}</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">{t('results.readyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-100">
                {results.length} {t('results.count')}
              </h2>
              {requestId && (
                <span className="font-mono text-[11px] text-slate-600">req {requestId.slice(0, 8)}</span>
              )}
            </div>
            <ResultsList items={results} />
          </div>
        )}
      </div>
    </div>
  )
}
