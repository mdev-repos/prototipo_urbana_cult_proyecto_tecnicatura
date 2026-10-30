import { Fragment, createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PT } from './pt'

export type Lang = 'es' | 'pt'

const STORAGE_KEY = 'uc-lang'

type Vars = Record<string, string | number>

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'es' || stored === 'pt') return stored
  } catch {
    // sin acceso a localStorage: se usa el valor por defecto
  }
  return 'es'
}

/** Idioma activo. Es de módulo para que `t` pueda usarse también fuera de los componentes. */
let actual: Lang = readStoredLang()

export function idioma(): Lang {
  return actual
}

function rellenar(texto: string, vars?: Vars): string {
  if (!vars) return texto
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

/**
 * Traduce un texto escrito en español. En portugués usa la traducción del diccionario o, si se la
 * pasa en el segundo argumento, esa. Los `{nombre}` se reemplazan con las variables.
 */
export function t(es: string, b?: string | Vars, c?: Vars): string {
  const pt = typeof b === 'string' ? b : undefined
  const vars = typeof b === 'object' ? b : c
  if (actual === 'es') return rellenar(es, vars)
  return rellenar(pt ?? PT[es] ?? es, vars)
}

type Ctx = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: typeof t
}

const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(actual)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // idem
    }
  }, [lang])

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        actual = l
        setLangState(l)
      },
      t,
    }),
    [lang],
  )

  // Al cambiar de idioma se vuelve a montar el árbol, así todo se redibuja con los textos nuevos.
  return (
    <LangContext.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </LangContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang(): Ctx {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang debe usarse dentro de LangProvider')
  return ctx
}
