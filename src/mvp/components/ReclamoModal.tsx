import { useState } from 'react'
import { entradasNetas } from '../domain/ventas'
import { formatearPesos } from '../format'
import { useMvp } from '../state'
import type { Venta } from '../types'
import { Modal } from './Modal'
import { t } from '../../i18n'

const MOTIVOS = [
  'No puedo asistir',
  'El evento cambió de fecha o se canceló',
  'Me cobraron de más o dos veces',
  'Otro motivo',
]

type Props = {
  venta: Venta
  onClose: () => void
}

/** Un cliente pide la devolución de parte o de toda su compra (RF-PLA-06). */
export function ReclamoModal({ venta, onClose }: Props) {
  const { estado, usuario, despachar } = useMvp()
  const maximo = entradasNetas(venta)
  const [cantidad, setCantidad] = useState(maximo)
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const evento = estado.eventos.find((e) => e.id === venta.eventoId)
  if (!usuario || !evento) return null

  return (
    <Modal titulo={t('Reclamar o pedir una devolución')} onClose={onClose}>
      <p className="checkout__title">{evento.titulo}</p>
      <div className="form">
        <label className="field">
          <span>{t('¿Cuántas entradas querés devolver?')}</span>
          <select value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
            {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {t('(')}{formatearPesos(evento.precio * n)}{t(')')}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('Motivo')}</span>
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </select>
        </label>
        <p className="muted checkout__hint">
          {t('Soporte de boletería revisa tu reclamo. Si se aprueba, te devolvemos el importe y las entradas quedan anuladas.')}</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            despachar({
              tipo: 'reclamar',
              usuarioId: usuario.id,
              ventaId: venta.id,
              cantidad,
              motivo,
            })
            onClose()
          }}
        >
          {t('Enviar reclamo')}</button>
      </div>
    </Modal>
  )
}
