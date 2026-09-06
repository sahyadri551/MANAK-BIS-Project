import { useI18n, type Lang } from '../../i18n'
import { cn } from '../../utils/cn'

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'हि' },
  { value: 'ta', label: 'த' },
  { value: 'bn', label: 'বা' },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <div
      data-testid="language-switcher"
      className="inline-flex items-center rounded-lg border border-hairline bg-surface-2/40 p-0.5"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          data-testid={`lang-${o.value}`}
          onClick={() => setLang(o.value)}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold transition-colors',
            lang === o.value ? 'bg-accent text-white' : 'text-slate-400 hover:text-slate-100',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
