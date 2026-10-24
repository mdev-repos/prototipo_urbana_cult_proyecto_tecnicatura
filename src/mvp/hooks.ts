import { useEffect, useState } from 'react'

/** Devuelve la hora actual (ms) y se refresca cada `intervaloMs`; sirve para cuentas regresivas. */
export function useAhora(intervaloMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return ahora
}
