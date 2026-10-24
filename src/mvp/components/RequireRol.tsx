import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { metaRol } from '../roles'
import { useMvp } from '../state'
import type { Rol } from '../types'

/** Protege una ruta: sin sesión vuelve a la landing; con otro rol, lo manda a su panel. */
export function RequireRol({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { usuario } = useMvp()
  if (!usuario) return <Navigate to="/mvp" replace />
  if (usuario.rol !== rol) return <Navigate to={metaRol[usuario.rol].ruta} replace />
  return children
}
