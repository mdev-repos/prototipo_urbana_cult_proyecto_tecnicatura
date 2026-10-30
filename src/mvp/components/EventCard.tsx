import type { Evento } from '../types'
import { formatearFecha, formatearHora, formatearPesos } from '../format'
import { t } from '../../i18n'

type Props = {
  evento: Evento
  centro: string
  artista: string
  /** Entradas que todavía se pueden comprar. */
  quedan?: number
  /** Acción principal de la tarjeta (comprar, vender...). Si falta, no se muestra botón. */
  accion?: { etiqueta: string; onClick: () => void; deshabilitada?: boolean }
}

/** Tono estable por evento, para que cada carátula generada tenga su propio color. */
function tono(id: string): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

export function EventCard({ evento, centro, artista, quedan, accion }: Props) {
  const h = tono(evento.id)
  return (
    <article className="event">
      <div
        className="event__cover"
        style={{
          background: `linear-gradient(135deg, hsl(${h} 45% 30%), hsl(${(h + 50) % 360} 50% 16%))`,
        }}
      >
        <span className="event__tag">{t(evento.categoria)}</span>
        {evento.destacado ? <span className="event__tag event__tag--star">{t('Destacado')}</span> : null}
        <p className="event__cover-title">{evento.titulo}</p>
      </div>
      <div className="event__body">
        <p className="event__meta">
          {artista} {t('·')}{" "}{centro}
        </p>
        <p className="event__desc">{t(evento.descripcion)}</p>
        <div className="event__foot">
          <div>
            <p className="event__when">
              {formatearFecha(evento.fecha)} {t('·')}{" "}{formatearHora(evento.fecha)} {t('h')}</p>
            <p className="event__price">{formatearPesos(evento.precio)}</p>
            {quedan !== undefined ? (
              <p className={quedan <= 10 ? 'event__left event__left--low' : 'event__left'}>
                {quedan === 0 ? t('Agotado') : t('Quedan {n}', { n: quedan })}
              </p>
            ) : null}
          </div>
          {accion ? (
            <button
              type="button"
              className="btn"
              onClick={accion.onClick}
              disabled={accion.deshabilitada}
            >
              {accion.etiqueta}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
