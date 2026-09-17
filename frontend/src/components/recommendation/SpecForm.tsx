import { useRef, type FormEvent } from 'react'
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
  const voiceLanguage: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN', ur: 'ur-IN' }
  const preVoiceQueryRef = useRef<string | null>(null)

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!loading && query.trim()) onSubmit()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="spec" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-500">{t('form.specLabel')}</label>
        <textarea
          id="spec"
          data-testid="spec-input-textarea"
          value={query}
          onChange={(e) => { preVoiceQueryRef.current = null; onQueryChange(e.target.value) }}
          onKeyDown={(e) => {
            if (e.isComposing) return
            if (e.code === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              if (!loading && query.trim()) onSubmit()
            }
          }}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          rows={5}
          placeholder={t('form.placeholder')}
          className="field resize-none font-sans leading-relaxed"
        />
        <div className="mt-2 flex justify-end">
          <VoiceInput
            disabled={loading}
            language={voiceLanguage[lang] ?? 'en-IN'}
            onSessionStart={() => { preVoiceQueryRef.current = query.trim() }}
            onTranscript={(text) => {
              const transcript = text.trim()
              if (!transcript) return
              const base = preVoiceQueryRef.current ?? query.trim()
              onQueryChange(base ? `${base} ${transcript}` : transcript)
            }}
            onSessionEnd={() => { preVoiceQueryRef.current = null }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600">{t('form.tipRun')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s, i) => (
          <button key={i} type="button" data-testid={`sample-spec-${i}`} onClick={() => onQueryChange(s)} className="rounded-full border border-hairline bg-surface-2/40 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-accent/50 hover:text-slate-200">
            {s.length > 46 ? `${s.slice(0, 46)}…` : s}
          </button>
        ))}
      </div>

      <button type="submit" data-testid="spec-submit-button" disabled={loading || !query.trim()} className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
        <Sparkles className="h-4 w-4" />
        {loading ? t('form.matching') : t('form.submit')}
        {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
      </button>
    </form>
  )
}
