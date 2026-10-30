import type { ReservaSala } from '../types'
import { repartir } from './ventas'

/** Horas en las que se puede empezar un ensayo. */
export const HORAS_SALA = [14, 15, 16, 17, 18, 19, 20, 21]

export function reservaDeFranja(
  reservas: ReservaSala[],
  salaId: string,
  fecha: string,
  hora: number,
): ReservaSala | undefined {
  return reservas.find((r) => r.salaId === salaId && r.fecha === fecha && r.hora === hora)
}

/** Reparto de un alquiler entre el espacio dueño de la sala y la comisión de Urbana Cult. */
export function repartoAlquiler(totalCentavos: number, comisionPct: number) {
  const r = repartir(totalCentavos, comisionPct, { centro: 1, artista: 0 })
  return { centro: r.centro, urbana: r.urbana }
}
