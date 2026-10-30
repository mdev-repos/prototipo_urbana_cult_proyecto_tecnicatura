import { useLang, type Lang } from '../i18n'

function BanderaAr() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" fill="#74acdf" />
      <rect y="5.33" width="24" height="5.34" fill="#f4f2ec" />
      <circle cx="12" cy="8" r="1.7" fill="#e8a33d" />
    </svg>
  )
}

function BanderaBr() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" fill="#2f9e5f" />
      <path d="M12 2.2 21.2 8 12 13.8 2.8 8Z" fill="#e8c43d" />
      <circle cx="12" cy="8" r="3.1" fill="#27468f" />
    </svg>
  )
}

const IDIOMAS: { lang: Lang; nombre: string; bandera: () => React.JSX.Element }[] = [
  { lang: 'es', nombre: 'Español', bandera: BanderaAr },
  { lang: 'pt', nombre: 'Português', bandera: BanderaBr },
]

/** Selector de idioma del MVP, con la bandera de cada país. */
export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-toggle" role="group" aria-label="Idioma / Idioma">
      {IDIOMAS.map(({ lang: l, nombre, bandera: Bandera }) => (
        <button
          key={l}
          type="button"
          className={l === lang ? 'lang-toggle__btn is-active' : 'lang-toggle__btn'}
          aria-pressed={l === lang}
          aria-label={nombre}
          title={nombre}
          onClick={() => setLang(l)}
        >
          <Bandera />
        </button>
      ))}
    </div>
  )
}
