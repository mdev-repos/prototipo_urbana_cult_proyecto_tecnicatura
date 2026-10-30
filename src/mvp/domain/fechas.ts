import { sumarDias } from './ventas'

/** Día de referencia con el que están escritas las fechas de la demostración. */
export const DIA_BASE = '2026-11-02'

/** Hoy, según el reloj real del equipo, como YYYY-MM-DD. */
export function hoyReal(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Cuántos días hay que correr las fechas de referencia para que "hoy" de la demo sea el de hoy. */
export function desfaseHoy(): number {
  const base = new Date(`${DIA_BASE}T12:00:00`).getTime()
  const hoy = new Date(`${hoyReal()}T12:00:00`).getTime()
  return Math.round((hoy - base) / 86_400_000)
}

/** Corre una fecha YYYY-MM-DD o ISO con hora, conservando la hora. */
export function correrFecha(iso: string, desfase: number): string {
  return sumarDias(iso, desfase) + iso.slice(10)
}
