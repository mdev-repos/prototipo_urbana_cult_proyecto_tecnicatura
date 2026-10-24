import { formatearCentavos, formatearDiaCorto } from '../format'
import { entradasNetas, netoVenta, sumarDias } from '../domain/ventas'
import { parametros, useMvp } from '../state'
import type { Beneficiario, EstadoAsiento } from '../types'

type Props = {
  beneficiario: Exclude<Beneficiario, 'urbana'>
  beneficiarioId: string
}

const ESTADOS: EstadoAsiento[] = ['retenido', 'disponible', 'pagado']
const ETIQUETA: Record<EstadoAsiento, string> = {
  retenido: 'Retenido',
  disponible: 'Disponible',
  pagado: 'Pagado',
}

/** Estado de cuenta por evento: reparto aplicado, saldos por estado y fecha de liquidación (RF-VEN-18). */
export function EstadoCuenta({ beneficiario, beneficiarioId }: Props) {
  const { estado } = useMvp()

  const filas = estado.eventos
    .map((evento) => {
      const asientos = estado.asientos.filter(
        (a) =>
          a.eventoId === evento.id &&
          a.beneficiario === beneficiario &&
          a.beneficiarioId === beneficiarioId,
      )
      if (asientos.length === 0) return null
      const porEstado = Object.fromEntries(
        ESTADOS.map((e) => [
          e,
          asientos.filter((a) => a.estado === e).reduce((s, a) => s + a.montoCentavos, 0),
        ]),
      ) as Record<EstadoAsiento, number>
      const ventas = estado.ventas.filter((v) => v.eventoId === evento.id)
      return {
        evento,
        entradas: ventas.reduce((s, v) => s + entradasNetas(v), 0),
        total: ventas.reduce((s, v) => s + netoVenta(v), 0),
        parte: asientos.reduce((s, a) => s + a.montoCentavos, 0),
        porEstado,
        liquida: sumarDias(evento.fecha, parametros.plazoLiquidacionDias),
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .sort((a, b) => a.evento.fecha.localeCompare(b.evento.fecha))

  if (filas.length === 0) {
    return <p className="muted">Todavía no hay ventas asentadas para mostrar.</p>
  }

  const totalParte = filas.reduce((s, f) => s + f.parte, 0)

  return (
    <div className="account">
      <p className="muted">
        Tu parte acumulada: <strong>{formatearCentavos(totalParte)}</strong>. Todo se mantiene
        retenido hasta la liquidación, D+{parametros.plazoLiquidacionDias} después de cada evento.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Evento</th>
              <th className="num">Entradas</th>
              <th className="num">Recaudado</th>
              <th className="num">Tu parte</th>
              <th>Estado</th>
              <th>Liquida</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.evento.id}>
                <td>
                  {f.evento.titulo}
                  {f.evento.baja ? <span className="muted"> (baja)</span> : null}
                </td>
                <td className="num">{f.entradas}</td>
                <td className="num">{formatearCentavos(f.total)}</td>
                <td className="num">{formatearCentavos(f.parte)}</td>
                <td>
                  {ESTADOS.filter((e) => f.porEstado[e] > 0).map((e) => (
                    <span key={e} className={`status status--${e}`} title={ETIQUETA[e]}>
                      {ETIQUETA[e]} {formatearCentavos(f.porEstado[e])}
                    </span>
                  ))}
                </td>
                <td>{formatearDiaCorto(f.liquida)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
