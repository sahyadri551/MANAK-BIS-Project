import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { useI18n } from '../../i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div data-testid="not-found-page" className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-display text-7xl font-extrabold text-slate-800">404</div>
      <h1 className="mt-2 font-display text-2xl font-bold text-slate-100">{t('notfound.title')}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{t('notfound.desc')}</p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Home className="h-4 w-4" /> {t('notfound.dashboard')}
        </Link>
        <Link
          to="/recommendation"
          className="inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-surface-2/60"
        >
          <Compass className="h-4 w-4" /> {t('notfound.recommend')}
        </Link>
      </div>
    </div>
  )
}
