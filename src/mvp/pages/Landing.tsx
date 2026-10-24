import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogoMark } from '../../components/Logo'
import { EventCard } from '../components/EventCard'
import { etiquetaUsuario, metaRol } from '../roles'
import { artistas, useMvp } from '../state'

/** Contraseña de todos los usuarios de prueba. */
const CLAVE_DEMO = 'demo'

function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function AccesoCard() {
  const { estado, despachar } = useMvp()
  const usuarios = estado.usuarios
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [comoId, setComoId] = useState(usuarios[0].id)

  function entrar(usuarioId: string) {
    const usuario = usuarios.find((u) => u.id === usuarioId)
    if (!usuario) return
    if (usuario.activo === false) {
      setError('Esta cuenta está deshabilitada.')
      return
    }
    setError('')
    despachar({ tipo: 'login', usuarioId })
    navegar(metaRol[usuario.rol].ruta)
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    const usuario = usuarios.find((u) => u.email === email.trim().toLowerCase())
    if (!usuario || clave !== CLAVE_DEMO) {
      setError('Usuario o contraseña incorrectos.')
      return
    }
    entrar(usuario.id)
  }

  return (
    <div className="access" id="acceso">
      <h2 className="access__title">Ingresar</h2>

      <form onSubmit={enviar} className="form" noValidate>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lucia@demo.urbana"
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="demo"
          />
        </label>
        {error ? (
          <p className="form__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary">
          Ingresar
        </button>
      </form>

      <div className="access__divider">
        <span>o ingresá como</span>
      </div>

      <div className="form">
        <label className="field">
          <span className="sr-only">Perfil de prueba</span>
          <select value={comoId} onChange={(e) => setComoId(e.target.value)}>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {etiquetaUsuario(u)} · {u.nombre}
                {u.activo === false ? ' (deshabilitado)' : ''}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" onClick={() => entrar(comoId)}>
          Entrar con este perfil
        </button>
      </div>

      <p className="access__hint">
        Usuarios de prueba. La contraseña de todos es <code>{CLAVE_DEMO}</code>.
      </p>
    </div>
  )
}

export function Landing() {
  const { estado, usuario } = useMvp()
  const [categoria, setCategoria] = useState('Todas')

  const categorias = useMemo(
    () => ['Todas', ...new Set(estado.eventos.map((e) => e.categoria))],
    [estado.eventos],
  )

  // Criterio de portada: primero los destacados por la Asamblea, luego por fecha.
  const eventos = useMemo(
    () =>
      estado.eventos
        .filter((e) => categoria === 'Todas' || e.categoria === categoria)
        .filter((e) => !e.baja && e.fecha.slice(0, 10) >= estado.hoy)
        .sort(
          (a, b) => Number(b.destacado) - Number(a.destacado) || a.fecha.localeCompare(b.fecha),
        ),
    [estado.eventos, estado.hoy, categoria],
  )

  if (usuario) {
    return <Navigate to={metaRol[usuario.rol].ruta} replace />
  }

  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__text">
            <LogoMark className="hero__mark" />
            <p className="eyebrow">Red de centros culturales</p>
            <h1>Cultura en red, cobrada y repartida sin demoras.</h1>
            <p className="lead">
              Una cartelera única, entradas sin sobreventa y el reparto de cada cobro entre el
              centro, el artista y la red, asentado en el momento del pago.
            </p>
            <div className="hero__actions">
              <button type="button" className="btn btn--primary" onClick={() => irA('cartelera')}>
                Ver cartelera
              </button>
              <button type="button" className="btn" onClick={() => irA('acceso')}>
                Ingresar
              </button>
            </div>
          </div>
          <AccesoCard />
        </div>
      </section>

      <section id="cartelera" className="page cartelera">
        <div className="cartelera__head">
          <h2>Cartelera</h2>
          <p className="muted">
            Orden de portada: primero los destacados por la Asamblea, luego por fecha.
          </p>
        </div>

        <div className="chips" role="group" aria-label="Filtrar por categoría">
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              className={c === categoria ? 'chip is-active' : 'chip'}
              onClick={() => setCategoria(c)}
              aria-pressed={c === categoria}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="events">
          {eventos.map((evento) => (
            <EventCard
              key={evento.id}
              evento={evento}
              centro={estado.centros.find((c) => c.id === evento.centroId)?.nombre ?? ''}
              artista={artistas.find((a) => a.id === evento.artistaId)?.nombre ?? ''}
              accion={{
                etiqueta: 'Ingresá para comprar',
                onClick: () => irA('acceso'),
              }}
            />
          ))}
          {eventos.length === 0 ? (
            <p className="muted">No hay eventos para esta categoría.</p>
          ) : null}
        </div>
      </section>
    </>
  )
}
