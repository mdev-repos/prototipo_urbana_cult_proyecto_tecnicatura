import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogoHorizontal, LogoMark } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTheme } from '../theme/useTheme'

const links = [
  { to: '/equipo', label: 'Equipo' },
  { to: '/proyecto', label: 'Proyecto' },
  { to: '/mvp', label: 'MVP' },
]

export function Layout() {
  const { theme, toggle } = useTheme()

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="brand" aria-label="Urbana Cult, inicio">
            <LogoHorizontal className="brand__logo brand__logo--full" />
            <LogoMark className="brand__logo brand__logo--mark" />
          </Link>
          <nav className="site-nav" aria-label="Principal">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'site-nav__link is-active' : 'site-nav__link'
                }
              >
                {link.label}
              </NavLink>
            ))}
            <ThemeToggle theme={theme} onToggle={toggle} />
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>Urbana Cult · Equipo 23 · Comisión A · IFTS N° 29 · Ingeniería de Software</p>
      </footer>
    </>
  )
}
