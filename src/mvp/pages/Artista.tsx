import { useState } from 'react'
import { EstadoCuenta } from '../components/EstadoCuenta'
import { EventCard } from '../components/EventCard'
import { SalasEnsayo } from '../components/SalasEnsayo'
import { disponibles, entradasNetas, netoVenta } from '../domain/ventas'
import { formatearCentavos, formatearFecha, formatearHora } from '../format'
import { artistas, useMvp } from '../state'
import { t } from '../../i18n'

type Pestana = 'eventos' | 'cuenta' | 'salas' | 'ensayo'

export function Artista() {
  const { estado, usuario } = useMvp()
  const [pestana, setPestana] = useState<Pestana>('eventos')
  if (!usuario?.artistaId) return null
  const artistaId = usuario.artistaId

  const propios = estado.eventos
    .filter((e) => e.artistaId === artistaId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const activos = propios.filter((e) => !e.baja)

  const filas = propios.map((evento) => {
    const ventas = estado.ventas.filter((v) => v.eventoId === evento.id)
    const parte = estado.asientos
      .filter((a) => a.eventoId === evento.id && a.beneficiario === 'artista')
      .reduce((s, a) => s + a.montoCentavos, 0)
    return {
      evento,
      centro: estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? '',
      entradas: ventas.reduce((s, v) => s + entradasNetas(v), 0),
      recaudado: ventas.reduce((s, v) => s + netoVenta(v), 0),
      parte,
    }
  })

  const entradasTotal = filas.reduce((s, f) => s + (f.evento.baja ? 0 : f.entradas), 0)
  const parteTotal = filas.reduce((s, f) => s + f.parte, 0)
  const proxima = activos.find((e) => e.fecha.slice(0, 10) >= estado.hoy)

  // Cartelera de los centros donde el artista tiene funciones (solo lectura).
  const centrosDelArtista = new Set(activos.map((e) => e.centroId))
  const deMisSalas = estado.eventos
    .filter((e) => centrosDelArtista.has(e.centroId) && !e.baja)
    .filter((e) => e.fecha.slice(0, 10) >= estado.hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <div className="page">
      <p className="eyebrow">{t('Artista')}</p>
      <h1>
        {t('Hola,')} {usuario.nombre.split(' ')[0]}
      </h1>
      <p className="lead">
        {t(
          'Seguí tus funciones, cuántas entradas se vendieron y cómo se reparte lo recaudado. Es una vista de consulta: los eventos los gestiona cada centro.',
        )}
      </p>

      <dl className="kpis">
        <div>
          <dt>{t('Funciones activas')}</dt>
          <dd>{activos.length}</dd>
        </div>
        <div>
          <dt>{t('Entradas vendidas')}</dt>
          <dd>{entradasTotal}</dd>
        </div>
        <div>
          <dt>{t('Tu parte acumulada')}</dt>
          <dd>{formatearCentavos(parteTotal)}</dd>
        </div>
        <div>
          <dt>{t('Próxima función')}</dt>
          <dd className="kpi--small">
            {proxima ? `${formatearFecha(proxima.fecha)} · ${formatearHora(proxima.fecha)} h` : '—'}
          </dd>
        </div>
      </dl>

      <div className="tabs" role="tablist" aria-label={t('Secciones del panel')}>
        {(
          [
            ['eventos', t('Mis eventos')],
            ['cuenta', t('Estado de cuenta')],
            ['salas', t('Cartelera de mis salas')],
            ['ensayo', t('Salas de ensayo')],
          ] as const
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            className={pestana === id ? 'tab is-active' : 'tab'}
            onClick={() => setPestana(id)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'eventos' ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('Evento')}</th>
                <th>{t('Fecha')}</th>
                <th>{t('Ocupación')}</th>
                <th className="num">{t('Recaudado')}</th>
                <th className="num">{t('Tu parte')}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.evento.id} className={f.evento.baja ? 'row--off' : undefined}>
                  <td>
                    {f.evento.titulo}
                    <br />
                    <span className="muted">{f.centro}</span>
                  </td>
                  <td>
                    {formatearFecha(f.evento.fecha)}
                    <br />
                    <span className="muted">
                      {formatearHora(f.evento.fecha)} {t('h')}
                    </span>
                  </td>
                  <td>
                    <div
                      className="bar"
                      role="img"
                      aria-label={t('{vendidas} de {cupo} entradas vendidas', {
                        vendidas: f.entradas,
                        cupo: f.evento.cupo,
                      })}
                    >
                      <span
                        style={{ width: `${Math.min(100, (f.entradas / f.evento.cupo) * 100)}%` }}
                      />
                    </div>
                    <span className="muted bar__label">
                      {f.entradas} {t('/')} {f.evento.cupo}
                    </span>
                  </td>
                  <td className="num">{formatearCentavos(f.recaudado)}</td>
                  <td className="num">{formatearCentavos(f.parte)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {pestana === 'cuenta' ? (
        <EstadoCuenta beneficiario="artista" beneficiarioId={artistaId} />
      ) : null}

      {pestana === 'salas' ? (
        <>
          <p className="muted">
            {t(
              'Lo que se presenta en los centros donde tenés funciones: ahí mismo se ve la competencia por la portada y por el público.',
            )}
          </p>
          <div className="events" style={{ marginTop: '1.25rem' }}>
            {deMisSalas.map((evento) => (
              <EventCard
                key={evento.id}
                evento={evento}
                centro={estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? ''}
                artista={artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''}
                quedan={disponibles(evento, estado.ventas, estado.reservas, Date.now())}
              />
            ))}
          </div>
        </>
      ) : null}

      {pestana === 'ensayo' ? <SalasEnsayo /> : null}
    </div>
  )
}
