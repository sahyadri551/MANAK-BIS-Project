import { api } from './api'
import type {
  PdfAnalysisSummary,
  PdfLineItem,
  RecommendationFilters,
  RecommendationItem,
  RecommendResponse,
  SimilarityMapPoint,
} from '../types/recommendation'

export async function analyzePdf(file: File, filters: RecommendationFilters, lang: string): Promise<RecommendResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<RecommendResponse>('/pdf/analyze', formData, {
    params: {
      status: filters.status ?? undefined,
      department: filters.department ?? undefined,
      aspect: filters.aspect ?? undefined,
      lang,
    },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export type PdfStreamEvent =
  | { stage: 'summary'; data: PdfAnalysisSummary }
  | { stage: 'recommendations'; data: { request_id: string; recommendations: RecommendationItem[]; similarity_map: SimilarityMapPoint[] } }
  | { stage: 'line_item'; data: PdfLineItem; progress: { completed: number; total: number } }
  | { stage: 'done'; data: RecommendResponse }
  | { stage: 'error'; message: string }

/**
 * Streams /pdf/analyze/stream as newline-delimited JSON so the UI can show
 * fast results (page/word counts, detected IS numbers) immediately and fill
 * in the slower ML matches as they complete, rather than blocking on the
 * whole pipeline. Calls `onEvent` once per stage as it arrives.
 */
export async function analyzePdfStream(
  file: File,
  filters: RecommendationFilters,
  lang: string,
  onEvent: (event: PdfStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)

  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.department) params.set('department', filters.department)
  if (filters.aspect) params.set('aspect', filters.aspect)
  params.set('lang', lang)

  const baseUrl = api.defaults.baseURL ?? ''
  const response = await fetch(`${baseUrl}/pdf/analyze/stream?${params.toString()}`, {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!response.ok || !response.body) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      detail = body?.detail ?? detail
    } catch {
      /* ignore non-JSON error body */
    }
    throw new Error(detail)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)
      if (!line) continue
      onEvent(JSON.parse(line) as PdfStreamEvent)
    }
  }

  const trailing = buffer.trim()
  if (trailing) {
    onEvent(JSON.parse(trailing) as PdfStreamEvent)
  }
}
