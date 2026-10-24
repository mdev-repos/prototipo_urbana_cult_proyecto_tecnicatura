import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './layouts/Layout'
import { RequireRol } from './mvp/components/RequireRol'
import { MvpLayout } from './mvp/MvpLayout'
import { Landing } from './mvp/pages/Landing'
import { Admin } from './mvp/pages/Admin'
import { Artista } from './mvp/pages/Artista'
import { Centro } from './mvp/pages/Centro'
import { Coordinacion } from './mvp/pages/Coordinacion'
import { Cliente } from './mvp/pages/Cliente'
import { Vendedor } from './mvp/pages/Vendedor'
import type { Rol } from './mvp/types'
import { Equipo } from './pages/Equipo'
import { Proyecto } from './pages/Proyecto'

/** Panel de cada rol. */
const paneles: Record<Rol, ReactNode> = {
  cliente: <Cliente />,
  vendedor: <Vendedor />,
  centro: <Centro />,
  artista: <Artista />,
  admin: <Admin />,
  coordinacion: <Coordinacion />,
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/equipo" replace />} />
        <Route path="equipo" element={<Equipo />} />
        <Route path="proyecto" element={<Proyecto />} />
        <Route path="mvp" element={<MvpLayout />}>
          <Route index element={<Landing />} />
          {(Object.keys(paneles) as Rol[]).map((rol) => (
            <Route
              key={rol}
              path={rol}
              element={<RequireRol rol={rol}>{paneles[rol]}</RequireRol>}
            />
          ))}
          <Route path="*" element={<Navigate to="/mvp" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/equipo" replace />} />
      </Route>
    </Routes>
  )
}
