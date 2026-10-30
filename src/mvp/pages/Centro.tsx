import { useState } from 'react'
import { EstadoCuenta } from '../components/EstadoCuenta'
import { EventoForm } from '../components/EventoForm'
import { SalasCentro } from '../components/SalasCentro'
import { Modal } from '../components/Modal'
import { pendienteDeRemesa, proponerRemesa } from '../domain/remesas'
import { entradasNetas, sumarDias } from '../domain/ventas'
import { formatearCentavos, formatearDiaCorto, formatearFecha, formatearHora } from '../format'
import { artistas, parametros, useMvp } from '../state'
import type { Evento } from '../types'
import { t } from '../../i18n'

type Pestana = 'eventos' | 'remesas' | 'cuenta' | 'salas'

type Edicion = { evento?: Evento; base?: Partial<Evento> } | null

function EventosTab({ centroBloqueado }: { centroBloqueado: boolean }) {
  const { estado, usuario, despachar } = useMvp()
  const [edicion, setEdicion] = useState<Edicion>(null)
  const [aBajar, setABajar] = useState<Evento | null>(null)
  if (!usuario?.centroId) return null

  const eventos = estado.eventos
    .filter((e) => e.centroId === usuario.centroId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const vendidas = (id: string) =>
    estado.ventas.filter((v) => v.eventoId === id).reduce((s, v) => s + entradasNetas(v), 0)

  function duplicar(e: Evento) {
    // El duplicado arranca una semana después y sin destacado, para completar los cambios.
    const fecha = `${sumarDias(e.fecha, 7)}${e.fecha.slice(10)}`
    setEdicion({ base: { ...e, fecha, titulo: e.titulo } })
  }

  return (
    <>
      <div className="toolbar">
        <button
          type="button"
          className="btn btn--primary"
          disabled={centroBloqueado}
          onClick={() => setEdicion({})}
        >
          {t('Nuevo evento')}
        </button>
        {centroBloqueado ? (
          <span className="muted">
            {t('Con el centro bloqueado no se pueden publicar eventos.')}
          </span>
        ) : null}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Evento')}</th>
              <th>{t('Fecha')}</th>
              <th className="num">{t('Vendidas / cupo')}</th>
              <th>{t('Estado')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id} className={e.baja ? 'row--off' : undefined}>
                <td>
                  {e.titulo}
                  <br />
                  <span className="muted">
                    {artistas.find((a) => a.id === e.artistaId)?.nombre}
                  </span>
                </td>
                <td>
                  {formatearFecha(e.fecha)}
                  <br />
                  <span className="muted">
                    {formatearHora(e.fecha)} {t('h')}
                  </span>
                </td>
                <td className="num">
                  {vendidas(e.id)} {t('/')} {e.cupo}
                </td>
                <td>
                  {e.baja ? (
                    <span className="status">{t('Baja')}</span>
                  ) : e.destacado ? (
                    <span className="status status--retenido">{t('Destacado')}</span>
                  ) : (
                    <span className="status status--disponible">{t('Publicado')}</span>
                  )}
                </td>
                <td className="actions">
                  {e.baja ? null : (
                    <>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={centroBloqueado}
                        onClick={() => setEdicion({ evento: e })}
                      >
                        {t('Modificar')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={centroBloqueado}
                        onClick={() => duplicar(e)}
                      >
                        {t('Duplicar')}
                      </button>
                      <button type="button" className="btn btn--ghost" onClick={() => setABajar(e)}>
                        {t('Dar de baja')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edicion ? (
        <EventoForm evento={edicion.evento} base={edicion.base} onClose={() => setEdicion(null)} />
      ) : null}

      {aBajar ? (
        <Modal titulo={t('Dar de baja el evento')} onClose={() => setABajar(null)}>
          <p>
            {t('Vas a retirar')} <strong>{aBajar.titulo}</strong>{' '}
            {t('de la cartelera y bloquear su venta.')}
          </p>
          {vendidas(aBajar.id) > 0 ? (
            <p className="notice notice--error">
              {t('Ya tiene')} {vendidas(aBajar.id)}{' '}
              {t(
                'entradas vendidas: se avisa a Coordinación para que revierta los cobros y devuelva el dinero.',
              )}
            </p>
          ) : null}
          <div className="checkout__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                despachar({ tipo: 'baja-evento', usuarioId: usuario.id, eventoId: aBajar.id })
                setABajar(null)
              }}
            >
              {t('Confirmar baja')}
            </button>
            <button type="button" className="btn" onClick={() => setABajar(null)}>
              {t('Cancelar')}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}

function RemesasTab() {
  const { estado, usuario, despachar } = useMvp()
  if (!usuario?.centroId) return null
  const centroId = usuario.centroId

  const eventos = estado.eventos.filter((e) => e.centroId === centroId)
  const filas = eventos
    .map((evento) => ({
      evento,
      p: pendienteDeRemesa(
        estado.ventas,
        estado.remesas,
        evento.id,
        estado.hoy,
        parametros.plazoRemesaDias,
      ),
      propuesta: proponerRemesa(
        evento,
        estado.ventas,
        estado.remesas,
        estado.asientos,
        estado.hoy,
        parametros.plazoRemesaDias,
      ),
    }))
    .filter((f) => f.p.vendido > 0)
  const historial = estado.remesas.filter((r) => r.centroId === centroId).reverse()

  return (
    <div className="caja">
      <section>
        <h2 className="caja__title">{t('Efectivo pendiente de remesa')}</h2>
        <p className="muted">
          {t(
            'El efectivo cobrado en boletería queda en poder del centro. Cada día con ventas en efectivo generás la remesa y transferís el monto con su referencia. Las remesas previas al evento son brutas; desde el día del evento, la final descuenta tu parte hasta el límite del efectivo pendiente.',
          )}
        </p>
        {filas.length === 0 ? (
          <p className="muted">{t('Tu centro no tiene ventas en efectivo.')}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('Evento')}</th>
                  <th className="num">{t('Efectivo vendido')}</th>
                  <th className="num">{t('Remesado')}</th>
                  <th className="num">{t('Pendiente')}</th>
                  <th>{t('Vence')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filas.map(({ evento, p, propuesta }) => (
                  <tr key={evento.id}>
                    <td>{evento.titulo}</td>
                    <td className="num">{formatearCentavos(p.vendido)}</td>
                    <td className="num">{formatearCentavos(p.cubierto)}</td>
                    <td className="num">{formatearCentavos(p.pendiente)}</td>
                    <td>
                      {p.limite ? (
                        <span className={p.vencida ? 'status status--vencida' : 'status'}>
                          {p.vencida ? t('Vencida') + ' · ' : ''}
                          {formatearDiaCorto(p.limite)}
                        </span>
                      ) : (
                        <span className="muted">{t('Al día')}</span>
                      )}
                    </td>
                    <td className="actions">
                      {propuesta ? (
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() =>
                            despachar({
                              tipo: 'generar-remesa',
                              usuarioId: usuario.id,
                              eventoId: evento.id,
                            })
                          }
                        >
                          {propuesta.tipo === 'final'
                            ? t('Remesa final · transferir {monto}', {
                                monto: formatearCentavos(propuesta.montoCentavos),
                              })
                            : t('Generar remesa · {monto}', {
                                monto: formatearCentavos(propuesta.montoCentavos),
                              })}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {historial.length > 0 ? (
        <section>
          <h2 className="caja__title">{t('Remesas generadas')}</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('Referencia')}</th>
                  <th>{t('Evento')}</th>
                  <th>{t('Tipo')}</th>
                  <th className="num">{t('Transferir')}</th>
                  <th className="num">{t('Te quedás')}</th>
                  <th>{t('Estado')}</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.referencia}</td>
                    <td>{estado.eventos.find((e) => e.id === r.eventoId)?.titulo}</td>
                    <td>{r.tipo === 'final' ? t('Final') : t('Bruta')}</td>
                    <td className="num">{formatearCentavos(r.montoCentavos)}</td>
                    <td className="num">{formatearCentavos(r.retenidoCentroCentavos)}</td>
                    <td>
                      <span
                        className={
                          r.estado === 'conciliada'
                            ? 'status status--disponible'
                            : 'status status--retenido'
                        }
                      >
                        {r.estado === 'conciliada' ? t('Conciliada') : t('Informada')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted checkout__hint">
            {t(
              'Transferí cada monto a la cuenta de Urbana indicando la referencia. Coordinación la concilia contra su cuenta y la acredita en el libro mayor.',
            )}
          </p>
        </section>
      ) : null}
    </div>
  )
}

export function Centro() {
  const { estado, usuario } = useMvp()
  const [pestana, setPestana] = useState<Pestana>('eventos')
  if (!usuario?.centroId) return null

  const centro = estado.centros.find((c) => c.id === usuario.centroId)
  const bloqueado = centro?.estado === 'bloqueado'
  const avisos = estado.avisos
    .filter((a) => a.para === 'centro' && a.centroId === usuario.centroId)
    .slice(-3)
    .reverse()

  return (
    <div className="page">
      <p className="eyebrow">
        {t('Admin del centro ·')} {centro?.nombre}
      </p>
      <h1>
        {t('Hola,')} {usuario.nombre.split(' ')[0]}
      </h1>
      <p className="lead">
        {t(
          'Gestioná la cartelera de tu centro, remesá el efectivo de boletería y seguí el estado de tu cuenta.',
        )}
      </p>

      {bloqueado ? (
        <p className="notice notice--error" style={{ marginTop: '1.5rem' }}>
          <strong>{t('Tu centro está bloqueado')}</strong>{' '}
          {t(
            'por tener remesas vencidas: no podés publicar eventos ni vender en efectivo. Generá las remesas pendientes para regularizarte.',
          )}
        </p>
      ) : null}
      {avisos.length > 0 ? (
        <ul className="avisos">
          {avisos.map((a) => (
            <li key={a.id}>
              <span className="muted">{formatearDiaCorto(a.fecha)}</span> {a.texto}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="tabs" role="tablist" aria-label={t('Secciones del panel')}>
        {(
          [
            ['eventos', t('Eventos')],
            ['remesas', t('Efectivo y remesas')],
            ['cuenta', t('Estado de cuenta')],
            ['salas', t('Salas de ensayo')],
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

      {pestana === 'eventos' ? <EventosTab centroBloqueado={bloqueado} /> : null}
      {pestana === 'remesas' ? <RemesasTab /> : null}
      {pestana === 'salas' ? <SalasCentro centroId={usuario.centroId!} /> : null}
      {pestana === 'cuenta' ? (
        <EstadoCuenta beneficiario="centro" beneficiarioId={usuario.centroId} />
      ) : null}
    </div>
  )
}
