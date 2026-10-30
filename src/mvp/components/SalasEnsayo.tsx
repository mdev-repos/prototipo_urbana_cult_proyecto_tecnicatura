import { useState } from 'react'
import { t } from '../../i18n'
import { HORAS_SALA, repartoAlquiler, reservaDeFranja } from '../domain/salas'
import { sumarDias } from '../domain/ventas'
import { formatearCentavos, formatearDiaCorto } from '../format'
import { parametros, useMvp } from '../state'

const DIAS_VISIBLES = 7

const hh = (hora: number) => `${String(hora).padStart(2, '0')}:00`

/** Alquiler de salas de ensayo: una grilla por sala, donde cada franja de una hora solo se puede reservar una vez. */
export function SalasEnsayo() {
  const { estado, usuario, despachar } = useMvp()
  const [salaId, setSalaId] = useState(estado.salas[0]?.id ?? '')
  const [elegida, setElegida] = useState<{ fecha: string; hora: number } | null>(null)

  if (!usuario) return null
  const sala = estado.salas.find((s) => s.id === salaId)
  if (!sala) return null
  const centro = estado.centros.find((c) => c.id === sala.centroId)
  const dias = Array.from({ length: DIAS_VISIBLES }, (_, i) => sumarDias(estado.hoy, i))
  const mias = estado.reservasSala
    .filter((r) => r.usuarioId === usuario.id)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora - b.hora)

  const total = sala.precioHora * 100
  const reparto = repartoAlquiler(total, parametros.comisionUrbanaPct)

  function confirmar() {
    if (!elegida) return
    despachar({
      tipo: 'reservar-sala',
      usuarioId: usuario!.id,
      salaId: sala!.id,
      fecha: elegida.fecha,
      hora: elegida.hora,
    })
    setElegida(null)
  }

  return (
    <div className="salas">
      <p className="muted">
        {t(
          'Elegí una sala, un día y una hora. Cada franja de una hora se puede reservar una sola vez, así que no hay dobles reservas. Al confirmar se asienta el reparto entre el espacio dueño de la sala y la comisión de Urbana Cult.',
        )}
      </p>

      <div className="chips" role="group" aria-label={t('Salas de ensayo')}>
        {estado.salas.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === salaId ? 'chip is-active' : 'chip'}
            aria-pressed={s.id === salaId}
            onClick={() => {
              setSalaId(s.id)
              setElegida(null)
            }}
          >
            {s.nombre} · {estado.centros.find((c) => c.id === s.centroId)?.nombre}
          </button>
        ))}
      </div>

      <p>
        <strong>{sala.nombre}</strong> · {centro?.nombre} · {formatearCentavos(total)}{' '}
        {t('por hora')}
        <br />
        <span className="muted">{t(sala.descripcion)}</span>
      </p>

      <div className="table-wrap">
        <table className="table grilla">
          <thead>
            <tr>
              <th>{t('Día')}</th>
              {HORAS_SALA.map((h) => (
                <th key={h} className="num">
                  {hh(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dias.map((fecha) => (
              <tr key={fecha}>
                <td>{formatearDiaCorto(fecha)}</td>
                {HORAS_SALA.map((hora) => {
                  const reserva = reservaDeFranja(estado.reservasSala, sala.id, fecha, hora)
                  const esMia = reserva?.usuarioId === usuario.id
                  const esElegida = elegida?.fecha === fecha && elegida.hora === hora
                  return (
                    <td key={hora} className="num">
                      {reserva ? (
                        <span className={esMia ? 'franja franja--mia' : 'franja franja--ocupada'}>
                          {esMia ? t('Tuya') : t('Ocupada')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={
                            esElegida ? 'franja franja--libre is-active' : 'franja franja--libre'
                          }
                          onClick={() => setElegida({ fecha, hora })}
                        >
                          {t('Libre')}
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {elegida ? (
        <div className="notice">
          <p>
            <strong>
              {sala.nombre} · {formatearDiaCorto(elegida.fecha)} · {hh(elegida.hora)}
            </strong>{' '}
            · {formatearCentavos(total)}
          </p>
          <p className="muted">
            {t('Reparto: espacio {centro}, Urbana Cult {urbana} ({pct} % de comisión).', {
              centro: formatearCentavos(reparto.centro),
              urbana: formatearCentavos(reparto.urbana),
              pct: parametros.comisionUrbanaPct,
            })}
          </p>
          <button type="button" className="btn btn--primary" onClick={confirmar}>
            {t('Reservar y pagar')}
          </button>{' '}
          <button type="button" className="btn btn--ghost" onClick={() => setElegida(null)}>
            {t('Cancelar')}
          </button>
        </div>
      ) : null}

      <h2 className="caja__title">{t('Mis reservas de sala')}</h2>
      {mias.length === 0 ? (
        <p className="muted">{t('Todavía no reservaste ninguna sala.')}</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('Sala')}</th>
                <th>{t('Día')}</th>
                <th>{t('Hora')}</th>
                <th className="num">{t('Total')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mias.map((r) => {
                const s = estado.salas.find((x) => x.id === r.salaId)
                return (
                  <tr key={r.id}>
                    <td>
                      {s?.nombre}
                      <br />
                      <span className="muted">
                        {estado.centros.find((c) => c.id === s?.centroId)?.nombre}
                      </span>
                    </td>
                    <td>{formatearDiaCorto(r.fecha)}</td>
                    <td>{hh(r.hora)}</td>
                    <td className="num">{formatearCentavos(r.totalCentavos)}</td>
                    <td className="actions">
                      {r.fecha >= estado.hoy ? (
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() =>
                            despachar({
                              tipo: 'cancelar-reserva-sala',
                              usuarioId: usuario.id,
                              reservaId: r.id,
                            })
                          }
                        >
                          {t('Cancelar reserva')}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
