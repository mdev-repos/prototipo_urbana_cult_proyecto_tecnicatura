import { formatearCentavos, formatearDiaCorto } from '../format'
import { netoVenta, sumarDias } from '../domain/ventas'
import { artistas, parametros, useMvp } from '../state'
import type { Beneficiario } from '../types'
import { t } from '../../i18n'

const ETIQUETA_ESTADO = {
  retenido: 'Retenido',
  disponible: 'Disponible',
  pagado: 'Pagado',
} as const

/** Transparencia para el comprador: a dónde va cada peso de su pago y cuándo se liquida. */
export function RepartoVenta({ ventaId }: { ventaId: string }) {
  const { estado } = useMvp()
  const venta = estado.ventas.find((v) => v.id === ventaId)
  const evento = estado.eventos.find((e) => e.id === venta?.eventoId)
  const asientos = estado.asientos.filter((a) => a.ventaId === ventaId)
  if (!venta || !evento) return null

  const nombres: Record<Beneficiario, string> = {
    centro: estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? 'Centro',
    artista: artistas.find((a) => a.id === evento.artistaId)?.nombre ?? 'Artista',
    urbana: 'Urbana Cult (red)',
  }
  const orden: Beneficiario[] = ['centro', 'artista', 'urbana']
  const liquidacion = sumarDias(evento.fecha, parametros.plazoLiquidacionDias)

  return (
    <div className="split">
      <div className="split__head">
        <p className="split__title">{t('A dónde va el pago (')}{formatearCentavos(netoVenta(venta))}{t(')')}</p>
        <span
          className="split__tag"
          title={t('El cliente no ve esta división: se muestra para ilustrar el asiento')}
        >
          {t('Vista de demo')}</span>
      </div>
      <ul className="split__list">
        {orden.map((b) => {
          const propios = asientos.filter((a) => a.beneficiario === b)
          const asiento = propios[0]
          if (!asiento) return null
          return (
            <li key={b}>
              <span>{b === 'urbana' ? t(nombres[b]) : nombres[b]}</span>
              <span className="split__amount">
                {formatearCentavos(propios.reduce((suma, a) => suma + a.montoCentavos, 0))}
              </span>
              <span className={`status status--${asiento.estado}`}>
                {t(ETIQUETA_ESTADO[asiento.estado])}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="split__note">
        {t('Asiento registrado en el libro mayor al confirmarse el cobro. El dinero queda retenido hasta el evento y se liquida el')}{" "}{formatearDiaCorto(liquidacion)} {t('(D+')}{parametros.plazoLiquidacionDias}{t(').')}</p>
    </div>
  )
}
