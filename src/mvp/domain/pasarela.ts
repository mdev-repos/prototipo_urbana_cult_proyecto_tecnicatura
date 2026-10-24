import type { Venta } from '../types'

/** Cobros electrónicos que el libro mayor registró en un día, según las ventas. */
export function registradoDelDia(ventas: Venta[], fecha: string): number {
  return ventas
    .filter((v) => v.fecha === fecha && v.medioPago === 'electronico')
    .reduce((s, v) => s + v.totalCentavos, 0)
}

/**
 * Venta cuya confirmación la pasarela informó dos veces (día del 1/11): el libro mayor la asentó
 * una sola vez gracias a la idempotencia, así que el informe trae un cobro de más. Sirve para
 * mostrar cómo se detecta y se resuelve una diferencia en la conciliación diaria.
 */
export function duplicadoPasarela(ventas: Venta[], fecha: string): Venta | null {
  if (fecha !== '2026-11-01') return null
  return ventas.find((v) => v.fecha === fecha && v.medioPago === 'electronico') ?? null
}

/** Días desde el primero con ventas hasta hoy (inclusive). */
export function diasConciliables(hoy: string, desde = '2026-10-27'): string[] {
  const dias: string[] = []
  const fin = new Date(`${hoy}T12:00:00`)
  for (let d = new Date(`${desde}T12:00:00`); d <= fin; d.setDate(d.getDate() + 1)) {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dias.push(`${d.getFullYear()}-${mm}-${dd}`)
  }
  return dias
}
