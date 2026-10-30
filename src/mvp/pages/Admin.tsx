import { useState } from 'react'
import { CentroForm } from '../components/CentroForm'
import { UsuarioForm } from '../components/UsuarioForm'
import { centroConRemesaVencida } from '../domain/remesas'
import { formatearDiaCorto } from '../format'
import { etiquetaUsuario } from '../roles'
import { artistas, parametros, useMvp } from '../state'
import type { Auditoria, Centro, Usuario } from '../types'
import { t } from '../../i18n'

type Pestana = 'usuarios' | 'centros' | 'avisos' | 'auditoria' | 'pagos'
type FiltroAuditoria = 'todos' | Auditoria['tipo']

const ETIQUETA_AUDITORIA_PLURAL: Record<Auditoria['tipo'], string> = {
  acceso: 'Accesos',
  cambio: 'Cambios',
  denegado: 'Denegados',
}

const ETIQUETA_AUDITORIA: Record<Auditoria['tipo'], string> = {
  acceso: 'Acceso',
  cambio: 'Cambio',
  denegado: 'Denegado',
}

function UsuariosTab() {
  const { estado, usuario: admin, despachar } = useMvp()
  const [edicion, setEdicion] = useState<{ usuario?: Usuario } | null>(null)
  if (!admin) return null

  function detalle(u: Usuario) {
    if (u.centroId) return estado.centros.find((c) => c.id === u.centroId)?.nombre
    if (u.artistaId) return artistas.find((a) => a.id === u.artistaId)?.nombre
    return ''
  }

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--primary" onClick={() => setEdicion({})}>
          {t('Nuevo usuario')}</button>
        <span className="muted">
          {t('Solo el Admin de plataforma crea usuarios, cambia roles y deshabilita cuentas.')}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Usuario')}</th>
              <th>{t('Rol')}</th>
              <th>{t('Pertenece a')}</th>
              <th>{t('Estado')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {estado.usuarios.map((u) => (
              <tr key={u.id} className={u.activo === false ? 'row--off' : undefined}>
                <td>
                  {u.nombre}
                  <br />
                  <span className="muted">{u.email}</span>
                </td>
                <td>{etiquetaUsuario(u)}</td>
                <td>{detalle(u)}</td>
                <td>
                  <span className={u.activo === false ? 'status' : 'status status--disponible'}>
                    {u.activo === false ? t('Deshabilitado') : t('Activo')}
                  </span>
                </td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setEdicion({ usuario: u })}
                  >
                    {t('Modificar')}</button>
                  {u.id === admin.id ? null : (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        despachar({
                          tipo: 'admin-estado-usuario',
                          adminId: admin.id,
                          usuarioId: u.id,
                          activo: u.activo === false,
                        })
                      }
                    >
                      {u.activo === false ? t('Habilitar') : t('Deshabilitar')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted checkout__hint" style={{ marginTop: '1rem' }}>
        {t('Deshabilitar una cuenta no borra su historial: las ventas y los registros siguen asociados a su nombre.')}</p>
      {edicion ? <UsuarioForm usuario={edicion.usuario} onClose={() => setEdicion(null)} /> : null}
    </>
  )
}

function CentrosTab() {
  const { estado, usuario: admin, despachar } = useMvp()
  const [edicion, setEdicion] = useState<{ centro?: Centro } | null>(null)
  if (!admin) return null

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--primary" onClick={() => setEdicion({})}>
          {t('Nuevo centro')}</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('Espacio')}</th>
              <th>{t('Estado')}</th>
              <th>{t('Motivo')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {estado.centros.map((c) => {
              const vencida = centroConRemesaVencida(
                c,
                estado.eventos,
                estado.ventas,
                estado.remesas,
                estado.hoy,
                parametros.plazoRemesaDias,
              )
              const motivos = [
                vencida ? t('Remesas vencidas') : null,
                c.bloqueoManual ? t('Bloqueo manual') : null,
              ].filter(Boolean)
              return (
                <tr key={c.id}>
                  <td>
                    {c.nombre}
                    <br />
                    <span className="muted">{c.barrio}</span>
                  </td>
                  <td>
                    <span
                      className={
                        c.estado === 'bloqueado'
                          ? 'status status--vencida'
                          : 'status status--disponible'
                      }
                    >
                      {c.estado === 'bloqueado' ? t('Bloqueado') : t('Habilitado')}
                    </span>
                  </td>
                  <td className="muted">
                    {[...motivos, c.soloDifusion ? t('Solo difusión', 'Só divulgação') : null]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                  <td className="actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setEdicion({ centro: c })}
                    >
                      {t('Modificar')}</button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        despachar({
                          tipo: 'admin-bloqueo-centro',
                          adminId: admin.id,
                          centroId: c.id,
                          bloqueado: !c.bloqueoManual,
                        })
                      }
                    >
                      {c.bloqueoManual ? t('Quitar bloqueo manual') : t('Bloquear')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        despachar({
                          tipo: 'admin-difusion-centro',
                          adminId: admin.id,
                          centroId: c.id,
                          soloDifusion: !c.soloDifusion,
                        })
                      }
                    >
                      {c.soloDifusion
                        ? t('Habilitar la venta', 'Habilitar a venda')
                        : t('Pasar a solo difusión', 'Passar para só divulgação')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="muted checkout__hint" style={{ marginTop: '1rem' }}>
        {t('Un centro queda bloqueado automáticamente cuando tiene remesas vencidas, y vuelve a habilitarse al regularizarlas. El bloqueo manual no se levanta solo.')}</p>
      {edicion ? <CentroForm centro={edicion.centro} onClose={() => setEdicion(null)} /> : null}
    </>
  )
}

function AvisosTab() {
  const { estado } = useMvp()
  const avisos = estado.avisos.filter((a) => a.para === 'admin').reverse()
  if (avisos.length === 0) return <p className="muted">{t('No hay avisos por ahora.')}</p>
  return (
    <ul className="avisos avisos--list">
      {avisos.map((a) => (
        <li key={a.id}>
          <span className="muted">{formatearDiaCorto(a.fecha)}</span> {a.texto}
        </li>
      ))}
    </ul>
  )
}

function AuditoriaTab() {
  const { estado } = useMvp()
  const [filtro, setFiltro] = useState<FiltroAuditoria>('todos')
  const registros = estado.auditoria
    .filter((r) => filtro === 'todos' || r.tipo === filtro)
    .slice()
    .reverse()
    .slice(0, 60)

  return (
    <>
      <div className="chips" role="group" aria-label={t('Filtrar el registro')}>
        {(['todos', 'acceso', 'cambio', 'denegado'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={f === filtro ? 'chip is-active' : 'chip'}
            aria-pressed={f === filtro}
            onClick={() => setFiltro(f)}
          >
            {f === 'todos' ? t('Todos') : t(ETIQUETA_AUDITORIA_PLURAL[f])}
          </button>
        ))}
      </div>
      {registros.length === 0 ? (
        <p className="muted" style={{ marginTop: '1rem' }}>
          {t('Todavía no hay registros.')}</p>
      ) : (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('Día')}</th>
                <th>{t('Quién')}</th>
                <th>{t('Tipo')}</th>
                <th>{t('Detalle')}</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td>{formatearDiaCorto(r.fecha)}</td>
                  <td>{estado.usuarios.find((u) => u.id === r.usuarioId)?.nombre ?? '—'}</td>
                  <td>
                    <span className={r.tipo === 'denegado' ? 'status status--vencida' : 'status'}>
                      {t(ETIQUETA_AUDITORIA[r.tipo])}
                    </span>
                  </td>
                  <td>{r.texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function PagosTab() {
  const { usuario: admin, despachar } = useMvp()
  const [mensaje, setMensaje] = useState('')
  if (!admin) return null

  function intentar(operacion: string) {
    despachar({
      tipo: 'acceso-denegado',
      usuarioId: admin!.id,
      detalle: t('Intentó {operacion}: acceso denegado, su rol no permite esta operación.', {
        operacion: t(operacion),
      }),
    })
    setMensaje(
      t(
        'Acceso denegado: su rol no permite esta operación. El intento quedó registrado en la auditoría.',
      ),
    )
  }

  return (
    <div className="caja">
      <section>
        <h2 className="caja__title">{t('Pagos y liquidaciones')}</h2>
        <p className="muted">
          {t('Hay una separación de funciones:')}{" "}<strong>{t('Administración General aprueba')}</strong> {t('los pagos y')}{" "}<strong>{t('Boletería y Cobros los ejecuta')}</strong>{t('. El Admin de plataforma tiene el control técnico, pero ningún permiso sobre el dinero, para que nadie concentre todo el circuito.')}</p>
        <div className="checkout__actions">
          <button type="button" className="btn" onClick={() => intentar('aprobar una liquidación')}>
            {t('Aprobar liquidación')}</button>
          <button type="button" className="btn" onClick={() => intentar('ejecutar un pago')}>
            {t('Ejecutar pago')}</button>
        </div>
        {mensaje ? (
          <p className="notice notice--error" role="alert">
            {mensaje}
          </p>
        ) : null}
      </section>
    </div>
  )
}

export function Admin() {
  const { estado, usuario } = useMvp()
  const [pestana, setPestana] = useState<Pestana>('usuarios')
  if (!usuario) return null

  const activos = estado.usuarios.filter((u) => u.activo !== false).length
  const bloqueados = estado.centros.filter((c) => c.estado === 'bloqueado').length
  const avisos = estado.avisos.filter((a) => a.para === 'admin').length
  const denegados = estado.auditoria.filter((r) => r.tipo === 'denegado').length

  const pestanas: [Pestana, string][] = [
    ['usuarios', t('Usuarios y roles')],
    ['centros', t('Centros')],
    ['avisos', t('Avisos')],
    ['auditoria', t('Auditoría')],
    ['pagos', t('Pagos')],
  ]

  return (
    <div className="page">
      <p className="eyebrow">{t('Admin de plataforma')}</p>
      <h1>{t('Hola,')}{" "}{usuario.nombre.split(' ')[0]}</h1>
      <p className="lead">
        {t('Gestioná usuarios, roles y centros, y seguí los avisos y el registro de lo que pasa en la plataforma. Tenés el control técnico, pero no podés aprobar ni ejecutar pagos.')}</p>

      <dl className="kpis">
        <div>
          <dt>{t('Usuarios activos')}</dt>
          <dd>{activos}</dd>
        </div>
        <div>
          <dt>{t('Centros bloqueados')}</dt>
          <dd className={bloqueados > 0 ? 'kpi--closed' : undefined}>{bloqueados}</dd>
        </div>
        <div>
          <dt>{t('Avisos')}</dt>
          <dd>{avisos}</dd>
        </div>
        <div>
          <dt>{t('Accesos denegados')}</dt>
          <dd>{denegados}</dd>
        </div>
      </dl>

      <div className="tabs" role="tablist" aria-label={t('Secciones del panel')}>
        {pestanas.map(([id, etiqueta]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            className={pestana === id ? 'tab is-active' : 'tab'}
            onClick={() => setPestana(id)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'usuarios' ? <UsuariosTab /> : null}
      {pestana === 'centros' ? <CentrosTab /> : null}
      {pestana === 'avisos' ? <AvisosTab /> : null}
      {pestana === 'auditoria' ? <AuditoriaTab /> : null}
      {pestana === 'pagos' ? <PagosTab /> : null}
    </div>
  )
}
