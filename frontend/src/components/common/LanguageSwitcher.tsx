import { useI18n, type Lang } from '../../i18n'
import { cn } from '../../utils/cn'

// Short label shown on the trigger, plus the option text shown in the dropdown
// (native name first, English gloss in parens so anyone can still find their language).
const OPTIONS: { value: Lang; short: string; label: string }[] = [
  { value: 'en', short: 'EN', label: 'English' },
  { value: 'hi', short: 'हिं', label: 'हिंदी (Hindi)' },
  { value: 'bn', short: 'বা', label: 'বাংলা (Bengali)' },
  { value: 'te', short: 'తె', label: 'తెలుగు (Telugu)' },
  { value: 'mr', short: 'म', label: 'मराठी (Marathi)' },
  { value: 'ta', short: 'த', label: 'தமிழ் (Tamil)' },
  { value: 'ur', short: 'اردو', label: 'اردو (Urdu)' },
  { value: 'gu', short: 'ગુ', label: 'ગુજરાતી (Gujarati)' },
  { value: 'kn', short: 'ಕ', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'ml', short: 'മ', label: 'മലയാളം (Malayalam)' },
  { value: 'or', short: 'ଓଡ଼ି', label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'pa', short: 'ਪੰ', label: 'ਪੰਜਾਬੀ (Punjabi)' },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  const current = OPTIONS.find((o) => o.value === lang) ?? OPTIONS[0]

  return (
    <div
      data-testid="language-switcher"
      className={cn(
        'relative inline-flex items-center rounded-lg border border-hairline bg-surface-2/40',
        'px-2 py-1 text-xs font-semibold text-slate-100',
      )}
    >
      <span aria-hidden className="pointer-events-none pr-1">
        {current.short}
      </span>
      <select
        aria-label="Choose language"
        data-testid="language-select"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className={cn(
          'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent',
          'text-transparent outline-none',
        )}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2 text-slate-100">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none ml-1 h-3 w-3 text-slate-400"
      >
        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
