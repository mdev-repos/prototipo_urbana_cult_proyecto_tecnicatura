import { t } from '../../i18n'
import { repartoAlquiler } from '../domain/salas'
import { formatearCentavos, formatearDiaCorto } from '../format'
import { parametros, useMvp } from '../state'

const hh = (hora: number) => `${String(hora).padStart(2, '0')}:00`

/** Las salas de un centro y las franjas que ya le reservaron, con lo que le corresponde por cada alquiler. */
export function SalasCentro({ centroId }: { centroId: string }) {
  const { estado } = useMvp()
  const salas = estado.salas.filter((s) => s.centroId === centroId)
  const ids = new Set(salas.map((s) => s.id))
  const reservas = estado.reservasSala
    .filter((r) => ids.has(r.salaId))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora - b.hora)
  const proximas = reservas.filter((r) => r.fecha >= estado.hoy)
  const centroCentavos = proximas.reduce(
    (suma, r) => suma + repartoAlquiler(r.totalCentavos, parametros.comisionUrbanaPct).centro,
    0,
  )

  if (salas.length === 0) {
    return <p className="muted">{t('Tu centro no tiene salas de ensayo cargadas.')}</p>
  }

  return (
    <div className="caja">
      <dl className="kpis">
        <div>
          <dt>{t('Salas')}</dt>
          <dd>{salas.length}</dd>
        </div>
        <div>
          <dt>{t('Franjas reservadas')}</dt>
          <dd>{proximas.length}</dd>
        </div>
        <div>
          <dt>{t('Te corresponde por alquileres')}</dt>
          <dd>{formatearCentavos(centroCentavos)}</dd>
        </div>
      </dl>

      <p className="muted">
        {t(
          'Cada franja de una hora se reserva una sola vez desde la plataforma, así que tus salas no se alquilan dos veces en el mismo horario. De cada alquiler, Urbana Cult retiene su comisión y el resto es del espacio.',
        )}
      </p>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Sala')}</th>
              <th>{t('Día')}</th>
              <th>{t('Hora')}</th>
              <th className="num">{t('Total')}</th>
              <th className="num">{t('Tu parte')}</th>
            </tr>
          </thead>
          <tbody>
            {proximas.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  {t('No hay reservas próximas.')}
                </td>
              </tr>
            ) : (
              proximas.map((r) => (
                <tr key={r.id}>
                  <td>{salas.find((s) => s.id === r.salaId)?.nombre}</td>
                  <td>{formatearDiaCorto(r.fecha)}</td>
                  <td>{hh(r.hora)}</td>
                  <td className="num">{formatearCentavos(r.totalCentavos)}</td>
                  <td className="num">
                    {formatearCentavos(
                      repartoAlquiler(r.totalCentavos, parametros.comisionUrbanaPct).centro,
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
