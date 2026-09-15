import { useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { VoiceInput } from '../common/VoiceInput'
import { useI18n } from '../../i18n'

const SAMPLES = [
  '43 grade OPC cement for RCC slab, 28-day compressive strength 43 MPa, low chloride',
  'Cotton sewing thread with high breaking strength and colour fastness to washing',
  'Lithium-ion battery pack safety for portable device, overcharge and short-circuit protection',
  'Packaged drinking water quality limits — pH, turbidity, microbial and arsenic',
]

type Props = {
  query: string
  onQueryChange: (q: string) => void
  onSubmit: () => void
  loading: boolean
}

export function SpecForm({ query, onQueryChange, onSubmit, loading }: Props) {
  const { t, lang } = useI18n()
  const voiceLanguage: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN' }
  // Snapshot of query text at the moment the user starts speaking.
  // Each transcript result replaces only the voice portion, so partial/
  // progressive results don't accumulate into duplicated text.
  const preVoiceQueryRef = useRef<string | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="spec" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {t('form.specLabel')}
        </label>
        <textarea
          id="spec"
          data-testid="spec-input-textarea"
          value={query}
          onChange={(e) => {
            // If the user types manually, discard the saved snapshot so the
            // next voice session starts fresh from the updated text.
            preVoiceQueryRef.current = null
            onQueryChange(e.target.value)
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSubmit()
          }}
          rows={5}
          placeholder={t('form.placeholder')}
          className="field resize-none font-sans leading-relaxed"
        />
        <div className="mt-2 flex justify-end">
          <VoiceInput
            disabled={loading}
            language={voiceLanguage[lang] ?? 'en-IN'}
            onSessionStart={() => {
              // Capture what was in the box before the mic opened.
              preVoiceQueryRef.current = query.trim()
            }}
            onTranscript={(text) => {
              const transcript = text.trim()
              if (!transcript) return
              // Always rebuild from the pre-voice snapshot so progressive
              // results replace each other instead of stacking up.
              const base = preVoiceQueryRef.current ?? query.trim()
              onQueryChange(base ? `${base} ${transcript}` : transcript)
            }}
            onSessionEnd={() => {
              // Reset so the next session snapshots the final text.
              preVoiceQueryRef.current = null
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600">{t('form.tipRun')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s, i) => (
          <button
            key={i}
            type="button"
            data-testid={`sample-spec-${i}`}
            onClick={() => onQueryChange(s)}
            className="rounded-full border border-hairline bg-surface-2/40 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-accent/50 hover:text-slate-200"
          >
            {s.length > 46 ? `${s.slice(0, 46)}…` : s}
          </button>
        ))}
      </div>

      <button
        type="button"
        data-testid="spec-submit-button"
        disabled={loading || !query.trim()}
        onClick={onSubmit}
        className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" />
        {loading ? t('form.matching') : t('form.submit')}
        {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
      </button>
    </div>
  )
}