import { useEffect, useState } from 'react'
import { AlertTriangle, FileSearch, FileText, Hash, Layers3, ScanText } from 'lucide-react'
import { toast } from 'sonner'
import { PdfUploadZone } from '../../components/recommendation/PdfUploadZone'
import { FilterPanel } from '../../components/recommendation/FilterPanel'
import { ResultsList } from '../../components/recommendation/ResultsList'
import { LineItemRecommendations } from '../../components/recommendation/LineItemRecommendations'
import { SemanticMatchDonutGrid } from '../../components/recommendation/SemanticMatchDonutGrid'
import { SimilarityMap } from '../../components/recommendation/SimilarityMap'
import { Loader } from '../../components/common/Loader'
import { analyzePdfStream } from '../../services/pdfApi'
import { invalidateSearchHistory } from '../../services/standardsApi'
import { useI18n } from '../../i18n'
import type { PdfAnalysisSummary, PdfLineItem, RecommendationFilters, RecommendationItem, SimilarityMapPoint } from '../../types/recommendation'

const NO_FILTERS: RecommendationFilters = { status: null, department: null, aspect: null }
const PDF_STATE_KEY = 'manak-bis-pdf-analysis-state'

type PdfState = {
  filters: RecommendationFilters
  summary: PdfAnalysisSummary | null
  results: RecommendationItem[]
  similarityMap: SimilarityMapPoint[]
  lineItems: PdfLineItem[]
}

import { pdfCopy } from '../../i18n/pdfCopy'

function Stat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-2/30 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </div>
      <div className="mt-2 font-display text-xl font-semibold text-slate-100">{value}</div>
    </div>
  )
}

function AnalysisSummary({ summary, lang }: { summary: PdfAnalysisSummary; lang: Lang }) {
  return (
    <div className="panel space-y-5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <FileSearch className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-slate-100">{pdfCopy(lang, "analysis")}</h2>
          <p className="mt-1 truncate font-mono text-xs text-slate-500">{summary.file_name}</p>
          {summary.document_title && <p className="mt-2 text-sm text-slate-300">{summary.document_title}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={FileText} label={pdfCopy(lang, "pages")} value={summary.page_count} />
        <Stat icon={ScanText} label={pdfCopy(lang, "readable")} value={`${summary.readable_pages}/${summary.page_count}`} />
        <Stat icon={Hash} label={pdfCopy(lang, "words")} value={summary.word_count.toLocaleString()} />
        <Stat icon={Layers3} label={pdfCopy(lang, "refs")} value={summary.detected_references.length} />
      </div>
      {summary.extraction_warnings.length > 0 && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> {pdfCopy(lang, 'notes')}</div>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">{summary.extraction_warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-hairline bg-surface-2/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{pdfCopy(lang, 'detected')}</h3>
          <div className="mt-3 flex flex-wrap gap-2">{summary.detected_is_numbers.length ? summary.detected_is_numbers.map((item) => <span key={item} className="rounded-md border border-accent/20 bg-accent/5 px-2 py-1 font-mono text-[11px] text-accent">{item}</span>) : <span className="text-xs text-slate-600">{pdfCopy(lang, 'none')}</span>}</div>
        </div>
        <div className="rounded-xl border border-hairline bg-surface-2/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{pdfCopy(lang, 'sections')}</h3>
          <div className="mt-3 flex flex-wrap gap-2">{summary.detected_sections.length ? summary.detected_sections.map((item) => <span key={item} className="rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] text-slate-300">{item}</span>) : <span className="text-xs text-slate-600">{pdfCopy(lang, 'noSections')}</span>}</div>
        </div>
        <div className="rounded-xl border border-hairline bg-surface-2/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{pdfCopy(lang, 'referenced')}</h3>
          <div className="mt-3 flex flex-wrap gap-2">{summary.detected_references.length ? summary.detected_references.map((item) => <span key={item} className="rounded-md border border-hairline bg-surface px-2 py-1 font-mono text-[11px] text-slate-300">{item}</span>) : <span className="text-xs text-slate-600">{pdfCopy(lang, 'noRefs')}</span>}</div>
        </div>
      </div>
      {summary.pages.length > 0 && (
        <details className="group rounded-xl border border-hairline bg-surface-2/20">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-300">{pdfCopy(lang, 'details')}</summary>
          <div className="border-t border-hairline px-4 pb-4"><div className="divide-y divide-hairline">{summary.pages.map((page) => <div key={page.page} className="grid gap-2 py-3 md:grid-cols-[80px_100px_1fr]"><span className="text-xs font-semibold text-slate-400">{pdfCopy(lang, 'page')} {page.page}</span><span className="font-mono text-[11px] text-slate-600">{page.characters.toLocaleString()} {pdfCopy(lang, 'characters')}</span><span className="text-xs leading-5 text-slate-500">{page.preview}</span></div>)}</div></div>
        </details>
      )}
    </div>
  )
}

export default function PdfAnalysis() {
  const { t, lang } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [filters, setFilters] = useState<RecommendationFilters>(NO_FILTERS)
  const [summary, setSummary] = useState<PdfAnalysisSummary | null>(null)
  const [results, setResults] = useState<RecommendationItem[]>([])
  const [similarityMap, setSimilarityMap] = useState<SimilarityMapPoint[]>([])
  const [lineItems, setLineItems] = useState<PdfLineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [lineItemProgress, setLineItemProgress] = useState<{ completed: number; total: number } | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PDF_STATE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as PdfState
      setFilters(saved.filters || NO_FILTERS)
      setSummary(saved.summary || null)
      setResults(saved.results || [])
      setSimilarityMap(saved.similarityMap || [])
      setLineItems(saved.lineItems || [])
    } catch {
      sessionStorage.removeItem(PDF_STATE_KEY)
    }
  }, [])

  async function runAnalysis() {
    if (!file) return
    setLoading(true)
    setMatching(false)
    setLineItemProgress(null)
    setSummary(null)
    setResults([])
    setSimilarityMap([])
    setLineItems([])

    let latestSummary: PdfAnalysisSummary | null = null
    let latestResults: RecommendationItem[] = []
    let latestSimilarityMap: SimilarityMapPoint[] = []
    let latestLineItems: PdfLineItem[] = []

    try {
      await analyzePdfStream(file, filters, lang, (event) => {
        if (event.stage === 'summary') {
          latestSummary = event.data
          setSummary(event.data)
          setLoading(false) // fast stats are in; keep showing progress for the slower ML matching below
          setMatching(true)
        } else if (event.stage === 'recommendations') {
          latestResults = event.data.recommendations
          latestSimilarityMap = event.data.similarity_map
          setResults(latestResults)
          setSimilarityMap(latestSimilarityMap)
        } else if (event.stage === 'line_item') {
          latestLineItems = [...latestLineItems, event.data]
          setLineItems(latestLineItems)
          setLineItemProgress(event.progress)
        } else if (event.stage === 'done') {
          setMatching(false)
          setLineItemProgress(null)
          try {
            sessionStorage.setItem(
              PDF_STATE_KEY,
              JSON.stringify({ filters, summary: latestSummary, results: latestResults, similarityMap: latestSimilarityMap, lineItems: latestLineItems }),
            )
          } catch {}
          invalidateSearchHistory()
          toast.success(`${latestResults.length} ${pdfCopy(lang, 'standardsMatched')}`)
        } else if (event.stage === 'error') {
          throw new Error(event.message)
        }
      })
    } catch (error) {
      console.error(error)
      toast.error(pdfCopy(lang, 'pdfFailed'))
    } finally {
      setLoading(false)
      setMatching(false)
    }
  }

  return (
    <div data-testid="pdf-analysis-page" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{pdfCopy(lang, 'pageLabel')}</p><h1 className="mt-2 font-display text-2xl font-bold text-slate-100">{pdfCopy(lang, 'title')}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{pdfCopy(lang, 'description')}</p></div></div>
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5"><div className="panel space-y-4 p-5"><div><h2 className="font-display text-sm font-semibold text-slate-200">{pdfCopy(lang, "source")}</h2><p className="mt-1 text-xs text-slate-600">{pdfCopy(lang, "sourceHint")}</p></div><PdfUploadZone file={file} onFileChange={setFile} onAnalyze={runAnalysis} analyzing={loading} /><FilterPanel value={filters} onChange={setFilters} /></div></div>
        <div className="min-w-0 space-y-5">
          {loading && !summary ? (
            <Loader label={t('form.matching')} />
          ) : summary ? (
            <>
              <AnalysisSummary summary={summary} lang={lang} />
              {matching && (
                <div className="panel flex items-center gap-3 p-4 text-sm text-slate-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  {lineItemProgress
                    ? `${pdfCopy(lang, 'matchingLineItems')} ${lineItemProgress.completed}/${lineItemProgress.total}…`
                    : `${pdfCopy(lang, 'matchingStandards')}…`}
                </div>
              )}
              {lineItems.length > 0 && (
                <LineItemRecommendations
                  items={lineItems}
                  title={pdfCopy(lang, 'lineItemsTitle')}
                  description={pdfCopy(lang, 'lineItemsDesc')}
                  itemLabel={pdfCopy(lang, 'matches')}
                  noMatchesLabel={pdfCopy(lang, 'lineItemsNoMatch')}
                />
              )}
              {results.length > 0 && <SemanticMatchDonutGrid items={results} />}
              <div className="panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-100">{pdfCopy(lang, 'recommended')}</h2>
                    <p className="mt-1 text-xs text-slate-500">{pdfCopy(lang, 'recommendedDesc')}</p>
                  </div>
                  <span className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 font-mono text-xs text-accent">
                    {results.length} {pdfCopy(lang, 'matches')}
                  </span>
                </div>
                <div className="mt-4">
                  <ResultsList items={results} selectedIds={new Set()} onToggleCompare={() => undefined} returnTo="/pdf-analysis" />
                </div>
              </div>
              <SimilarityMap points={similarityMap} />
            </>
          ) : (
            <div className="panel flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <FileSearch className="h-10 w-10 text-accent/60" />
              <h2 className="mt-4 font-display text-xl font-semibold text-slate-200">{pdfCopy(lang, 'ready')}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{pdfCopy(lang, 'readyDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}