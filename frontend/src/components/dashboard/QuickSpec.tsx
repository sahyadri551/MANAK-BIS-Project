import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useI18n } from '../../i18n'

export function QuickSpec() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { t } = useI18n()

  function run() {
    if (!query.trim()) return
    navigate('/recommendation', { state: { query } })
  }

  return (
    <div className="panel relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-display text-base font-semibold text-slate-100">{t('quick.title')}</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t('quick.subtitle')}</p>
        <textarea
          data-testid="quick-spec-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run()
          }}
          rows={3}
          placeholder={t('quick.placeholder')}
          className="field mt-3 resize-none"
        />
        <button
          type="button"
          data-testid="quick-spec-submit"
          onClick={run}
          disabled={!query.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {t('quick.recommend')} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
