import { useMemo, useState } from 'react'
import { Checkout } from '../components/Checkout'
import { EventCard } from '../components/EventCard'
import { ReclamoModal } from '../components/ReclamoModal'
import { SalasEnsayo } from '../components/SalasEnsayo'
import { RepartoVenta } from '../components/RepartoVenta'
import { TicketCard } from '../components/TicketCard'
import { disponibles, entradasNetas } from '../domain/ventas'
import { formatearCentavos, formatearDiaCorto } from '../format'
import { useAhora } from '../hooks'
import { artistas, useMvp } from '../state'
import type { Evento, Venta } from '../types'
import { t } from '../../i18n'

type Pestana = 'cartelera' | 'entradas' | 'salas'

function Cartelera({ onComprar }: { onComprar: (e: Evento) => void }) {
  const { estado } = useMvp()
  const ahora = useAhora(1000)
  const [categoria, setCategoria] = useState('Todas')

  const categorias = useMemo(
    () => ['Todas', ...new Set(estado.eventos.map((e) => e.categoria))],
    [estado.eventos],
  )
  const eventos = estado.eventos
    .filter((e) => categoria === 'Todas' || e.categoria === categoria)
    .filter((e) => !e.baja && e.fecha.slice(0, 10) >= estado.hoy)
    .sort((a, b) => Number(b.destacado) - Number(a.destacado) || a.fecha.localeCompare(b.fecha))

  return (
    <>
      <div className="chips" role="group" aria-label={t('Filtrar por categoría')}>
        {categorias.map((c) => (
          <button
            key={c}
            type="button"
            className={c === categoria ? 'chip is-active' : 'chip'}
            onClick={() => setCategoria(c)}
            aria-pressed={c === categoria}
          >
            {t(c)}
          </button>
        ))}
      </div>
      <div className="events">
        {eventos.map((evento) => {
          const quedan = disponibles(evento, estado.ventas, estado.reservas, ahora)
          const soloDifusion = Boolean(
            estado.centros.find((c) => c.id === evento.centroId)?.soloDifusion,
          )
          return (
            <EventCard
              key={evento.id}
              evento={evento}
              centro={estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? ''}
              artista={artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''}
              quedan={quedan}
              accion={{
                etiqueta: soloDifusion
                  ? t('Venta en el centro', 'Venda no centro')
                  : quedan === 0
                    ? t('Agotado')
                    : t('Comprar'),
                onClick: () => onComprar(evento),
                deshabilitada: quedan === 0 || soloDifusion,
              }}
            />
          )
        })}
      </div>
    </>
  )
}

/** Estado del reclamo de una compra y, si corresponde, el botón para presentar uno. */
function Reclamo({
  venta,
  puedeReclamar,
  onReclamar,
}: {
  venta: Venta
  puedeReclamar: boolean
  onReclamar: () => void
}) {
  const { estado } = useMvp()
  const reclamos = estado.incidencias.filter((i) => i.tipo === 'reclamo' && i.ventaId === venta.id)
  const abierto = reclamos.find((i) => i.estado === 'abierta')
  const ultimo = reclamos[reclamos.length - 1]

  return (
    <div className="claim">
      {abierto ? (
        <p className="notice">
          <strong>{t('Reclamo en curso.')}</strong> {abierto.descripcion}{' '}
          {t('Soporte de boletería lo está revisando.')}
        </p>
      ) : (
        <>
          {ultimo ? <p className="notice notice--ok">{ultimo.resolucion}</p> : null}
          {puedeReclamar ? (
            <button type="button" className="btn btn--ghost" onClick={onReclamar}>
              {t('Reclamar o pedir una devolución')}
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}

function MisEntradas({ irACartelera }: { irACartelera: () => void }) {
  const { estado, usuario } = useMvp()
  const [reclamando, setReclamando] = useState<Venta | null>(null)
  const ventas = estado.ventas.filter((v) => v.compradorId === usuario?.id).reverse()

  if (ventas.length === 0) {
    return (
      <div className="empty">
        <p>{t('Todavía no compraste entradas.')}</p>
        <button type="button" className="btn" onClick={irACartelera}>
          {t('Ver la cartelera')}
        </button>
      </div>
    )
  }

  return (
    <div className="orders">
      {ventas.map((venta) => {
        const evento = estado.eventos.find((e) => e.id === venta.eventoId)
        if (!evento) return null
        const centro = estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? ''
        const entradas = estado.entradas.filter((t) => t.ventaId === venta.id)
        return (
          <section key={venta.id} className="order">
            <header className="order__head">
              <h3>{evento.titulo}</h3>
              <p className="muted">
                {t('Compra del')} {formatearDiaCorto(venta.fecha)} {t('·')} {venta.cantidad}{' '}
                {venta.cantidad === 1 ? t('entrada') : t('entradas')} {t('·')}{' '}
                {formatearCentavos(venta.totalCentavos)}
                {venta.reembolsadoCentavos
                  ? ' · ' +
                    t('devuelto {monto}', { monto: formatearCentavos(venta.reembolsadoCentavos) })
                  : ''}
              </p>
            </header>
            <div className="tickets">
              {entradas.map((t) => (
                <TicketCard key={t.id} entrada={t} evento={evento} centro={centro} />
              ))}
            </div>
            <RepartoVenta ventaId={venta.id} />
            <Reclamo
              venta={venta}
              puedeReclamar={
                entradasNetas(venta) > 0 &&
                evento.fecha.slice(0, 10) >= estado.hoy &&
                !estado.liquidaciones.some((l) => l.eventoId === evento.id)
              }
              onReclamar={() => setReclamando(venta)}
            />
          </section>
        )
      })}
      {reclamando ? <ReclamoModal venta={reclamando} onClose={() => setReclamando(null)} /> : null}
    </div>
  )
}

export function Cliente() {
  const { usuario } = useMvp()
  const [pestana, setPestana] = useState<Pestana>('cartelera')
  const [comprando, setComprando] = useState<Evento | null>(null)

  return (
    <div className="page">
      <p className="eyebrow">{t('Cliente final')}</p>
      <h1>
        {t('Hola,')} {usuario?.nombre.split(' ')[0]}
      </h1>
      <p className="lead">
        {t(
          'Elegí un evento, pagá y recibí tu entrada. Vas a ver, además, cómo se reparte tu pago.',
        )}
      </p>

      <div className="tabs" role="tablist" aria-label={t('Secciones del panel')}>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'cartelera'}
          className={pestana === 'cartelera' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('cartelera')}
        >
          {t('Cartelera')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'entradas'}
          className={pestana === 'entradas' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('entradas')}
        >
          {t('Mis entradas')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'salas'}
          className={pestana === 'salas' ? 'tab is-active' : 'tab'}
          onClick={() => setPestana('salas')}
        >
          {t('Salas de ensayo')}
        </button>
      </div>

      {pestana === 'cartelera' ? (
        <Cartelera onComprar={setComprando} />
      ) : pestana === 'salas' ? (
        <SalasEnsayo />
      ) : (
        <MisEntradas irACartelera={() => setPestana('cartelera')} />
      )}

      {comprando ? <Checkout evento={comprando} onClose={() => setComprando(null)} /> : null}
    </div>
  )
}
