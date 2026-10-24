import type { Rol, Usuario } from './types'

type MetaRol = {
  etiqueta: string
  ruta: string
  resumen: string
}

export const metaRol: Record<Rol, MetaRol> = {
  cliente: {
    etiqueta: 'Cliente final',
    ruta: '/mvp/cliente',
    resumen: 'Ve la cartelera, compra entradas y consulta las suyas.',
  },
  vendedor: {
    etiqueta: 'Vendedor del centro',
    ruta: '/mvp/vendedor',
    resumen: 'Vende entradas de los eventos de su centro, incluso en efectivo.',
  },
  centro: {
    etiqueta: 'Admin del centro',
    ruta: '/mvp/centro',
    resumen: 'Carga y modifica los eventos de su centro, remesas y estado de cuenta.',
  },
  artista: {
    etiqueta: 'Artista',
    ruta: '/mvp/artista',
    resumen: 'Consulta sus eventos, ventas y estado de cuenta, sin modificar.',
  },
  admin: {
    etiqueta: 'Admin de plataforma',
    ruta: '/mvp/admin',
    resumen: 'Gestiona usuarios, roles y centros. No aprueba ni ejecuta pagos.',
  },
  coordinacion: {
    etiqueta: 'Coordinación Central',
    ruta: '/mvp/coordinacion',
    resumen: 'Aprueba y ejecuta la liquidación y revisa el libro mayor.',
  },
}

/** Etiqueta completa del usuario: el rol y, para Coordinación, su área. */
export function etiquetaUsuario(usuario: Usuario): string {
  if (usuario.rol === 'coordinacion') {
    return usuario.area === 'administracion'
      ? 'Coordinación · Administración General'
      : 'Coordinación · Boletería y Cobros'
  }
  return metaRol[usuario.rol].etiqueta
}
