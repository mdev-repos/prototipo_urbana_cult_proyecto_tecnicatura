import { useEffect, useRef, useState } from 'react'
import { disponibles } from '../domain/ventas'
import { formatearFecha, formatearHora, formatearPesos } from '../format'
import { useAhora } from '../hooks'
import { artistas, parametros, useMvp } from '../state'
import type { Evento } from '../types'
import { Modal } from './Modal'
import { RepartoVenta } from './RepartoVenta'
import { TicketCard } from './TicketCard'

const MAXIMO_POR_COMPRA = 6

type Resultado = { tipo: 'ok'; ventaId: string } | { tipo: 'rechazado' } | { tipo: 'vencida' }

function formatearCuenta(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

type Props = {
  evento: Evento
  onClose: () => void
}

/**
 * Compra online en cuatro pasos: elegir cantidad, reservar el cupo con vencimiento, pagar
 * con la pasarela (simulada) y recibir la entrada con el reparto ya asentado.
 */
export function Checkout({ evento, onClose }: Props) {
  const { estado, usuario, despachar } = useMvp()
  const ahora = useAhora(500)
  const [cantidad, setCantidad] = useState(1)
  const [simularRechazo, setSimularRechazo] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const ventasAlPagar = useRef<number | null>(null)

  const centro = estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? ''
  const artista = artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''
  const reserva = estado.reservas.find(
    (r) => r.eventoId === evento.id && r.usuarioId === usuario?.id,
  )
  const vigente = reserva !== undefined && reserva.venceTs > ahora
  const libres = disponibles(evento, estado.ventas, estado.reservas, ahora, reserva?.id)

  // Una reserva vencida libera el cupo y avisa al comprador.
  useEffect(() => {
    if (reserva && !vigente && resultado === null && ventasAlPagar.current === null) {
      despachar({ tipo: 'liberar-reserva', reservaId: reserva.id })
      setResultado({ tipo: 'vencida' })
    }
  }, [reserva, vigente, resultado, despachar])

  // Tras pagar: si apareció una venta nueva del comprador, la compra salió bien.
  useEffect(() => {
    if (ventasAlPagar.current === null || estado.ventas.length <= ventasAlPagar.current) return
    const venta = [...estado.ventas]
      .reverse()
      .find((v) => v.compradorId === usuario?.id && v.eventoId === evento.id)
    ventasAlPagar.current = null
    if (venta) setResultado({ tipo: 'ok', ventaId: venta.id })
  }, [estado.ventas, usuario?.id, evento.id])

  if (!usuario) return null

  function reservar() {
    despachar({
      tipo: 'reservar',
      eventoId: evento.id,
      usuarioId: usuario!.id,
      cantidad,
      ahora: Date.now(),
    })
  }

  function pagar() {
    if (!reserva) return
    if (simularRechazo) {
      despachar({ tipo: 'liberar-reserva', reservaId: reserva.id })
      setResultado({ tipo: 'rechazado' })
      return
    }
    ventasAlPagar.current = estado.ventas.length
    despachar({ tipo: 'pagar-reserva', reservaId: reserva.id, ahora: Date.now() })
  }

  function cancelar() {
    if (reserva) despachar({ tipo: 'liberar-reserva', reservaId: reserva.id })
    onClose()
  }

  function cerrar() {
    if (reserva && resultado === null) despachar({ tipo: 'liberar-reserva', reservaId: reserva.id })
    onClose()
  }

  const maxElegible = Math.min(MAXIMO_POR_COMPRA, libres)
  const cantidadActual = Math.min(cantidad, Math.max(1, maxElegible))
  const total = evento.precio * (reserva?.cantidad ?? cantidadActual)

  return (
    <Modal
      titulo={resultado?.tipo === 'ok' ? 'Compra confirmada' : 'Comprar entradas'}
      onClose={cerrar}
    >
      <div className="checkout__event">
        <p className="checkout__title">{evento.titulo}</p>
        <p className="muted">
          {artista} · {centro}
        </p>
        <p className="muted">
          {formatearFecha(evento.fecha)} · {formatearHora(evento.fecha)} h ·{' '}
          {formatearPesos(evento.precio)} c/u
        </p>
      </div>

      {resultado?.tipo === 'ok' ? (
        <Confirmacion ventaId={resultado.ventaId} onClose={onClose} />
      ) : resultado?.tipo === 'rechazado' ? (
        <div className="notice notice--error">
          <p>
            <strong>El pago fue rechazado.</strong> No se cobró nada y el cupo que habías reservado
            volvió a quedar libre.
          </p>
          <button type="button" className="btn" onClick={() => setResultado(null)}>
            Intentar de nuevo
          </button>
        </div>
      ) : resultado?.tipo === 'vencida' ? (
        <div className="notice notice--error">
          <p>
            <strong>La reserva venció.</strong> Pasaron más de {parametros.vencimientoReservaMin}{' '}
            minutos sin pagar, así que el cupo se liberó para que lo tome otra persona.
          </p>
          <button type="button" className="btn" onClick={() => setResultado(null)}>
            Volver a reservar
          </button>
        </div>
      ) : vigente && reserva ? (
        <div className="checkout__step">
          <p className="notice">
            Cupo reservado para <strong>{reserva.cantidad}</strong>{' '}
            {reserva.cantidad === 1 ? 'entrada' : 'entradas'}. Tenés{' '}
            <strong className="checkout__timer">{formatearCuenta(reserva.venceTs - ahora)}</strong>{' '}
            para pagar.
          </p>
          <p className="checkout__total">
            Total <strong>{formatearPesos(total)}</strong>
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={simularRechazo}
              onChange={(e) => setSimularRechazo(e.target.checked)}
            />
            <span>Simular que la pasarela rechaza el pago</span>
          </label>
          <div className="checkout__actions">
            <button type="button" className="btn btn--primary" onClick={pagar}>
              Pagar {formatearPesos(total)}
            </button>
            <button type="button" className="btn" onClick={cancelar}>
              Cancelar
            </button>
          </div>
          <button
            type="button"
            className="linklike"
            onClick={() =>
              despachar({
                tipo: 'vencer-reserva',
                reservaId: reserva.id,
                venceTs: Date.now() + 4000,
              })
            }
          >
            Demo: ver qué pasa si la reserva vence
          </button>
        </div>
      ) : libres === 0 ? (
        <p className="notice notice--error">Este evento está agotado.</p>
      ) : (
        <div className="checkout__step">
          <label className="field">
            <span>Cantidad (máximo {maxElegible})</span>
            <select value={cantidadActual} onChange={(e) => setCantidad(Number(e.target.value))}>
              {Array.from({ length: maxElegible }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <p className="checkout__total">
            Total <strong>{formatearPesos(total)}</strong>
          </p>
          <p className="muted checkout__hint">
            Al continuar apartamos tu cupo durante {parametros.vencimientoReservaMin} minutos, así
            nadie más puede quedarse con tus entradas mientras pagás.
          </p>
          <button type="button" className="btn btn--primary" onClick={reservar}>
            Reservar y continuar
          </button>
        </div>
      )}
    </Modal>
  )
}

function Confirmacion({ ventaId, onClose }: { ventaId: string; onClose: () => void }) {
  const { estado } = useMvp()
  const venta = estado.ventas.find((v) => v.id === ventaId)
  const evento = estado.eventos.find((e) => e.id === venta?.eventoId)
  if (!venta || !evento) return null
  const centro = estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? ''
  const entradas = estado.entradas.filter((t) => t.ventaId === ventaId)

  return (
    <div className="checkout__step">
      <p className="notice notice--ok">
        Pago aprobado. Emitimos{' '}
        {entradas.length === 1 ? 'tu entrada' : `tus ${entradas.length} entradas`} con código QR
        único.
      </p>
      <div className="tickets">
        {entradas.map((t) => (
          <TicketCard key={t.id} entrada={t} evento={evento} centro={centro} />
        ))}
      </div>
      <RepartoVenta ventaId={ventaId} />
      <button type="button" className="btn btn--primary" onClick={onClose}>
        Listo
      </button>
    </div>
  )
}
