import { useState } from 'react'
import { EventCard } from '../components/EventCard'
import { VenderModal } from '../components/VenderModal'
import { cierreDelDia, totalesDeCaja, ventasDeCaja } from '../domain/caja'
import { disponibles } from '../domain/ventas'
import { formatearCentavos, formatearDia, formatearDiaCorto } from '../format'
import { useAhora } from '../hooks'
import { artistas, useMvp } from '../state'
import type { Evento } from '../types'

type Pestana = 'vender' | 'caja'

export function Vendedor() {
  const { estado, usuario, despachar } = useMvp()
  const ahora = useAhora(1000)
  const [pestana, setPestana] = useState<Pestana>('vender')
  const [vendiendo, setVendiendo] = useState<Evento | null>(null)
  const [contado, setContado] = useState('')

  if (!usuario || !usuario.centroId) return null

  const centro = estado.centros.find((c) => c.id === usuario.centroId)
  const eventos = estado.eventos
    .filter((e) => e.centroId === usuario.centroId)
    .filter((e) => !e.baja && e.fecha.slice(0, 10) >= estado.hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const ventasHoy = ventasDeCaja(estado.ventas, usuario.id, estado.hoy)
  const totales = totalesDeCaja(ventasHoy)
  const cierre = cierreDelDia(estado.cierres, usuario.id, estado.hoy)
  const historial = estado.cierres.filter((c) => c.vendedorId === usuario.id).reverse()

  const contadoCentavos = Math.round(Number(contado.replace(',', '.')) * 100)
  const contadoValido =
    contado.trim() !== '' && Number.isFinite(contadoCentavos) && contadoCentavos >= 0
  const diferencia = contadoValido ? contadoCentavos - totales.efectivo : null

  return (
    <div className="page">
      <p className="eyebrow">Vendedor del centro · {centro?.nombre}</p>
      <h1>Hola, {usuario.nombre.split(' ')[0]}</h1>
      <p className="lead">
        Vendé entradas de los eventos de tu centro, en efectivo o con medio electrónico, y cerrá la
        caja al terminar el día.
      </p>

      <dl className="kpis">
        <div>
          <dt>Efectivo del día</dt>
          <dd>{formatearCentavos(totales.efectivo)}</dd>
        </div>
        <div>
          <dt>Electrónico del día</dt>
          <dd>{formatearCentavos(totales.electronico)}</dd>
        </div>
        <div>
          <dt>Entradas vendidas hoy</dt>
          <dd>{totales.entradas}</dd>
        </div>
        <div>
          <dt>Caja</dt>
          <dd className={cierre ? 'kpi--closed' : 'kpi--open'}>{cierre ? 'Cerrada' : 'Abierta'}</dd>
        </div>
      </dl>

      <div className="tabs" role="tablist" aria-label="Secciones del panel">
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'vender'}
          className={pestana === 'vender' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('vender')}
        >
          Vender
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'caja'}
          className={pestana === 'caja' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('caja')}
        >
          Mi caja
        </button>
      </div>

      {pestana === 'vender' ? (
        <>
          {cierre ? (
            <p className="notice">
              La caja de hoy ya está cerrada. Podés volver a vender mañana (usá “+1 día” en la barra
              de la demo).
            </p>
          ) : null}
          <div className="events" style={{ marginTop: '1.25rem' }}>
            {eventos.map((evento) => {
              const quedan = disponibles(evento, estado.ventas, estado.reservas, ahora)
              return (
                <EventCard
                  key={evento.id}
                  evento={evento}
                  centro={centro?.nombre ?? ''}
                  artista={artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''}
                  quedan={quedan}
                  accion={{
                    etiqueta: quedan === 0 ? 'Agotado' : 'Vender',
                    onClick: () => setVendiendo(evento),
                    deshabilitada: quedan === 0 || Boolean(cierre),
                  }}
                />
              )
            })}
          </div>
        </>
      ) : (
        <div className="caja">
          <section>
            <h2 className="caja__title">Ventas de hoy · {formatearDia(estado.hoy)}</h2>
            {ventasHoy.length === 0 ? (
              <p className="muted">Todavía no registraste ventas hoy.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Medio</th>
                      <th className="num">Entradas</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasHoy.map((v) => (
                      <tr key={v.id}>
                        <td>{estado.eventos.find((e) => e.id === v.eventoId)?.titulo}</td>
                        <td>{v.medioPago === 'efectivo' ? 'Efectivo' : 'Electrónico'}</td>
                        <td className="num">{v.cantidad}</td>
                        <td className="num">{formatearCentavos(v.totalCentavos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="cierre">
            <h2 className="caja__title">Cierre de caja</h2>
            {cierre ? (
              <div
                className={
                  cierre.diferenciaCentavos === 0 ? 'notice notice--ok' : 'notice notice--error'
                }
              >
                <p>
                  <strong>Caja cerrada.</strong> Registrado{' '}
                  {formatearCentavos(cierre.efectivoRegistradoCentavos)} · declarado{' '}
                  {formatearCentavos(cierre.efectivoDeclaradoCentavos)}.
                </p>
                <p>
                  {cierre.diferenciaCentavos === 0
                    ? 'No hay diferencia: el efectivo coincide con lo vendido.'
                    : `Diferencia de ${formatearCentavos(cierre.diferenciaCentavos)} (${
                        cierre.diferenciaCentavos < 0 ? 'faltante' : 'sobrante'
                      }). Se informa a Soporte de boletería para que la revise.`}
                </p>
              </div>
            ) : (
              <>
                <p className="muted">
                  Contá el efectivo que tenés en la caja y declaralo. El sistema lo compara con el
                  efectivo registrado en las ventas del día (
                  <strong>{formatearCentavos(totales.efectivo)}</strong>).
                </p>
                <label className="field">
                  <span>Efectivo contado (en pesos)</span>
                  <input
                    inputMode="decimal"
                    value={contado}
                    onChange={(e) => setContado(e.target.value)}
                    placeholder="0"
                  />
                </label>
                {diferencia !== null ? (
                  <p className={diferencia === 0 ? 'notice notice--ok' : 'notice notice--error'}>
                    {diferencia === 0
                      ? 'Coincide con lo registrado.'
                      : `Diferencia: ${formatearCentavos(diferencia)} (${
                          diferencia < 0 ? 'faltante' : 'sobrante'
                        }).`}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={!contadoValido}
                  onClick={() =>
                    despachar({
                      tipo: 'cerrar-caja',
                      usuarioId: usuario.id,
                      declaradoCentavos: contadoCentavos,
                    })
                  }
                >
                  Cerrar caja del día
                </button>
              </>
            )}
          </section>

          {historial.length > 0 ? (
            <section>
              <h2 className="caja__title">Cierres anteriores</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th className="num">Registrado</th>
                      <th className="num">Declarado</th>
                      <th className="num">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((c) => (
                      <tr key={c.id}>
                        <td>{formatearDiaCorto(c.fecha)}</td>
                        <td className="num">{formatearCentavos(c.efectivoRegistradoCentavos)}</td>
                        <td className="num">{formatearCentavos(c.efectivoDeclaradoCentavos)}</td>
                        <td className="num">{formatearCentavos(c.diferenciaCentavos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      )}

      {vendiendo ? <VenderModal evento={vendiendo} onClose={() => setVendiendo(null)} /> : null}
    </div>
  )
}
