import { useState, type FormEvent } from 'react'
import { metaRol } from '../roles'
import { artistas, useMvp } from '../state'
import type { AreaCoordinacion, Rol, Usuario } from '../types'
import { Modal } from './Modal'
import { t } from '../../i18n'

const ROLES = Object.keys(metaRol) as Rol[]

const AREAS: Record<AreaCoordinacion, string> = {
  administracion: 'Administración General (aprueba pagos)',
  cobros: 'Boletería y Cobros (ejecuta pagos)',
}

type Props = {
  /** Usuario a modificar; si falta, se crea uno nuevo. */
  usuario?: Usuario
  onClose: () => void
}

/** Alta y modificación de usuarios y de sus roles (RF-PLA-01). */
export function UsuarioForm({ usuario, onClose }: Props) {
  const { estado, usuario: admin, despachar } = useMvp()
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? 'cliente')
  const [centroId, setCentroId] = useState(usuario?.centroId ?? estado.centros[0]?.id ?? '')
  const [artistaId, setArtistaId] = useState(usuario?.artistaId ?? artistas[0].id)
  const [area, setArea] = useState<AreaCoordinacion>(usuario?.area ?? 'administracion')
  const [error, setError] = useState('')

  if (!admin) return null
  const esUnoMismo = usuario?.id === admin.id

  function enviar(e: FormEvent) {
    e.preventDefault()
    const correo = email.trim().toLowerCase()
    if (!nombre.trim()) return setError(t('Poné el nombre de la persona.'))
    if (!/^\S+@\S+\.\S+$/.test(correo)) return setError(t('Poné un email válido.'))
    if (estado.usuarios.some((u) => u.email.toLowerCase() === correo && u.id !== usuario?.id)) {
      return setError(t('El usuario ya existe con ese email.'))
    }
    despachar({
      tipo: 'admin-guardar-usuario',
      adminId: admin!.id,
      datos: {
        id: usuario?.id,
        nombre,
        email: correo,
        rol,
        centroId: rol === 'centro' || rol === 'vendedor' ? centroId : undefined,
        artistaId: rol === 'artista' ? artistaId : undefined,
        area: rol === 'coordinacion' ? area : undefined,
      },
    })
    onClose()
  }

  return (
    <Modal titulo={usuario ? t('Modificar usuario') : t('Nuevo usuario')} onClose={onClose}>
      <form className="form" onSubmit={enviar} noValidate>
        <label className="field">
          <span>{t('Nombre')}</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('Email')}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('Rol')}</span>
          <select value={rol} disabled={esUnoMismo} onChange={(e) => setRol(e.target.value as Rol)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(metaRol[r].etiqueta)}
              </option>
            ))}
          </select>
        </label>
        {esUnoMismo ? (
          <p className="muted checkout__hint">
            {t('No podés cambiar tu propio rol: te quedarías sin acceso.')}</p>
        ) : null}

        {rol === 'centro' || rol === 'vendedor' ? (
          <label className="field">
            <span>{t('Centro (los permisos se limitan a este centro)')}</span>
            <select value={centroId} onChange={(e) => setCentroId(e.target.value)}>
              {estado.centros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {rol === 'artista' ? (
          <label className="field">
            <span>{t('Artista')}</span>
            <select value={artistaId} onChange={(e) => setArtistaId(e.target.value)}>
              {artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {rol === 'coordinacion' ? (
          <label className="field">
            <span>{t('Área de la Coordinación Central')}</span>
            <select value={area} onChange={(e) => setArea(e.target.value as AreaCoordinacion)}>
              {(Object.keys(AREAS) as AreaCoordinacion[]).map((a) => (
                <option key={a} value={a}>
                  {t(AREAS[a])}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {rol === 'admin' ? (
          <p className="notice">
            {t('El Admin de plataforma gestiona usuarios, roles y configuración técnica, pero no puede aprobar ni ejecutar pagos.')}</p>
        ) : null}
        {error ? (
          <p className="form__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary">
          {usuario ? t('Guardar cambios') : t('Crear usuario')}
        </button>
      </form>
    </Modal>
  )
}
