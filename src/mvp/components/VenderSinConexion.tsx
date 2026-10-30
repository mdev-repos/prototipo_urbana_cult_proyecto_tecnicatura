import { useEffect, useRef, useState } from 'react'
import { bloqueLibre } from '../domain/ventas'
import { formatearFecha, formatearHora, formatearPesos } from '../format'
import { t } from '../../i18n'
import { artistas, useMvp } from '../state'
import type { Evento } from '../types'
import { Modal } from './Modal'

const MAXIMO_POR_VENTA = 10

type Props = {
  evento: Evento
  onClose: () => void
}

/** Venta de boletería sin internet: sale del bloque numerado que se reservó de antemano, solo en efectivo. */
export function VenderSinConexion({ evento, onClose }: Props) {
  const { estado, usuario, despachar } = useMvp()
  const [cantidad, setCantidad] = useState(1)
  const [vendida, setVendida] = useState<string[] | null>(null)
  const pendientesAntes = useRef<number | null>(null)

  const centro = estado.centros.find((c) => c.id === evento.centroId)
  const artista = artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''
  const enPendientes = estado.pendientes
    .filter((p) => p.eventoId === evento.id)
    .reduce((s, p) => s + p.cantidad, 0)
  const libres = bloqueLibre(evento, estado.ventas) - enPendientes
  const maximo = Math.min(MAXIMO_POR_VENTA, libres)
  const cantidadActual = Math.min(cantidad, Math.max(1, maximo))

  // Cuando aparece la venta pendiente nueva, se muestran los números que se entregaron.
  useEffect(() => {
    if (pendientesAntes.current === null || estado.pendientes.length <= pendientesAntes.current)
      return
    const ultima = estado.pendientes[estado.pendientes.length - 1]
    pendientesAntes.current = null
    if (ultima.eventoId === evento.id) setVendida(ultima.numeros)
  }, [estado.pendientes, evento.id])

  if (!usuario) return null

  function registrar() {
    pendientesAntes.current = estado.pendientes.length
    despachar({
      tipo: 'vender-sin-conexion',
      eventoId: evento.id,
      usuarioId: usuario!.id,
      cantidad: cantidadActual,
    })
  }

  return (
    <Modal
      titulo={vendida ? t('Venta sin conexión registrada') : t('Vender sin conexión')}
      onClose={onClose}
    >
      <div className="checkout__event">
        <p className="checkout__title">{evento.titulo}</p>
        <p className="muted">
          {artista} {t('·')} {centro?.nombre}
        </p>
        <p className="muted">
          {formatearFecha(evento.fecha)} {t('·')} {formatearHora(evento.fecha)} {t('h ·')}{' '}
          {formatearPesos(evento.precio)} {t('c/u')}
        </p>
      </div>

      {vendida ? (
        <div className="checkout__step">
          <p className="notice notice--ok">
            {t(
              'Venta registrada en el equipo, sin internet. Se entregaron estas entradas del bloque numerado:',
            )}
          </p>
          <ul className="bloque">
            {vendida.map((n) => (
              <li key={n} className="mono">
                {n}
              </li>
            ))}
          </ul>
          <p className="notice">
            {t(
              'Quedan pendientes de sincronizar. Al volver la conexión se asientan en el libro mayor y el efectivo se suma a la caja del día y a la próxima remesa.',
            )}
          </p>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {t('Listo')}
          </button>
        </div>
      ) : libres <= 0 ? (
        <p className="notice notice--error">
          {t('El bloque de contingencia de este evento se agotó.')}
        </p>
      ) : (
        <div className="checkout__step">
          <p className="notice">
            {t(
              'Sin conexión solo se vende en efectivo y con el bloque numerado que se reservó de antemano. Quedan {n} entradas del bloque.',
              { n: libres },
            )}
          </p>
          <label className="field">
            <span>
              {t('Cantidad (máximo')} {maximo}
              {t(')')}
            </span>
            <select value={cantidadActual} onChange={(e) => setCantidad(Number(e.target.value))}>
              {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <p className="checkout__total">
            {t('Total')} <strong>{formatearPesos(evento.precio * cantidadActual)}</strong> (
            {t('efectivo')})
          </p>
          <button type="button" className="btn btn--primary" onClick={registrar}>
            {t('Registrar venta sin conexión')}
          </button>
        </div>
      )}
    </Modal>
  )
}
