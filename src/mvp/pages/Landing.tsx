import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogoMark } from '../../components/Logo'
import { EventCard } from '../components/EventCard'
import { etiquetaUsuario, metaRol } from '../roles'
import { artistas, useMvp } from '../state'
import { t } from '../../i18n'

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
      setError(t('Esta cuenta está deshabilitada.', 'Esta conta está desabilitada.'))
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
      setError(t('Usuario o contraseña incorrectos.', 'Usuário ou senha incorretos.'))
      return
    }
    entrar(usuario.id)
  }

  return (
    <div className="access" id="acceso">
      <h2 className="access__title">{t('Ingresar', 'Entrar')}</h2>

      <form onSubmit={enviar} className="form" noValidate>
        <label className="field">
          <span>{t('Email')}</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('lucia@demo.urbana')}
          />
        </label>
        <label className="field">
          <span>{t('Contraseña', 'Senha')}</span>
          <input
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder={t('demo')}
          />
        </label>
        {error ? (
          <p className="form__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary">
          {t('Ingresar', 'Entrar')}
        </button>
      </form>

      <div className="access__divider">
        <span>{t('o ingresá como', 'ou entre como')}</span>
      </div>

      <div className="form">
        <label className="field">
          <span className="sr-only">{t('Perfil de prueba', 'Perfil de teste')}</span>
          <select value={comoId} onChange={(e) => setComoId(e.target.value)}>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {etiquetaUsuario(u)} {t('·')}{" "}{u.nombre}
                {u.activo === false ? ` (${t('deshabilitado')})` : ''}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" onClick={() => entrar(comoId)}>
          {t('Entrar con este perfil', 'Entrar com este perfil')}
        </button>
      </div>

      <p className="access__hint">
        {t(
          'Usuarios de prueba. La contraseña de todos es',
          'Usuários de teste. A senha de todos é',
        )}{' '}
        <code>{CLAVE_DEMO}</code>{t('.')}</p>
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
            <p className="eyebrow">{t('Red de centros culturales', 'Rede de centros culturais')}</p>
            <h1>
              {t(
                'Cultura en red, cobrada y repartida sin demoras.',
                'Cultura em rede, cobrada e dividida sem atrasos.',
              )}
            </h1>
            <p className="lead">
              {t(
                'Una cartelera única, entradas sin sobreventa y el reparto de cada cobro entre el centro, el artista y la red, asentado en el momento del pago.',
                'Uma programação única, ingressos sem venda em excesso e a divisão de cada pagamento entre o centro, o artista e a rede, registrada no momento do pagamento.',
              )}
            </p>
            <div className="hero__actions">
              <button type="button" className="btn btn--primary" onClick={() => irA('cartelera')}>
                {t('Ver cartelera', 'Ver programação')}
              </button>
              <button type="button" className="btn" onClick={() => irA('acceso')}>
                {t('Ingresar', 'Entrar')}
              </button>
            </div>
          </div>
          <AccesoCard />
        </div>
      </section>

      <section id="cartelera" className="page cartelera">
        <div className="cartelera__head">
          <h2>{t('Cartelera', 'Programação')}</h2>
          <p className="muted">
            {t(
              'Orden de portada: primero los destacados por la Asamblea, luego por fecha.',
              'Ordem da vitrine: primeiro os destaques da Assembleia, depois por data.',
            )}
          </p>
        </div>

        <div
          className="chips"
          role="group"
          aria-label={t('Filtrar por categoría', 'Filtrar por categoria')}
        >
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              className={c === categoria ? 'chip is-active' : 'chip'}
              onClick={() => setCategoria(c)}
              aria-pressed={c === categoria}
            >
              {t(c)}
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
                etiqueta: t('Ingresá para comprar', 'Entre para comprar'),
                onClick: () => irA('acceso'),
              }}
            />
          ))}
          {eventos.length === 0 ? (
            <p className="muted">
              {t('No hay eventos para esta categoría.', 'Não há eventos nesta categoria.')}
            </p>
          ) : null}
        </div>
      </section>
    </>
  )
}
