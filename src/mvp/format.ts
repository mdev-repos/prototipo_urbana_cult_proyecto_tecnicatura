import { idioma } from '../i18n'

/** Las fechas siguen el idioma elegido; los importes son siempre pesos argentinos. */
const locale = () => (idioma() === 'pt' ? 'pt-BR' : 'es-AR')

const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export const formatearPesos = (valor: number) => pesos.format(valor)

export function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat(locale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

export function formatearHora(iso: string): string {
  return new Intl.DateTimeFormat(locale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/** Formatea una fecha YYYY-MM-DD (la del reloj de la demo). */
export function formatearDia(iso: string): string {
  return new Intl.DateTimeFormat(locale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00`))
}

export function formatearCentavos(centavos: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100)
}

/** Formatea una fecha YYYY-MM-DD en forma corta (ej. "mié, 11 nov"). */
export function formatearDiaCorto(iso: string): string {
  return new Intl.DateTimeFormat(locale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${iso.slice(0, 10)}T12:00:00`))
}
