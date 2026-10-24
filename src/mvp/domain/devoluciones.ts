import type { Asiento, Beneficiario, Entrada, Evento, Venta } from '../types'
import { repartir } from './ventas'

type Datos = {
  seq: number
  venta: Venta
  evento: Evento
  entradas: Entrada[]
  asientos: Asiento[]
  /** Cuántas entradas se devuelven. */
  cantidad: number
  comisionPct: number
  fecha: string
}

type Resultado = {
  seq: number
  venta: Venta
  entradas: Entrada[]
  /** Asientos de reversión, para agregar al libro mayor. */
  reversiones: Asiento[]
  reembolsoCentavos: number
}

/**
 * Devuelve entradas de una venta con una reversión prorrateada: cada beneficiario devuelve la
 * misma proporción que había recibido, así el libro mayor sigue balanceado y nada se borra ni
 * se modifica (los asientos originales quedan; se agregan los que los compensan).
 */
export function devolverEntradas(d: Datos): Resultado {
  const reembolsoCentavos = d.evento.precio * d.cantidad * 100
  const reparto = repartir(reembolsoCentavos, d.comisionPct, d.evento.resto)
  const originales = d.asientos.filter((a) => a.ventaId === d.venta.id && !a.reversaDe)

  let seq = d.seq
  const reversiones: Asiento[] = []
  for (const b of ['centro', 'artista', 'urbana'] as Beneficiario[]) {
    const original = originales.find((a) => a.beneficiario === b)
    if (!original || reparto[b] === 0) continue
    seq += 1
    reversiones.push({
      id: `a-${seq}`,
      ventaId: d.venta.id,
      eventoId: d.evento.id,
      beneficiario: b,
      beneficiarioId: original.beneficiarioId,
      montoCentavos: -reparto[b],
      estado: original.estado,
      fecha: d.fecha,
      reversaDe: original.id,
    })
  }

  // Se anulan las últimas entradas que sigan vigentes.
  const vigentes = d.entradas.filter((t) => t.ventaId === d.venta.id && !t.anulada)
  const anular = new Set(vigentes.slice(vigentes.length - d.cantidad).map((t) => t.id))

  return {
    seq,
    venta: {
      ...d.venta,
      devueltas: (d.venta.devueltas ?? 0) + d.cantidad,
      reembolsadoCentavos: (d.venta.reembolsadoCentavos ?? 0) + reembolsoCentavos,
    },
    entradas: d.entradas.map((t) => (anular.has(t.id) ? { ...t, anulada: true } : t)),
    reversiones,
    reembolsoCentavos,
  }
}
