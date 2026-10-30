import { useNavigate } from 'react-router-dom'
import { LangToggle } from '../../components/LangToggle'
import { formatearDia } from '../format'
import { etiquetaUsuario } from '../roles'
import { useMvp } from '../state'
import { t } from '../../i18n'

/** Barra de la demo: quién está dentro, el reloj simulado y los controles de reinicio. */
export function MvpBar() {
  const { estado, usuario, despachar } = useMvp()
  const navegar = useNavigate()

  return (
    <div
      className="mvpbar"
      role="region"
      aria-label={t('Controles de la demo', 'Controles da demonstração')}
    >
      <div className="mvpbar__inner">
        <p className="mvpbar__who">
          {usuario ? (
            <>
              <strong>{usuario.nombre}</strong>
              <span className="muted"> {t('·')}{" "}{etiquetaUsuario(usuario)}</span>
            </>
          ) : (
            <span className="muted">{t('Demo · datos ficticios', 'Demo · dados fictícios')}</span>
          )}
        </p>
        <div className="mvpbar__actions">
          <LangToggle />
          <span
            className="mvpbar__clock"
            title={t('Fecha simulada de la demo', 'Data simulada da demonstração')}
          >
            {formatearDia(estado.hoy)}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => despachar({ tipo: 'avanzar-dia' })}
          >
            {t('+1 día', '+1 dia')}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              for (let i = 0; i < 7; i++) despachar({ tipo: 'avanzar-dia' })
            }}
          >
            {t('+7 días', '+7 dias')}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              despachar({ tipo: 'reiniciar' })
              navegar('/mvp')
            }}
          >
            {t('Reiniciar', 'Reiniciar')}
          </button>
          {usuario ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                despachar({ tipo: 'logout' })
                navegar('/mvp')
              }}
            >
              {t('Salir', 'Sair')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
