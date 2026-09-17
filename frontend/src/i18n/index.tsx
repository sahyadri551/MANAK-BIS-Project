import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { setApiLang } from '../services/api'
import { en } from './locales/en'
import { hi } from './locales/hi'
import { ta } from './locales/ta'
import { bn } from './locales/bn'
import { te } from './locales/te'
import { mr } from './locales/mr'
import { gu } from './locales/gu'
import { kn } from './locales/kn'
import { ml } from './locales/ml'
import { pa } from './locales/pa'
import { or } from './locales/or'
import { ur } from './locales/ur'

export type Lang = 'en' | 'hi' | 'ta' | 'bn' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'ur'

// Languages whose script reads right-to-left. Used to flip document direction.
export const RTL_LANGS: ReadonlySet<Lang> = new Set(['ur'])

// All supported language codes, in the order they should appear in pickers.
export const SUPPORTED_LANGS: Lang[] = ['en', 'hi', 'ta', 'bn', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur']

const DICTS: Record<Lang, Record<string, string>> = { en, hi, ta, bn, te, mr, gu, kn, ml, pa, or, ur }

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
})

function isSupportedLang(code: string): code is Lang {
  return (SUPPORTED_LANGS as string[]).includes(code)
}

function detectLang(): Lang {
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const p of prefs) {
    const code = (p || '').toLowerCase().split('-')[0]
    if (isSupportedLang(code)) return code
  }
  return 'en'
}

function initialLang(): Lang {
  const stored = localStorage.getItem('bis-lang')
  if (stored && isSupportedLang(stored)) return stored
  // First visit: follow the browser's preferred language, then it sticks.
  return detectLang()
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    setApiLang(lang)
    localStorage.setItem('bis-lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const t = (key: string) => DICTS[lang][key] ?? DICTS.en[key] ?? key

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
