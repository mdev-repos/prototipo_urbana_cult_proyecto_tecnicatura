import type { CierreCaja, Venta } from '../types'

/** Ventas de boletería de un vendedor en un día. */
export function ventasDeCaja(ventas: Venta[], vendedorId: string, fecha: string): Venta[] {
  return ventas.filter(
    (v) => v.canal === 'boleteria' && v.vendedorId === vendedorId && v.fecha === fecha,
  )
}

export function totalesDeCaja(ventas: Venta[]) {
  let efectivo = 0
  let electronico = 0
  let entradas = 0
  for (const v of ventas) {
    if (v.medioPago === 'efectivo') efectivo += v.totalCentavos
    else electronico += v.totalCentavos
    entradas += v.cantidad
  }
  return { efectivo, electronico, entradas }
}

export function cierreDelDia(
  cierres: CierreCaja[],
  vendedorId: string,
  fecha: string,
): CierreCaja | undefined {
  return cierres.find((c) => c.vendedorId === vendedorId && c.fecha === fecha)
}
