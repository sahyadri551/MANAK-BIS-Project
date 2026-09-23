import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SlidersHorizontal } from 'lucide-react'
import { SpecForm } from '../../components/recommendation/SpecForm'
import { FilterPanel } from '../../components/recommendation/FilterPanel'
import { ResultsList } from '../../components/recommendation/ResultsList'
import { Loader } from '../../components/common/Loader'
import { getRecommendations } from '../../services/recommendationApi'
import { getSummary } from '../../services/summaryApi'
import { invalidateSearchHistory } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { PdfAnalysisSummary, RecommendationFilters, RecommendationItem, SimilarityMapPoint } from '../../types/recommendation'
import { SimilarityMap } from '../../components/recommendation/SimilarityMap'
import { SemanticMatchDonutGrid } from '../../components/recommendation/SemanticMatchDonutGrid'
import { NormativeGraph } from '../../components/recommendation/NormativeGraph'
import { AiSummaryPanel } from '../../components/recommendation/AiSummaryPanel'

const NO_FILTERS: RecommendationFilters = { status: null, department: null, aspect: null }
const RECOMMENDATION_SESSION_KEY = 'manak-bis-recommendation-state'
// The /summary endpoint caps how many standards it will summarize per call.
const MAX_SUMMARY_ITEMS = 10

type SavedRecommendationState = { query: string; filters: RecommendationFilters; results: RecommendationItem[]; similarityMap: SimilarityMapPoint[]; requestId: string | null; pdfAnalysis: PdfAnalysisSummary | null; summaryOverall: string | null; summaryPerStandard: Record<string, string> }

export default function Recommendation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<RecommendationFilters>(NO_FILTERS)
  const [results, setResults] = useState<RecommendationItem[] | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [similarityMap, setSimilarityMap] = useState<SimilarityMapPoint[]>([])
  const [pdfAnalysis, setPdfAnalysis] = useState<PdfAnalysisSummary | null>(null)
  const [summaryOverall, setSummaryOverall] = useState<string | null>(null)
  const [summaryPerStandard, setSummaryPerStandard] = useState<Record<string, string>>({})
  const [summaryLoading, setSummaryLoading] = useState(false)

  function saveRecommendationState(next: SavedRecommendationState) {
    try {
      sessionStorage.setItem(RECOMMENDATION_SESSION_KEY, JSON.stringify(next))
    } catch {}
  }

  function restoreRecommendationState(): SavedRecommendationState | null {
    try {
      const raw = sessionStorage.getItem(RECOMMENDATION_SESSION_KEY)
      return raw ? JSON.parse(raw) as SavedRecommendationState : null
    } catch {
      return null
    }
  }

  function persistSummary(overall: string | null, perStandard: Record<string, string>) {
    const saved = restoreRecommendationState()
    if (!saved) return
    saveRecommendationState({ ...saved, summaryOverall: overall, summaryPerStandard: perStandard })
  }

  // Fired after recommendations render; runs independently so a slow LLM call
  // never blocks the main results from showing.
  async function fetchSummary(q: string, items: RecommendationItem[]) {
    if (items.length === 0) {
      setSummaryOverall(null)
      setSummaryPerStandard({})
      return
    }
    setSummaryLoading(true)
    try {
      const res = await getSummary({
        query: q,
        lang,
        items: items.slice(0, MAX_SUMMARY_ITEMS).map((item) => ({
          standard_id: item.standard_id,
          score: item.score,
          matched_requirements: item.matched_requirements,
        })),
      })
      const overall = res.available && res.overall ? res.overall : null
      const perStandard = res.available ? res.per_standard : {}
      setSummaryOverall(overall)
      setSummaryPerStandard(perStandard)
      persistSummary(overall, perStandard)
    } catch {
      // The AI summary is a nice-to-have; fail silently and just hide the panel.
      setSummaryOverall(null)
      setSummaryPerStandard({})
    } finally {
      setSummaryLoading(false)
    }
  }

  async function run(spec?: string) {
    const q = (spec ?? query).trim()
    if (!q) return
    setSimilarityMap([])
    setRequestId(null)
    setSummaryOverall(null)
    setSummaryPerStandard({})
    setLoading(true)
    try {
      const res = await getRecommendations({ query: q, document_name: null, filters }, lang)
      setResults(res.recommendations)
      setSelectedIds(new Set())
      setSimilarityMap(res.similarity_map ?? [])
      setRequestId(res.request_id)
      setPdfAnalysis(res.pdf_analysis ?? null)
      saveRecommendationState({
        query: q,
        filters,
        results: res.recommendations,
        similarityMap: res.similarity_map ?? [],
        requestId: res.request_id,
        pdfAnalysis: res.pdf_analysis ?? null,
        summaryOverall: null,
        summaryPerStandard: {},
      })
      invalidateSearchHistory()
      toast.success(`${res.recommendations.length} ${t('results.toast')}`)
      // Don't await: the AI summary loads in the background, on top of the results.
      void fetchSummary(q, res.recommendations)
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
      return
    }
    const saved = restoreRecommendationState()
    if (saved?.results) {
      setQuery(saved.query || '')
      setFilters(saved.filters || NO_FILTERS)
      setResults(saved.results)
      setSimilarityMap(saved.similarityMap || [])
      setRequestId(saved.requestId || null)
      setPdfAnalysis(saved.pdfAnalysis || null)
      setSummaryOverall(saved.summaryOverall ?? null)
      setSummaryPerStandard(saved.summaryPerStandard ?? {})
    }
    // The initial load intentionally restores state or handles a navigation query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (results !== null && query.trim()) run()
    // Refresh localized result text when the selected language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  function toggleCompare(standardId: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(standardId)) next.delete(standardId)
      else {
        if (next.size >= 4) {
          toast.error('You can compare up to 4 standards.')
          return current
        }
        next.add(standardId)
      }
      return next
    })
  }

  return (
    <div data-testid="recommendation-page" className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="panel p-5"><SpecForm query={query} onQueryChange={setQuery} onSubmit={() => run()} loading={loading} /></div>
        <div className="panel space-y-4 p-5">
          <div className="flex items-center gap-2 text-slate-300"><SlidersHorizontal className="h-4 w-4 text-accent" /><h3 className="font-display text-sm font-semibold">Filters</h3></div>
          <FilterPanel value={filters} onChange={setFilters} />
        </div>
      </div>
      <div className="min-w-0">
        {loading ? <Loader label={t('form.matching')} /> : results === null ? (
          <div className="panel flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center"><h2 className="font-display text-xl font-semibold text-slate-200">{t('results.ready')}</h2><p className="mt-2 max-w-md text-sm text-slate-500">{t('results.readyDesc')}</p></div>
        ) : (
          <div className="space-y-4">
            <SemanticMatchDonutGrid items={results} />
            <AiSummaryPanel loading={summaryLoading} overall={summaryOverall} />
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-slate-100">{results.length} {t('results.count')}</h2><div className="flex items-center gap-3">{selectedIds.size >= 2 && <button type="button" onClick={() => navigate(`/compare-standards?ids=${Array.from(selectedIds).join(',')}`)} className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20">Compare Selected ({selectedIds.size})</button>}{requestId && <span className="font-mono text-[11px] text-slate-600">req {requestId.slice(0, 8)}</span>}</div></div>
            <ResultsList
              items={results}
              selectedIds={selectedIds}
              onToggleCompare={toggleCompare}
              aiSummaries={summaryPerStandard}
              aiSummariesLoading={summaryLoading}
            />
            <NormativeGraph query={query} items={results} pdfAnalysis={pdfAnalysis} />
          </div>
        )}
        <SimilarityMap points={similarityMap} />
      </div>
    </div>
  )
}