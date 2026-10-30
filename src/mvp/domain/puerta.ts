import type { Entrada, Evento } from '../types'

export type ResultadoPuerta =
  | { tipo: 'valida'; entrada: Entrada; evento: Evento }
  | { tipo: 'usada'; entrada: Entrada; evento: Evento }
  | { tipo: 'anulada'; entrada: Entrada; evento: Evento }
  | { tipo: 'otro-centro'; entrada: Entrada; evento: Evento }
  | { tipo: 'inexistente' }

/** Controla en la puerta el código del QR de una entrada, sin modificar nada. */
export function validarEnPuerta(
  entradas: Entrada[],
  eventos: Evento[],
  codigo: string,
  centroId: string,
): ResultadoPuerta {
  const limpio = codigo.trim().toUpperCase()
  const entrada = entradas.find((e) => e.codigo === limpio)
  if (!entrada) return { tipo: 'inexistente' }
  const evento = eventos.find((e) => e.id === entrada.eventoId)
  if (!evento) return { tipo: 'inexistente' }
  if (evento.centroId !== centroId) return { tipo: 'otro-centro', entrada, evento }
  if (entrada.anulada) return { tipo: 'anulada', entrada, evento }
  if (entrada.ingreso) return { tipo: 'usada', entrada, evento }
  return { tipo: 'valida', entrada, evento }
}
