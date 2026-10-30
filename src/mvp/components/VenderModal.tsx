import { useEffect, useRef, useState } from 'react'
import { disponibles } from '../domain/ventas'
import { formatearFecha, formatearHora, formatearPesos } from '../format'
import { artistas, useMvp } from '../state'
import type { Evento, MedioPago } from '../types'
import { Modal } from './Modal'
import { RepartoVenta } from './RepartoVenta'
import { TicketCard } from './TicketCard'
import { t } from '../../i18n'

const MAXIMO_POR_VENTA = 10

type Props = {
  evento: Evento
  onClose: () => void
}

/** Venta presencial en la boletería del centro: se registra al instante, en efectivo o con medio electrónico. */
export function VenderModal({ evento, onClose }: Props) {
  const { estado, usuario, despachar } = useMvp()
  const [cantidad, setCantidad] = useState(1)
  const [medio, setMedio] = useState<MedioPago>('efectivo')
  const [ventaId, setVentaId] = useState<string | null>(null)
  const ventasAntes = useRef<number | null>(null)

  const centro = estado.centros.find((c) => c.id === evento.centroId)
  const artista = artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''
  const bloqueado = centro?.estado === 'bloqueado'
  const libres = disponibles(evento, estado.ventas, estado.reservas, Date.now())
  const maximo = Math.min(MAXIMO_POR_VENTA, libres)
  const cantidadActual = Math.min(cantidad, Math.max(1, maximo))
  const medioActual: MedioPago = bloqueado ? 'electronico' : medio

  // Cuando aparece la venta nueva del vendedor, se muestra la confirmación.
  useEffect(() => {
    if (ventasAntes.current === null || estado.ventas.length <= ventasAntes.current) return
    const venta = [...estado.ventas]
      .reverse()
      .find((v) => v.vendedorId === usuario?.id && v.eventoId === evento.id)
    ventasAntes.current = null
    if (venta) setVentaId(venta.id)
  }, [estado.ventas, usuario?.id, evento.id])

  if (!usuario) return null

  function registrar() {
    ventasAntes.current = estado.ventas.length
    despachar({
      tipo: 'vender-boleteria',
      eventoId: evento.id,
      usuarioId: usuario!.id,
      cantidad: cantidadActual,
      medioPago: medioActual,
      ahora: Date.now(),
    })
  }

  const venta = ventaId ? estado.ventas.find((v) => v.id === ventaId) : undefined
  const entradas = venta ? estado.entradas.filter((t) => t.ventaId === venta.id) : []

  return (
    <Modal titulo={venta ? t('Venta registrada') : t('Vender entradas')} onClose={onClose}>
      <div className="checkout__event">
        <p className="checkout__title">{evento.titulo}</p>
        <p className="muted">
          {artista} {t('·')}{" "}{centro?.nombre}
        </p>
        <p className="muted">
          {formatearFecha(evento.fecha)} {t('·')}{" "}{formatearHora(evento.fecha)} {t('h ·')}{' '}
          {formatearPesos(evento.precio)} {t('c/u')}</p>
      </div>

      {venta ? (
        <div className="checkout__step">
          <p className="notice notice--ok">
            {t('Venta registrada:')}{" "}{venta.cantidad} {venta.cantidad === 1 ? t('entrada') : t('entradas')} {t('por')}{' '}
            {formatearPesos(venta.totalCentavos / 100)} {t('(')}{venta.medioPago === 'efectivo' ? t('efectivo') : t('medio electrónico')}{t(').')}</p>
          {venta.medioPago === 'efectivo' ? (
            <p className="notice">
              {t('El efectivo queda')}{" "}<strong>{t('en poder del centro')}</strong> {t('y se suma a la caja del día y a la próxima remesa.')}</p>
          ) : null}
          <div className="tickets">
            {entradas.map((t) => (
              <TicketCard key={t.id} entrada={t} evento={evento} centro={centro?.nombre ?? ''} />
            ))}
          </div>
          <RepartoVenta ventaId={venta.id} />
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {t('Listo')}</button>
        </div>
      ) : libres === 0 ? (
        <p className="notice notice--error">{t('Este evento está agotado.')}</p>
      ) : (
        <div className="checkout__step">
          <label className="field">
            <span>{t('Cantidad (máximo')}{" "}{maximo}{t(')')}</span>
            <select value={cantidadActual} onChange={(e) => setCantidad(Number(e.target.value))}>
              {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="choice">
            <legend>{t('Medio de pago')}</legend>
            <label className="check">
              <input
                type="radio"
                name="medio"
                checked={medioActual === 'efectivo'}
                disabled={bloqueado}
                onChange={() => setMedio('efectivo')}
              />
              <span>{t('Efectivo')}</span>
            </label>
            <label className="check">
              <input
                type="radio"
                name="medio"
                checked={medioActual === 'electronico'}
                onChange={() => setMedio('electronico')}
              />
              <span>{t('Medio electrónico (posnet o QR)')}</span>
            </label>
          </fieldset>
          {bloqueado ? (
            <p className="notice notice--error">
              {t('El centro está bloqueado por no remesar: no puede vender en efectivo hasta regularizarse.')}</p>
          ) : null}

          <p className="checkout__total">
            {t('Total')}{" "}<strong>{formatearPesos(evento.precio * cantidadActual)}</strong>
          </p>
          <button type="button" className="btn btn--primary" onClick={registrar}>
            {t('Registrar venta')}</button>
        </div>
      )}
    </Modal>
  )
}
