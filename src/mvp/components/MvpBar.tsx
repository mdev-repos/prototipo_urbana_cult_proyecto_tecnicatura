import { useNavigate } from 'react-router-dom'
import { formatearDia } from '../format'
import { etiquetaUsuario } from '../roles'
import { useMvp } from '../state'

/** Barra de la demo: quién está dentro, el reloj simulado y los controles de reinicio. */
export function MvpBar() {
  const { estado, usuario, despachar } = useMvp()
  const navegar = useNavigate()

  return (
    <div className="mvpbar" role="region" aria-label="Controles de la demo">
      <div className="mvpbar__inner">
        <p className="mvpbar__who">
          {usuario ? (
            <>
              <strong>{usuario.nombre}</strong>
              <span className="muted"> · {etiquetaUsuario(usuario)}</span>
            </>
          ) : (
            <span className="muted">Demo · datos ficticios</span>
          )}
        </p>
        <div className="mvpbar__actions">
          <span className="mvpbar__clock" title="Fecha simulada de la demo">
            {formatearDia(estado.hoy)}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => despachar({ tipo: 'avanzar-dia' })}
          >
            +1 día
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              for (let i = 0; i < 7; i++) despachar({ tipo: 'avanzar-dia' })
            }}
          >
            +7 días
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              despachar({ tipo: 'reiniciar' })
              navegar('/mvp')
            }}
          >
            Reiniciar
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
              Salir
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
