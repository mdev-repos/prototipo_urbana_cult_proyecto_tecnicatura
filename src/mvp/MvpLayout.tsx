import { Outlet } from 'react-router-dom'
import { MvpBar } from './components/MvpBar'
import { MvpProvider } from './state'

export function MvpLayout() {
  return (
    <MvpProvider>
      <MvpBar />
      <Outlet />
    </MvpProvider>
  )
}
