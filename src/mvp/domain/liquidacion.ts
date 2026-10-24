import type { Asiento, CalculoLiquidacion, Evento, Remesa, Venta } from '../types'
import { netoVenta, sumarDias } from './ventas'

/** Día en que se liquida un evento: la fecha del evento más el plazo definido por la Asamblea. */
export function fechaLiquidacion(evento: Evento, plazoDias: number): string {
  return sumarDias(evento.fecha, plazoDias)
}

type Insumos = {
  evento: Evento
  ventas: Venta[]
  asientos: Asiento[]
  remesas: Remesa[]
  aporteFondoPct: number
  saldoFondoCentavos: number
}

/**
 * Calcula la liquidación final de un evento. Urbana es el único agente pagador: paga con lo
 * que tiene en mano (cobros electrónicos y remesas conciliadas). Si faltan fondos porque un
 * centro no remesó, el pago se prorratea y el artista recibe además lo que cubra el fondo de
 * contingencia, que luego se recupera del centro.
 */
export function calcularLiquidacion(i: Insumos): CalculoLiquidacion {
  const ventasEvento = i.ventas.filter((v) => v.eventoId === i.evento.id)
  const total = ventasEvento.reduce((s, v) => s + netoVenta(v), 0)
  const parte = (b: Asiento['beneficiario']) =>
    i.asientos
      .filter((a) => a.eventoId === i.evento.id && a.beneficiario === b)
      .reduce((s, a) => s + a.montoCentavos, 0)

  const correspondeCentro = parte('centro')
  const correspondeArtista = parte('artista')
  const correspondeUrbana = parte('urbana')

  const remesasEvento = i.remesas.filter((r) => r.eventoId === i.evento.id)
  const centroEnMano = remesasEvento.reduce((s, r) => s + r.retenidoCentroCentavos, 0)
  const online = ventasEvento
    .filter((v) => v.medioPago === 'electronico')
    .reduce((s, v) => s + netoVenta(v), 0)
  const remesado = remesasEvento
    .filter((r) => r.estado === 'conciliada')
    .reduce((s, r) => s + r.montoCentavos, 0)
  const urbanaEnMano = online + remesado

  const debeCentro = Math.max(0, correspondeCentro - centroEnMano)
  const necesario = correspondeArtista + debeCentro + correspondeUrbana
  const razon = necesario > 0 ? Math.min(1, urbanaEnMano / necesario) : 1

  const pagoArtista = Math.floor(correspondeArtista * razon)
  const acreditaCentro = Math.floor(debeCentro * razon)
  // Urbana se queda con el resto de lo que tiene en mano, hasta su comisión.
  const retieneBruta =
    razon >= 1 ? correspondeUrbana : Math.max(0, urbanaEnMano - pagoArtista - acreditaCentro)

  const faltaArtista = correspondeArtista - pagoArtista
  const coberturaFondo = Math.min(faltaArtista, i.saldoFondoCentavos)

  const aporteFondo = Math.min(retieneBruta, Math.floor((total * i.aporteFondoPct) / 100))

  return {
    totalCentavos: total,
    correspondeCentro,
    correspondeArtista,
    correspondeUrbana,
    centroEnMano,
    urbanaEnMano,
    pagoArtista,
    coberturaFondo,
    acreditaCentro,
    pendienteCentro: debeCentro - acreditaCentro,
    retieneUrbana: retieneBruta - aporteFondo,
    aporteFondo,
  }
}
