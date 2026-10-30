import { useState } from 'react'
import { Puerta } from '../components/Puerta'
import { EventCard } from '../components/EventCard'
import { VenderModal } from '../components/VenderModal'
import { VenderSinConexion } from '../components/VenderSinConexion'
import { cierreDelDia, totalesDeCaja, ventasDeCaja } from '../domain/caja'
import { bloqueLibre, disponibles } from '../domain/ventas'
import { formatearCentavos, formatearDia, formatearDiaCorto } from '../format'
import { useAhora } from '../hooks'
import { artistas, useMvp } from '../state'
import type { Evento } from '../types'
import { t } from '../../i18n'

type Pestana = 'vender' | 'caja' | 'puerta'

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
      <p className="eyebrow">
        {t('Vendedor del centro ·')} {centro?.nombre}
      </p>
      <h1>
        {t('Hola,')} {usuario.nombre.split(' ')[0]}
      </h1>
      <p className="lead">
        {t(
          'Vendé entradas de los eventos de tu centro, en efectivo o con medio electrónico, y cerrá la caja al terminar el día.',
        )}
      </p>

      <dl className="kpis">
        <div>
          <dt>{t('Efectivo del día')}</dt>
          <dd>{formatearCentavos(totales.efectivo)}</dd>
        </div>
        <div>
          <dt>{t('Electrónico del día')}</dt>
          <dd>{formatearCentavos(totales.electronico)}</dd>
        </div>
        <div>
          <dt>{t('Entradas vendidas hoy')}</dt>
          <dd>{totales.entradas}</dd>
        </div>
        <div>
          <dt>{t('Caja')}</dt>
          <dd className={cierre ? 'kpi--closed' : 'kpi--open'}>
            {cierre ? t('Cerrada') : t('Abierta')}
          </dd>
        </div>
      </dl>

      <div className="tabs" role="tablist" aria-label={t('Secciones del panel')}>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'vender'}
          className={pestana === 'vender' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('vender')}
        >
          {t('Vender')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'caja'}
          className={pestana === 'caja' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('caja')}
        >
          {t('Mi caja')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'puerta'}
          className={pestana === 'puerta' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('puerta')}
        >
          {t('Puerta', 'Porta')}
        </button>
      </div>

      {pestana === 'vender' ? (
        <>
          {centro?.soloDifusion ? (
            <p className="notice">
              {t(
                'Tu centro está en la etapa de solo difusión. Su cartelera se publica, pero la venta se habilita cuando el centro se suma a su tanda de implementación.',
                'Seu centro está na etapa de só divulgação. A programação é publicada, mas a venda é habilitada quando o centro entra no seu lote de implantação.',
              )}
            </p>
          ) : null}
          <div className="conexion">
            <label className="check">
              <input
                type="checkbox"
                checked={estado.corteInternet}
                onChange={(e) =>
                  despachar({
                    tipo: 'corte-internet',
                    usuarioId: usuario.id,
                    activo: e.target.checked,
                  })
                }
              />
              <span>{t('Simular corte de internet en la boletería')}</span>
            </label>
            {estado.corteInternet ? (
              <p className="notice notice--error">
                {t(
                  'Sin conexión. Solo se vende en efectivo con el bloque numerado de entradas reservado de antemano. Ventas pendientes de sincronizar:',
                )}{' '}
                <strong>{estado.pendientes.length}</strong>
              </p>
            ) : estado.ultimaSync ? (
              <p className="notice notice--ok">
                {t(
                  estado.ultimaSync.ventas === 1
                    ? 'Volvió la conexión: se sincronizó {v} venta ({e} entradas) y ya está en el libro mayor.'
                    : 'Volvió la conexión: se sincronizaron {v} ventas ({e} entradas) y ya están en el libro mayor.',
                  {
                    v: estado.ultimaSync.ventas,
                    e: estado.ultimaSync.entradas,
                  },
                )}
              </p>
            ) : null}
          </div>
          {cierre ? (
            <p className="notice">
              {t(
                'La caja de hoy ya está cerrada. Podés volver a vender mañana (usá “+1 día” en la barra de la demo).',
              )}
            </p>
          ) : null}
          <div className="events" style={{ marginTop: '1.25rem' }}>
            {eventos.map((evento) => {
              const pendientesEvento = estado.pendientes
                .filter((p) => p.eventoId === evento.id)
                .reduce((suma, p) => suma + p.cantidad, 0)
              const quedan = estado.corteInternet
                ? Math.max(0, bloqueLibre(evento, estado.ventas) - pendientesEvento)
                : disponibles(evento, estado.ventas, estado.reservas, ahora)
              return (
                <EventCard
                  key={evento.id}
                  evento={evento}
                  centro={centro?.nombre ?? ''}
                  artista={artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''}
                  quedan={quedan}
                  accion={{
                    etiqueta:
                      quedan === 0
                        ? estado.corteInternet
                          ? t('Bloque agotado')
                          : t('Agotado')
                        : t('Vender'),
                    onClick: () => setVendiendo(evento),
                    deshabilitada: quedan === 0 || Boolean(cierre) || Boolean(centro?.soloDifusion),
                  }}
                />
              )
            })}
          </div>
        </>
      ) : pestana === 'puerta' ? (
        <Puerta centroId={usuario.centroId} />
      ) : (
        <div className="caja">
          <section>
            <h2 className="caja__title">
              {t('Ventas de hoy ·')} {formatearDia(estado.hoy)}
            </h2>
            {ventasHoy.length === 0 ? (
              <p className="muted">{t('Todavía no registraste ventas hoy.')}</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('Evento')}</th>
                      <th>{t('Medio')}</th>
                      <th className="num">{t('Entradas')}</th>
                      <th className="num">{t('Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasHoy.map((v) => (
                      <tr key={v.id}>
                        <td>{estado.eventos.find((e) => e.id === v.eventoId)?.titulo}</td>
                        <td>{v.medioPago === 'efectivo' ? t('Efectivo') : t('Electrónico')}</td>
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
            <h2 className="caja__title">{t('Cierre de caja')}</h2>
            {cierre ? (
              <div
                className={
                  cierre.diferenciaCentavos === 0 ? 'notice notice--ok' : 'notice notice--error'
                }
              >
                <p>
                  <strong>{t('Caja cerrada.')}</strong> {t('Registrado')}{' '}
                  {formatearCentavos(cierre.efectivoRegistradoCentavos)} {t('· declarado')}{' '}
                  {formatearCentavos(cierre.efectivoDeclaradoCentavos)}
                  {t('.')}
                </p>
                <p>
                  {cierre.diferenciaCentavos === 0
                    ? t('No hay diferencia: el efectivo coincide con lo vendido.')
                    : t(
                        'Diferencia de {monto} ({tipo}). Se informa a Soporte de boletería para que la revise.',
                        {
                          monto: formatearCentavos(cierre.diferenciaCentavos),
                          tipo: cierre.diferenciaCentavos < 0 ? t('faltante') : t('sobrante'),
                        },
                      )}
                </p>
              </div>
            ) : (
              <>
                <p className="muted">
                  {t(
                    'Contá el efectivo que tenés en la caja y declaralo. El sistema lo compara con el efectivo registrado en las ventas del día (',
                  )}
                  <strong>{formatearCentavos(totales.efectivo)}</strong>
                  {t(').')}
                </p>
                <label className="field">
                  <span>{t('Efectivo contado (en pesos)')}</span>
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
                      ? t('Coincide con lo registrado.')
                      : t('Diferencia: {monto} ({tipo}).', {
                          monto: formatearCentavos(diferencia),
                          tipo: diferencia < 0 ? t('faltante') : t('sobrante'),
                        })}
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
                  {t('Cerrar caja del día')}
                </button>
              </>
            )}
          </section>

          {historial.length > 0 ? (
            <section>
              <h2 className="caja__title">{t('Cierres anteriores')}</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('Día')}</th>
                      <th className="num">{t('Registrado')}</th>
                      <th className="num">{t('Declarado')}</th>
                      <th className="num">{t('Diferencia')}</th>
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

      {vendiendo && estado.corteInternet ? (
        <VenderSinConexion evento={vendiendo} onClose={() => setVendiendo(null)} />
      ) : vendiendo ? (
        <VenderModal evento={vendiendo} onClose={() => setVendiendo(null)} />
      ) : null}
    </div>
  )
}
