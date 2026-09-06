import { ArrowRight, Sparkles } from 'lucide-react'
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
  const { t } = useI18n()
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
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSubmit()
          }}
          rows={5}
          placeholder={t('form.placeholder')}
          className="field resize-none font-sans leading-relaxed"
        />
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
