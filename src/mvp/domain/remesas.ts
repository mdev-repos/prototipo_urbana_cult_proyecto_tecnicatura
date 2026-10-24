import type { Asiento, Centro, Evento, Remesa, Venta } from '../types'
import { netoVenta, sumarDias } from './ventas'

export const referenciaRemesa = (n: number) => `REM-${String(n).padStart(5, '0')}`

export type PendienteRemesa = {
  vendido: number
  cubierto: number
  pendiente: number
  /** Día de la venta en efectivo más antigua que todavía no está cubierta. */
  desde: string | null
  /** Fecha límite para remesarla (la venta más antigua + el plazo). */
  limite: string | null
  vencida: boolean
}

/**
 * Efectivo de un evento que el centro todavía debe remesar. Las remesas cubren las ventas
 * en efectivo de la más antigua a la más nueva; la remesa vence pasado el plazo.
 */
export function pendienteDeRemesa(
  ventas: Venta[],
  remesas: Remesa[],
  eventoId: string,
  hoy: string,
  plazoDias: number,
): PendienteRemesa {
  const efectivo = ventas
    .filter((v) => v.eventoId === eventoId && v.medioPago === 'efectivo')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const vendido = efectivo.reduce((s, v) => s + netoVenta(v), 0)
  const cubierto = remesas
    .filter((r) => r.eventoId === eventoId)
    .reduce((s, r) => s + r.efectivoCubiertoCentavos, 0)

  let restante = cubierto
  let desde: string | null = null
  for (const v of efectivo) {
    if (restante >= netoVenta(v)) {
      restante -= netoVenta(v)
      continue
    }
    desde = v.fecha
    break
  }

  const limite = desde ? sumarDias(desde, plazoDias) : null
  return {
    vendido,
    cubierto,
    pendiente: Math.max(0, vendido - cubierto),
    desde,
    limite,
    vencida: limite !== null && hoy > limite,
  }
}

/** Parte total del evento que le corresponde al centro, según el libro mayor. */
export function parteDelCentro(asientos: Asiento[], eventoId: string): number {
  return asientos
    .filter((a) => a.eventoId === eventoId && a.beneficiario === 'centro')
    .reduce((s, a) => s + a.montoCentavos, 0)
}

export type PropuestaRemesa = {
  tipo: 'bruta' | 'final'
  efectivoCubiertoCentavos: number
  retenidoCentroCentavos: number
  montoCentavos: number
}

/**
 * Calcula la remesa que corresponde generar. Antes del evento es bruta: se transfiere todo
 * el efectivo pendiente. Desde el día del evento es la final: el centro descuenta su parte,
 * hasta el límite del efectivo pendiente, y transfiere el resto.
 */
export function proponerRemesa(
  evento: Evento,
  ventas: Venta[],
  remesas: Remesa[],
  asientos: Asiento[],
  hoy: string,
  plazoDias: number,
): PropuestaRemesa | null {
  const p = pendienteDeRemesa(ventas, remesas, evento.id, hoy, plazoDias)
  if (p.pendiente <= 0) return null

  if (hoy < evento.fecha.slice(0, 10)) {
    return {
      tipo: 'bruta',
      efectivoCubiertoCentavos: p.pendiente,
      retenidoCentroCentavos: 0,
      montoCentavos: p.pendiente,
    }
  }

  const yaRetenido = remesas
    .filter((r) => r.eventoId === evento.id)
    .reduce((s, r) => s + r.retenidoCentroCentavos, 0)
  const aRetener = Math.min(
    p.pendiente,
    Math.max(0, parteDelCentro(asientos, evento.id) - yaRetenido),
  )
  return {
    tipo: 'final',
    efectivoCubiertoCentavos: p.pendiente,
    retenidoCentroCentavos: aRetener,
    montoCentavos: p.pendiente - aRetener,
  }
}

/** Un centro con remesas vencidas queda bloqueado hasta regularizarse. */
export function centroConRemesaVencida(
  centro: Centro,
  eventos: Evento[],
  ventas: Venta[],
  remesas: Remesa[],
  hoy: string,
  plazoDias: number,
): boolean {
  return eventos
    .filter((e) => e.centroId === centro.id)
    .some((e) => pendienteDeRemesa(ventas, remesas, e.id, hoy, plazoDias).vencida)
}
