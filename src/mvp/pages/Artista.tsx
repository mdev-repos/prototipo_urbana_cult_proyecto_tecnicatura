import { useState } from 'react'
import { EstadoCuenta } from '../components/EstadoCuenta'
import { EventCard } from '../components/EventCard'
import { disponibles, entradasNetas, netoVenta } from '../domain/ventas'
import { formatearCentavos, formatearFecha, formatearHora } from '../format'
import { artistas, useMvp } from '../state'

type Pestana = 'eventos' | 'cuenta' | 'salas'

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
      <p className="eyebrow">Artista</p>
      <h1>Hola, {usuario.nombre.split(' ')[0]}</h1>
      <p className="lead">
        Seguí tus funciones, cuántas entradas se vendieron y cómo se reparte lo recaudado. Es una
        vista de consulta: los eventos los gestiona cada centro.
      </p>

      <dl className="kpis">
        <div>
          <dt>Funciones activas</dt>
          <dd>{activos.length}</dd>
        </div>
        <div>
          <dt>Entradas vendidas</dt>
          <dd>{entradasTotal}</dd>
        </div>
        <div>
          <dt>Tu parte acumulada</dt>
          <dd>{formatearCentavos(parteTotal)}</dd>
        </div>
        <div>
          <dt>Próxima función</dt>
          <dd className="kpi--small">
            {proxima ? `${formatearFecha(proxima.fecha)} · ${formatearHora(proxima.fecha)} h` : '—'}
          </dd>
        </div>
      </dl>

      <div className="tabs" role="tablist" aria-label="Secciones del panel">
        {(
          [
            ['eventos', 'Mis eventos'],
            ['cuenta', 'Estado de cuenta'],
            ['salas', 'Cartelera de mis salas'],
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
                <th>Evento</th>
                <th>Fecha</th>
                <th>Ocupación</th>
                <th className="num">Recaudado</th>
                <th className="num">Tu parte</th>
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
                    <span className="muted">{formatearHora(f.evento.fecha)} h</span>
                  </td>
                  <td>
                    <div
                      className="bar"
                      role="img"
                      aria-label={`${f.entradas} de ${f.evento.cupo} entradas vendidas`}
                    >
                      <span
                        style={{ width: `${Math.min(100, (f.entradas / f.evento.cupo) * 100)}%` }}
                      />
                    </div>
                    <span className="muted bar__label">
                      {f.entradas} / {f.evento.cupo}
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
            Lo que se presenta en los centros donde tenés funciones: ahí mismo se ve la competencia
            por la portada y por el público.
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
    </div>
  )
}
