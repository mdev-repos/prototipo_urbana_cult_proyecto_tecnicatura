import type {
  Asiento,
  Beneficiario,
  CanalVenta,
  Entrada,
  Evento,
  MedioPago,
  Reserva,
  Venta,
} from '../types'

export type Reparto = Record<Beneficiario, number>

/**
 * Reparte un cobro entre centro, artista y Urbana, siempre en centavos enteros.
 *
 * La comisión de Urbana es un porcentaje del total (la fija la Asamblea). Lo que
 * queda se reparte entre centro y artista según el contrato del evento. Si la
 * división no es exacta, el resto de redondeo se asigna al beneficiario de mayor
 * participación y, en caso de empate, al centro cultural.
 */
export function repartir(
  totalCentavos: number,
  comisionPct: number,
  resto: { centro: number; artista: number },
): Reparto {
  const pesos = resto.centro + resto.artista
  const den = 100 * pesos
  const numeradores: Reparto = {
    urbana: totalCentavos * comisionPct * pesos,
    centro: totalCentavos * (100 - comisionPct) * resto.centro,
    artista: totalCentavos * (100 - comisionPct) * resto.artista,
  }

  const orden: Beneficiario[] = ['centro', 'artista', 'urbana']
  const reparto = {} as Reparto
  let asignado = 0
  for (const b of orden) {
    reparto[b] = Math.floor(numeradores[b] / den)
    asignado += reparto[b]
  }

  const mayor = orden.reduce((a, b) => (numeradores[b] > numeradores[a] ? b : a))
  reparto[mayor] += totalCentavos - asignado
  return reparto
}

/** Dinero que le quedó a una venta después de las devoluciones, en centavos. */
export const netoVenta = (v: Venta) => v.totalCentavos - (v.reembolsadoCentavos ?? 0)

/** Entradas de una venta que siguen vigentes. */
export const entradasNetas = (v: Venta) => v.cantidad - (v.devueltas ?? 0)

/** Cupo que todavía se puede vender: descuenta lo vendido y las reservas vigentes. */
export function disponibles(
  evento: Evento,
  ventas: Venta[],
  reservas: Reserva[],
  ahora: number,
  ignorarReservaId?: string,
): number {
  const vendidas = ventas
    .filter((v) => v.eventoId === evento.id)
    .reduce((suma, v) => suma + entradasNetas(v), 0)
  const reservadas = reservas
    .filter((r) => r.eventoId === evento.id && r.venceTs > ahora && r.id !== ignorarReservaId)
    .reduce((suma, r) => suma + r.cantidad, 0)
  return Math.max(0, evento.cupo - vendidas - reservadas)
}

function hash(texto: string): number {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

type DatosVenta = {
  seq: number
  evento: Evento
  comisionPct: number
  compradorId: string | null
  vendedorId: string | null
  canal: CanalVenta
  medioPago: MedioPago
  cantidad: number
  fecha: string
}

type ResultadoVenta = {
  seq: number
  venta: Venta
  entradas: Entrada[]
  asientos: Asiento[]
}

/**
 * Registra una venta como una única operación: la venta, sus entradas y el reparto
 * asentado en el libro mayor con estado "retenido". Si algo falla, no se registra nada.
 */
export function registrarVenta(datos: DatosVenta): ResultadoVenta {
  let seq = datos.seq + 1
  const ventaId = `v-${seq}`
  const totalCentavos = datos.evento.precio * datos.cantidad * 100

  const venta: Venta = {
    id: ventaId,
    eventoId: datos.evento.id,
    compradorId: datos.compradorId,
    vendedorId: datos.vendedorId,
    canal: datos.canal,
    medioPago: datos.medioPago,
    cantidad: datos.cantidad,
    totalCentavos,
    fecha: datos.fecha,
  }

  const entradas: Entrada[] = []
  for (let i = 0; i < datos.cantidad; i++) {
    seq += 1
    entradas.push({
      id: `t-${seq}`,
      ventaId,
      eventoId: datos.evento.id,
      codigo: `UC-${hash(`${ventaId}-${i}`).toString(36).toUpperCase().padStart(7, '0')}`,
    })
  }

  const reparto = repartir(totalCentavos, datos.comisionPct, datos.evento.resto)
  const destinos: Record<Beneficiario, string> = {
    centro: datos.evento.centroId,
    artista: datos.evento.artistaId,
    urbana: '',
  }
  const asientos: Asiento[] = (['centro', 'artista', 'urbana'] as Beneficiario[]).map((b) => {
    seq += 1
    return {
      id: `a-${seq}`,
      ventaId,
      eventoId: datos.evento.id,
      beneficiario: b,
      beneficiarioId: destinos[b],
      montoCentavos: reparto[b],
      estado: 'retenido',
      fecha: datos.fecha,
    }
  })

  return { seq, venta, entradas, asientos }
}

/** Suma `dias` a una fecha YYYY-MM-DD (o ISO con hora) y devuelve YYYY-MM-DD. */
export function sumarDias(iso: string, dias: number): string {
  const f = new Date(`${iso.slice(0, 10)}T12:00:00`)
  f.setDate(f.getDate() + dias)
  const mm = String(f.getMonth() + 1).padStart(2, '0')
  const dd = String(f.getDate()).padStart(2, '0')
  return `${f.getFullYear()}-${mm}-${dd}`
}
