import type { Asiento, Entrada, Evento, Remesa, Venta } from '../types'
import { referenciaRemesa } from './remesas'
import { registrarVenta } from './ventas'

/** Entradas ya vendidas de cada evento al comenzar la demo y primer día de venta. */
const VENDIDAS_INICIALES: Record<string, number> = {
  'e-tango': 62,
  'e-mareas': 96,
  'e-ojo': 41,
  'e-marga1': 18,
  'e-paralaje': 22,
  'e-ladrillo': 35,
  'e-marga2': 9,
  'e-nandues': 14,
  'e-telon-taller': 8,
}

const TAMANOS = [2, 1, 3, 2, 4, 1, 2]
const DIAS = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']

export type VentasSemilla = {
  seq: number
  ventas: Venta[]
  entradas: Entrada[]
  asientos: Asiento[]
  remesas: Remesa[]
}

/**
 * Genera ventas previas con la misma lógica que una venta real, para que la demo
 * arranque con cartelera con movimiento y libro mayor con saldos. Una de cada
 * cuatro es de boletería en efectivo (queda "en poder del centro").
 */
export function ventasIniciales(eventos: Evento[], comisionPct: number): VentasSemilla {
  let seq = 0
  const out: VentasSemilla = { seq: 0, ventas: [], entradas: [], asientos: [], remesas: [] }

  for (const evento of eventos) {
    let pendientes = VENDIDAS_INICIALES[evento.id] ?? 0
    let i = 0
    while (pendientes > 0) {
      const cantidad = Math.min(TAMANOS[i % TAMANOS.length], pendientes)
      const enBoleteria = i % 4 === 3
      const r = registrarVenta({
        seq,
        evento,
        comisionPct,
        compradorId: null,
        vendedorId: null,
        canal: enBoleteria ? 'boleteria' : 'web',
        medioPago: enBoleteria ? 'efectivo' : 'electronico',
        cantidad,
        fecha: DIAS[i % DIAS.length],
      })
      seq = r.seq
      out.ventas.push(r.venta)
      out.entradas.push(...r.entradas)
      out.asientos.push(...r.asientos)
      pendientes -= cantidad
      i += 1
    }
  }

  // Todos los centros están al día con sus remesas, salvo el Espacio Cultural del Sur (el de la
  // demo): le queda pendiente el efectivo del 1/11, que vence el 2/11, para poder mostrar la
  // remesa y qué pasa si se deja vencer.
  for (const evento of eventos) {
    const efectivo = out.ventas
      .filter(
        (v) =>
          v.eventoId === evento.id &&
          v.medioPago === 'efectivo' &&
          v.fecha < (evento.centroId === 'c-sur' ? '2026-11-01' : '2026-11-02'),
      )
      .reduce((suma, v) => suma + v.totalCentavos, 0)
    if (efectivo === 0) continue
    seq += 1
    out.remesas.push({
      id: `m-${seq}`,
      centroId: evento.centroId,
      eventoId: evento.id,
      fecha: '2026-11-01',
      tipo: 'bruta',
      efectivoCubiertoCentavos: efectivo,
      retenidoCentroCentavos: 0,
      montoCentavos: efectivo,
      referencia: referenciaRemesa(out.remesas.length + 1),
      estado: 'conciliada',
    })
  }

  out.seq = seq
  return out
}
