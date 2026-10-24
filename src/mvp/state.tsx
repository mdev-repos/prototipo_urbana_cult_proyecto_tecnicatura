import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import artistasSeed from './data/artistas.json'
import centrosSeed from './data/centros.json'
import eventosSeed from './data/eventos.json'
import parametrosSeed from './data/parametros.json'
import usuariosSeed from './data/usuarios.json'
import { ventasIniciales } from './domain/semilla'
import { cierreDelDia, totalesDeCaja, ventasDeCaja } from './domain/caja'
import { devolverEntradas } from './domain/devoluciones'
import { calcularLiquidacion, fechaLiquidacion } from './domain/liquidacion'
import { diasConciliables, duplicadoPasarela, registradoDelDia } from './domain/pasarela'
import { centroConRemesaVencida, proponerRemesa, referenciaRemesa } from './domain/remesas'
import { disponibles, entradasNetas, netoVenta, registrarVenta, sumarDias } from './domain/ventas'
import { formatearCentavos, formatearDiaCorto } from './format'
import type {
  Artista,
  Asiento,
  Auditoria,
  Aviso,
  Centro,
  CierreCaja,
  ConciliacionDia,
  FondoMovimiento,
  Incidencia,
  Liquidacion,
  MedioPago,
  Entrada,
  Evento,
  Parametros,
  Remesa,
  Reserva,
  Usuario,
  Venta,
} from './types'

/** Se cambia al modificar la forma del estado guardado; así no se leen datos viejos. */
const VERSION = 7
const STORAGE_KEY = 'uc-mvp-estado'

export const parametros = parametrosSeed as Parametros
const usuariosIniciales = usuariosSeed as Usuario[]
export const artistas = artistasSeed as Artista[]

type Estado = {
  sesion: string | null
  /** Fecha actual de la demo (YYYY-MM-DD); se puede adelantar para ver cómo pasan los días. */
  hoy: string
  centros: Centro[]
  eventos: Evento[]
  reservas: Reserva[]
  ventas: Venta[]
  entradas: Entrada[]
  /** Libro mayor: la parte de cada beneficiario en cada venta. */
  asientos: Asiento[]
  usuarios: Usuario[]
  /** Incidencias que gestiona Soporte de boletería. */
  incidencias: Incidencia[]
  /** Días ya conciliados entre la pasarela y el libro mayor. */
  conciliaciones: ConciliacionDia[]
  /** Liquidaciones finales aprobadas y ejecutadas. */
  liquidaciones: Liquidacion[]
  /** Fondo de contingencia: saldo y movimientos. */
  fondo: { saldoCentavos: number; movimientos: FondoMovimiento[] }
  /** Registro de auditoría de la plataforma. */
  auditoria: Auditoria[]
  /** Remesas de efectivo de los centros a Urbana. */
  remesas: Remesa[]
  /** Avisos de relevancia para Coordinación, la administración de la plataforma y los centros. */
  avisos: Aviso[]
  /** Cierres de caja diarios de los vendedores. */
  cierres: CierreCaja[]
  /** Contador para generar identificadores. */
  seq: number
}

type Accion =
  | { tipo: 'login'; usuarioId: string }
  | { tipo: 'logout' }
  | { tipo: 'avanzar-dia' }
  | { tipo: 'reiniciar' }
  | { tipo: 'reservar'; eventoId: string; usuarioId: string; cantidad: number; ahora: number }
  | { tipo: 'liberar-reserva'; reservaId: string }
  | { tipo: 'vencer-reserva'; reservaId: string; venceTs: number }
  | { tipo: 'pagar-reserva'; reservaId: string; ahora: number }
  | {
      tipo: 'vender-boleteria'
      eventoId: string
      usuarioId: string
      cantidad: number
      medioPago: MedioPago
      ahora: number
    }
  | { tipo: 'cerrar-caja'; usuarioId: string; declaradoCentavos: number }
  | { tipo: 'guardar-evento'; usuarioId: string; evento: DatosEvento }
  | { tipo: 'baja-evento'; usuarioId: string; eventoId: string }
  | { tipo: 'generar-remesa'; usuarioId: string; eventoId: string }
  | { tipo: 'admin-guardar-usuario'; adminId: string; datos: DatosUsuario }
  | { tipo: 'admin-estado-usuario'; adminId: string; usuarioId: string; activo: boolean }
  | { tipo: 'admin-guardar-centro'; adminId: string; datos: DatosCentro }
  | { tipo: 'admin-bloqueo-centro'; adminId: string; centroId: string; bloqueado: boolean }
  | { tipo: 'acceso-denegado'; usuarioId: string; detalle: string }
  | { tipo: 'conciliar-remesa'; usuarioId: string; remesaId: string }
  | {
      tipo: 'reclamar'
      usuarioId: string
      ventaId: string
      cantidad: number
      motivo: string
    }
  | {
      tipo: 'resolver-incidencia'
      usuarioId: string
      incidenciaId: string
      /** Solo para reclamos: si se aprueba la devolución. */
      aprobar?: boolean
      resolucion: string
    }
  | { tipo: 'conciliar-dias'; usuarioId: string; fechas: string[] }
  | { tipo: 'aprobar-liquidacion'; usuarioId: string; eventoId: string }
  | { tipo: 'ejecutar-liquidacion'; usuarioId: string; eventoId: string }

/** Campos de un evento que carga el admin del centro; sin `id` es un evento nuevo. */
export type DatosEvento = Pick<
  Evento,
  'titulo' | 'categoria' | 'artistaId' | 'fecha' | 'precio' | 'cupo' | 'descripcion' | 'resto'
> & { id?: string }

/** Campos de un usuario que carga el administrador; sin `id` es un usuario nuevo. */
export type DatosUsuario = Pick<
  Usuario,
  'nombre' | 'email' | 'rol' | 'centroId' | 'artistaId' | 'area'
> & { id?: string }

export type DatosCentro = { id?: string; nombre: string; barrio: string }

/** Bloquea o regulariza a cada centro según tenga o no remesas vencidas. */
function aplicarBloqueos(estado: Estado): Estado {
  const avisos: Aviso[] = []
  let seq = estado.seq
  const centros = estado.centros.map((c) => {
    const vencida = centroConRemesaVencida(
      c,
      estado.eventos,
      estado.ventas,
      estado.remesas,
      estado.hoy,
      parametros.plazoRemesaDias,
    )
    const nuevo = vencida || c.bloqueoManual ? 'bloqueado' : 'habilitado'
    if (nuevo === c.estado) return c
    const texto =
      nuevo === 'bloqueado'
        ? `${c.nombre} quedó bloqueado${vencida ? ' por remesas vencidas' : ' por decisión de la administración'}: no puede publicar eventos ni vender en efectivo hasta regularizarse.`
        : `${c.nombre} volvió a estar habilitado.`
    for (const para of ['admin', 'coordinacion', 'centro'] as const) {
      seq += 1
      avisos.push({ id: `n-${seq}`, fecha: estado.hoy, para, centroId: c.id, texto })
    }
    return { ...c, estado: nuevo } as Centro
  })
  return avisos.length === 0
    ? estado
    : { ...estado, seq, centros, avisos: [...estado.avisos, ...avisos] }
}

/** Al llegar la fecha de liquidación, lo retenido de un evento pasa a estar disponible. */
function liberarAsientos(estado: Estado): Estado {
  const vencidos = new Set(
    estado.eventos
      .filter((e) => !e.baja && fechaLiquidacion(e, parametros.plazoLiquidacionDias) <= estado.hoy)
      .map((e) => e.id),
  )
  if (!estado.asientos.some((a) => a.estado === 'retenido' && vencidos.has(a.eventoId))) {
    return estado
  }
  return {
    ...estado,
    asientos: estado.asientos.map((a) =>
      a.estado === 'retenido' && vencidos.has(a.eventoId) ? { ...a, estado: 'disponible' } : a,
    ),
  }
}

function estadoInicial(): Estado {
  const eventos = eventosSeed as Evento[]
  const semilla = ventasIniciales(eventos, parametros.comisionUrbanaPct)
  return {
    sesion: null,
    hoy: parametros.fechaInicialDemo,
    centros: centrosSeed as Centro[],
    eventos,
    reservas: [],
    ventas: semilla.ventas,
    entradas: semilla.entradas,
    asientos: semilla.asientos,
    usuarios: usuariosIniciales.map((u) => ({ ...u, activo: true })),
    incidencias: [],
    conciliaciones: diasConciliables('2026-10-31').map((fecha) => {
      const registrado = registradoDelDia(semilla.ventas, fecha)
      return { fecha, registradoCentavos: registrado, informadoCentavos: registrado }
    }),
    liquidaciones: [],
    fondo: { saldoCentavos: parametros.fondoInicialPesos * 100, movimientos: [] },
    auditoria: [],
    remesas: semilla.remesas,
    avisos: [],
    cierres: [],
    seq: semilla.seq,
  }
}

function reductorBase(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case 'login': {
      const quien = estado.usuarios.find((u) => u.id === accion.usuarioId)
      // Un usuario deshabilitado no puede autenticarse.
      if (!quien || quien.activo === false) return estado
      return { ...estado, sesion: accion.usuarioId }
    }
    case 'logout':
      return { ...estado, sesion: null }
    case 'avanzar-dia':
      return liberarAsientos(aplicarBloqueos({ ...estado, hoy: sumarDias(estado.hoy, 1) }))
    case 'reiniciar':
      return estadoInicial()

    case 'admin-guardar-usuario': {
      const admin = estado.usuarios.find((u) => u.id === accion.adminId)
      if (admin?.rol !== 'admin') return estado
      const d = accion.datos
      const email = d.email.trim().toLowerCase()
      if (!d.nombre.trim() || !email) return estado
      // Un email no puede repetirse entre usuarios.
      if (estado.usuarios.some((u) => u.email.toLowerCase() === email && u.id !== d.id)) {
        return estado
      }
      const previo = d.id ? estado.usuarios.find((u) => u.id === d.id) : undefined
      if (d.id && !previo) return estado
      // El administrador no puede quitarse a sí mismo el rol: se quedaría sin acceso.
      if (previo && previo.id === admin.id && d.rol !== 'admin') return estado
      const necesitaCentro = d.rol === 'centro' || d.rol === 'vendedor'
      if (necesitaCentro && !estado.centros.some((c) => c.id === d.centroId)) return estado
      if (d.rol === 'artista' && !artistas.some((a) => a.id === d.artistaId)) return estado
      if (d.rol === 'coordinacion' && !d.area) return estado

      const campos = {
        nombre: d.nombre.trim(),
        email,
        rol: d.rol,
        centroId: necesitaCentro ? d.centroId : undefined,
        artistaId: d.rol === 'artista' ? d.artistaId : undefined,
        area: d.rol === 'coordinacion' ? d.area : undefined,
      }
      if (previo) {
        return {
          ...estado,
          usuarios: estado.usuarios.map((u) => (u.id === previo.id ? { ...u, ...campos } : u)),
        }
      }
      const seq = estado.seq + 1
      return {
        ...estado,
        seq,
        usuarios: [...estado.usuarios, { id: `u-${seq}`, ...campos, activo: true }],
      }
    }

    case 'admin-estado-usuario': {
      const admin = estado.usuarios.find((u) => u.id === accion.adminId)
      if (admin?.rol !== 'admin' || accion.usuarioId === admin.id) return estado
      return {
        ...estado,
        usuarios: estado.usuarios.map((u) =>
          u.id === accion.usuarioId ? { ...u, activo: accion.activo } : u,
        ),
      }
    }

    case 'admin-guardar-centro': {
      const admin = estado.usuarios.find((u) => u.id === accion.adminId)
      if (admin?.rol !== 'admin') return estado
      const d = accion.datos
      if (!d.nombre.trim() || !d.barrio.trim()) return estado
      if (d.id) {
        if (!estado.centros.some((c) => c.id === d.id)) return estado
        return {
          ...estado,
          centros: estado.centros.map((c) =>
            c.id === d.id ? { ...c, nombre: d.nombre.trim(), barrio: d.barrio.trim() } : c,
          ),
        }
      }
      const seq = estado.seq + 1
      const nuevo: Centro = {
        id: `c-${seq}`,
        nombre: d.nombre.trim(),
        barrio: d.barrio.trim(),
        estado: 'habilitado',
      }
      return { ...estado, seq, centros: [...estado.centros, nuevo] }
    }

    case 'admin-bloqueo-centro': {
      const admin = estado.usuarios.find((u) => u.id === accion.adminId)
      if (admin?.rol !== 'admin') return estado
      if (!estado.centros.some((c) => c.id === accion.centroId)) return estado
      return aplicarBloqueos({
        ...estado,
        centros: estado.centros.map((c) =>
          c.id === accion.centroId ? { ...c, bloqueoManual: accion.bloqueado } : c,
        ),
      })
    }

    case 'acceso-denegado':
      return estado

    case 'conciliar-remesa': {
      const quien = estado.usuarios.find((u) => u.id === accion.usuarioId)
      // La conciliación de remesas la hace Boletería y Cobros.
      if (quien?.rol !== 'coordinacion' || quien.area !== 'cobros') return estado
      const remesa = estado.remesas.find((r) => r.id === accion.remesaId)
      if (!remesa || remesa.estado !== 'informada') return estado
      const seq = estado.seq + 1
      const centro = estado.centros.find((c) => c.id === remesa.centroId)
      return {
        ...estado,
        seq,
        remesas: estado.remesas.map((r) =>
          r.id === remesa.id ? { ...r, estado: 'conciliada' } : r,
        ),
        avisos: [
          ...estado.avisos,
          {
            id: `n-${seq}`,
            fecha: estado.hoy,
            para: 'centro',
            centroId: remesa.centroId,
            texto: `La remesa ${remesa.referencia} de ${centro?.nombre} fue conciliada y acreditada en el libro mayor.`,
          },
        ],
      }
    }

    case 'reclamar': {
      const cliente = estado.usuarios.find((u) => u.id === accion.usuarioId)
      const venta = estado.ventas.find((v) => v.id === accion.ventaId)
      if (cliente?.rol !== 'cliente' || !venta || venta.compradorId !== cliente.id) return estado
      const evento = estado.eventos.find((e) => e.id === venta.eventoId)
      if (!evento) return estado
      // Una vez liquidado el evento, el dinero ya se pagó: no se puede reclamar.
      if (estado.liquidaciones.some((l) => l.eventoId === evento.id)) return estado
      if (accion.cantidad < 1 || accion.cantidad > entradasNetas(venta)) return estado
      const abierto = estado.incidencias.some(
        (i) => i.tipo === 'reclamo' && i.ventaId === venta.id && i.estado === 'abierta',
      )
      if (abierto) return estado
      const seq = estado.seq + 1
      return {
        ...estado,
        seq,
        incidencias: [
          ...estado.incidencias,
          {
            id: `i-${seq}`,
            fecha: estado.hoy,
            tipo: 'reclamo',
            estado: 'abierta',
            descripcion: `${cliente.nombre} pide devolver ${accion.cantidad} ${accion.cantidad === 1 ? 'entrada' : 'entradas'} de “${evento.titulo}”.`,
            centroId: evento.centroId,
            eventoId: evento.id,
            ventaId: venta.id,
            usuarioId: cliente.id,
            cantidad: accion.cantidad,
            motivo: accion.motivo,
            montoCentavos: evento.precio * accion.cantidad * 100,
          },
        ],
      }
    }

    case 'resolver-incidencia': {
      const quien = estado.usuarios.find((u) => u.id === accion.usuarioId)
      // Las incidencias las gestiona Soporte de boletería, dentro de Boletería y Cobros.
      if (quien?.rol !== 'coordinacion' || quien.area !== 'cobros') return estado
      const inc = estado.incidencias.find((i) => i.id === accion.incidenciaId)
      if (!inc || inc.estado !== 'abierta') return estado

      let seq = estado.seq
      let ventas = estado.ventas
      let entradas = estado.entradas
      let asientos = estado.asientos
      let resolucion = accion.resolucion

      const devolver = (ventaId: string, cantidad: number) => {
        const venta = ventas.find((v) => v.id === ventaId)
        const evento = estado.eventos.find((e) => e.id === venta?.eventoId)
        if (!venta || !evento || cantidad < 1) return 0
        const r = devolverEntradas({
          seq,
          venta,
          evento,
          entradas,
          asientos,
          cantidad,
          comisionPct: parametros.comisionUrbanaPct,
          fecha: estado.hoy,
        })
        seq = r.seq
        ventas = ventas.map((v) => (v.id === venta.id ? r.venta : v))
        entradas = r.entradas
        asientos = [...asientos, ...r.reversiones]
        return r.reembolsoCentavos
      }

      if (inc.tipo === 'reclamo' && accion.aprobar) {
        const venta = ventas.find((v) => v.id === inc.ventaId)
        const cantidad = Math.min(inc.cantidad ?? 0, venta ? entradasNetas(venta) : 0)
        const monto = inc.ventaId ? devolver(inc.ventaId, cantidad) : 0
        resolucion = `Devolución aprobada: se reembolsaron ${formatearCentavos(monto)}. ${accion.resolucion}`
      } else if (inc.tipo === 'reclamo') {
        resolucion = `Reclamo rechazado. ${accion.resolucion}`
      } else if (inc.tipo === 'baja-evento') {
        let monto = 0
        let cantidadVentas = 0
        for (const v of estado.ventas.filter((x) => x.eventoId === inc.eventoId)) {
          const vigentes = entradasNetas(v)
          if (vigentes > 0) {
            monto += devolver(v.id, vigentes)
            cantidadVentas += 1
          }
        }
        resolucion = `Se revirtieron ${cantidadVentas} ventas por ${formatearCentavos(monto)}. ${accion.resolucion}`
      }

      return {
        ...estado,
        seq,
        ventas,
        entradas,
        asientos,
        incidencias: estado.incidencias.map((i) =>
          i.id === inc.id
            ? {
                ...i,
                estado: 'resuelta',
                resolucion,
                resueltaPor: quien.id,
                fechaResolucion: estado.hoy,
              }
            : i,
        ),
      }
    }

    case 'conciliar-dias': {
      const quien = estado.usuarios.find((u) => u.id === accion.usuarioId)
      if (quien?.rol !== 'coordinacion' || quien.area !== 'cobros') return estado
      const hechas = new Set(estado.conciliaciones.map((c) => c.fecha))
      const fechas = accion.fechas.filter((f) => f <= estado.hoy && !hechas.has(f)).sort()
      if (fechas.length === 0) return estado
      let seq = estado.seq
      const incidencias = [...estado.incidencias]
      const conciliaciones = [...estado.conciliaciones]
      for (const fecha of fechas) {
        const registrado = registradoDelDia(estado.ventas, fecha)
        const duplicada = duplicadoPasarela(estado.ventas, fecha)
        const informado = registrado + (duplicada ? duplicada.totalCentavos : 0)
        conciliaciones.push({ fecha, registradoCentavos: registrado, informadoCentavos: informado })
        if (duplicada) {
          seq += 1
          incidencias.push({
            id: `i-${seq}`,
            fecha: estado.hoy,
            tipo: 'pasarela',
            estado: 'abierta',
            descripcion: `En la conciliación del ${formatearDiaCorto(fecha)}, el informe de la pasarela trae ${formatearCentavos(duplicada.totalCentavos)} de más: confirmó dos veces el cobro de la venta ${duplicada.id}. El libro mayor la asentó una sola vez.`,
            ventaId: duplicada.id,
            eventoId: duplicada.eventoId,
            montoCentavos: duplicada.totalCentavos,
          })
        }
      }
      return { ...estado, seq, conciliaciones, incidencias }
    }

    case 'aprobar-liquidacion': {
      const quien = estado.usuarios.find((u) => u.id === accion.usuarioId)
      // La liquidación la aprueba Administración General.
      if (quien?.rol !== 'coordinacion' || quien.area !== 'administracion') return estado
      const evento = estado.eventos.find((e) => e.id === accion.eventoId)
      if (!evento || evento.baja) return estado
      if (fechaLiquidacion(evento, parametros.plazoLiquidacionDias) > estado.hoy) return estado
      if (estado.liquidaciones.some((l) => l.eventoId === evento.id)) return estado
      const calculo = calcularLiquidacion({
        evento,
        ventas: estado.ventas,
        asientos: estado.asientos,
        remesas: estado.remesas,
        aporteFondoPct: parametros.aporteFondoPct,
        saldoFondoCentavos: estado.fondo.saldoCentavos,
      })
      if (calculo.totalCentavos === 0) return estado
      const seq = estado.seq + 1
      return {
        ...estado,
        seq,
        liquidaciones: [
          ...estado.liquidaciones,
          {
            id: `l-${seq}`,
            eventoId: evento.id,
            fecha: estado.hoy,
            estado: 'aprobada',
            aprobadaPor: quien.id,
            calculo,
          },
        ],
      }
    }

    case 'ejecutar-liquidacion': {
      const quien = estado.usuarios.find((u) => u.id === accion.usuarioId)
      // La liquidación la ejecuta Boletería y Cobros, y nunca quien la aprobó.
      if (quien?.rol !== 'coordinacion' || quien.area !== 'cobros') return estado
      const liq = estado.liquidaciones.find((l) => l.eventoId === accion.eventoId)
      if (!liq || liq.estado !== 'aprobada' || liq.aprobadaPor === quien.id) return estado
      const evento = estado.eventos.find((e) => e.id === liq.eventoId)
      const c = liq.calculo
      let seq = estado.seq
      const movimientos: FondoMovimiento[] = []
      if (c.aporteFondo > 0) {
        seq += 1
        movimientos.push({
          id: `f-${seq}`,
          fecha: estado.hoy,
          tipo: 'aporte',
          eventoId: liq.eventoId,
          montoCentavos: c.aporteFondo,
          texto: `Aporte de Urbana por “${evento?.titulo}”.`,
        })
      }
      if (c.coberturaFondo > 0) {
        seq += 1
        movimientos.push({
          id: `f-${seq}`,
          fecha: estado.hoy,
          tipo: 'cobertura',
          eventoId: liq.eventoId,
          montoCentavos: -c.coberturaFondo,
          texto: `Cobertura al artista de “${evento?.titulo}” por remesas pendientes del centro.`,
        })
      }
      const avisos = [...estado.avisos]
      if (c.coberturaFondo > 0) {
        const centro = estado.centros.find((x) => x.id === evento?.centroId)
        const texto = `Se cubrió al artista de “${evento?.titulo}” con el fondo de contingencia. ${centro?.nombre} debe recuperar ese monto regularizando sus remesas.`
        for (const para of ['admin', 'coordinacion', 'centro'] as const) {
          seq += 1
          avisos.push({
            id: `n-${seq}`,
            fecha: estado.hoy,
            para,
            centroId: evento?.centroId,
            texto,
          })
        }
      }
      return {
        ...estado,
        seq,
        fondo: {
          saldoCentavos: estado.fondo.saldoCentavos + c.aporteFondo - c.coberturaFondo,
          movimientos: [...estado.fondo.movimientos, ...movimientos],
        },
        asientos: estado.asientos.map((a) =>
          a.eventoId !== liq.eventoId
            ? a
            : a.beneficiario === 'centro' && c.pendienteCentro > 0
              ? { ...a, estado: 'disponible' }
              : { ...a, estado: 'pagado' },
        ),
        liquidaciones: estado.liquidaciones.map((l) =>
          l.id === liq.id
            ? { ...l, estado: 'ejecutada', ejecutadaPor: quien.id, fechaEjecucion: estado.hoy }
            : l,
        ),
        avisos,
      }
    }

    case 'reservar': {
      const evento = estado.eventos.find((e) => e.id === accion.eventoId)
      if (!evento || evento.baja) return estado
      // Una persona tiene una sola reserva por evento: la nueva reemplaza a la anterior.
      const anterior = estado.reservas.find(
        (r) => r.eventoId === evento.id && r.usuarioId === accion.usuarioId,
      )
      const libres = disponibles(evento, estado.ventas, estado.reservas, accion.ahora, anterior?.id)
      if (accion.cantidad < 1 || accion.cantidad > libres) return estado
      const seq = estado.seq + 1
      const reserva: Reserva = {
        id: `r-${seq}`,
        eventoId: evento.id,
        usuarioId: accion.usuarioId,
        cantidad: accion.cantidad,
        venceTs: accion.ahora + parametros.vencimientoReservaMin * 60_000,
      }
      return {
        ...estado,
        seq,
        reservas: [...estado.reservas.filter((r) => r.id !== anterior?.id), reserva],
      }
    }

    case 'liberar-reserva':
      return { ...estado, reservas: estado.reservas.filter((r) => r.id !== accion.reservaId) }

    case 'vencer-reserva':
      return {
        ...estado,
        reservas: estado.reservas.map((r) =>
          r.id === accion.reservaId ? { ...r, venceTs: accion.venceTs } : r,
        ),
      }

    case 'vender-boleteria': {
      const evento = estado.eventos.find((e) => e.id === accion.eventoId)
      const vendedor = estado.usuarios.find((u) => u.id === accion.usuarioId)
      if (
        !evento ||
        evento.baja ||
        vendedor?.rol !== 'vendedor' ||
        vendedor.centroId !== evento.centroId
      ) {
        return estado
      }
      // Un centro bloqueado por no remesar pierde la venta en efectivo.
      const centro = estado.centros.find((c) => c.id === evento.centroId)
      if (centro?.estado === 'bloqueado' && accion.medioPago === 'efectivo') return estado
      if (cierreDelDia(estado.cierres, vendedor.id, estado.hoy)) return estado
      const libres = disponibles(evento, estado.ventas, estado.reservas, accion.ahora)
      if (accion.cantidad < 1 || accion.cantidad > libres) return estado
      const r = registrarVenta({
        seq: estado.seq,
        evento,
        comisionPct: parametros.comisionUrbanaPct,
        compradorId: null,
        vendedorId: vendedor.id,
        canal: 'boleteria',
        medioPago: accion.medioPago,
        cantidad: accion.cantidad,
        fecha: estado.hoy,
      })
      return {
        ...estado,
        seq: r.seq,
        ventas: [...estado.ventas, r.venta],
        entradas: [...estado.entradas, ...r.entradas],
        asientos: [...estado.asientos, ...r.asientos],
      }
    }

    case 'cerrar-caja': {
      const vendedor = estado.usuarios.find((u) => u.id === accion.usuarioId)
      if (vendedor?.rol !== 'vendedor' || !vendedor.centroId) return estado
      if (cierreDelDia(estado.cierres, vendedor.id, estado.hoy)) return estado
      const totales = totalesDeCaja(ventasDeCaja(estado.ventas, vendedor.id, estado.hoy))
      const seq = estado.seq + 1
      const cierre: CierreCaja = {
        id: `k-${seq}`,
        centroId: vendedor.centroId,
        vendedorId: vendedor.id,
        fecha: estado.hoy,
        efectivoRegistradoCentavos: totales.efectivo,
        efectivoDeclaradoCentavos: accion.declaradoCentavos,
        diferenciaCentavos: accion.declaradoCentavos - totales.efectivo,
        entradasEmitidas: totales.entradas,
      }
      const dif = cierre.diferenciaCentavos
      const centroNombre = estado.centros.find((c) => c.id === vendedor.centroId)?.nombre
      const incidencias: Incidencia[] =
        dif === 0
          ? estado.incidencias
          : [
              ...estado.incidencias,
              {
                id: `i-${seq + 1}`,
                fecha: estado.hoy,
                tipo: 'diferencia-caja',
                estado: 'abierta',
                descripcion: `${vendedor.nombre} cerró la caja de ${centroNombre} con ${dif < 0 ? 'un faltante' : 'un sobrante'} de ${formatearCentavos(Math.abs(dif))} (declaró ${formatearCentavos(cierre.efectivoDeclaradoCentavos)}, el sistema registró ${formatearCentavos(cierre.efectivoRegistradoCentavos)}).`,
                centroId: vendedor.centroId,
                usuarioId: vendedor.id,
                montoCentavos: dif,
              },
            ]
      return {
        ...estado,
        seq: dif === 0 ? seq : seq + 1,
        cierres: [...estado.cierres, cierre],
        incidencias,
      }
    }

    case 'guardar-evento': {
      const admin = estado.usuarios.find((u) => u.id === accion.usuarioId)
      if (admin?.rol !== 'centro' || !admin.centroId) return estado
      const centro = estado.centros.find((c) => c.id === admin.centroId)
      // Un centro bloqueado no puede publicar eventos.
      if (!centro || centro.estado === 'bloqueado') return estado
      const d = accion.evento
      const previo = d.id ? estado.eventos.find((e) => e.id === d.id) : undefined
      if (d.id && (!previo || previo.centroId !== centro.id)) return estado
      const vendidas = previo
        ? estado.ventas
            .filter((v) => v.eventoId === previo.id)
            .reduce((s, v) => s + entradasNetas(v), 0)
        : 0
      if (d.fecha.slice(0, 10) < estado.hoy || d.cupo < Math.max(1, vendidas) || d.precio < 1) {
        return estado
      }
      // No puede haber dos eventos del centro en el mismo horario.
      const choque = estado.eventos.some(
        (e) => e.centroId === centro.id && !e.baja && e.id !== d.id && e.fecha === d.fecha,
      )
      if (choque) return estado

      if (previo) {
        const cambiaFecha = previo.fecha !== d.fecha
        // Con ventas ya asentadas, el reparto pactado no se puede cambiar.
        const resto = vendidas > 0 ? previo.resto : d.resto
        const actualizado: Evento = { ...previo, ...d, id: previo.id, resto }
        const base = {
          ...estado,
          eventos: estado.eventos.map((e) => (e.id === previo.id ? actualizado : e)),
        }
        if (cambiaFecha && vendidas > 0) {
          const seq = estado.seq + 1
          return {
            ...base,
            seq,
            avisos: [
              ...estado.avisos,
              {
                id: `n-${seq}`,
                fecha: estado.hoy,
                para: 'coordinacion',
                texto: `${centro.nombre} cambió la fecha de “${actualizado.titulo}”, que ya tiene ${vendidas} entradas vendidas.`,
              },
            ],
          }
        }
        return base
      }

      const seq = estado.seq + 1
      const nuevo: Evento = { ...d, id: `e-${seq}`, centroId: centro.id, destacado: false }
      return { ...estado, seq, eventos: [...estado.eventos, nuevo] }
    }

    case 'baja-evento': {
      const admin = estado.usuarios.find((u) => u.id === accion.usuarioId)
      const evento = estado.eventos.find((e) => e.id === accion.eventoId)
      if (admin?.rol !== 'centro' || !evento || evento.centroId !== admin.centroId) return estado
      if (evento.baja) return estado
      const vendidas = estado.ventas
        .filter((v) => v.eventoId === evento.id)
        .reduce((s, v) => s + entradasNetas(v), 0)
      const base = {
        ...estado,
        eventos: estado.eventos.map((e) => (e.id === evento.id ? { ...e, baja: true } : e)),
      }
      if (vendidas === 0) return base
      const seq = estado.seq + 1
      const centro = estado.centros.find((c) => c.id === evento.centroId)
      const monto = estado.ventas
        .filter((v) => v.eventoId === evento.id)
        .reduce((s, v) => s + netoVenta(v), 0)
      const texto = `${centro?.nombre} dio de baja “${evento.titulo}” con ${vendidas} entradas vendidas: hay que revertir los cobros.`
      return {
        ...base,
        seq: seq + 1,
        avisos: [
          ...estado.avisos,
          { id: `n-${seq}`, fecha: estado.hoy, para: 'coordinacion', texto },
        ],
        incidencias: [
          ...estado.incidencias,
          {
            id: `i-${seq + 1}`,
            fecha: estado.hoy,
            tipo: 'baja-evento',
            estado: 'abierta',
            descripcion: texto,
            centroId: evento.centroId,
            eventoId: evento.id,
            montoCentavos: monto,
          },
        ],
      }
    }

    case 'generar-remesa': {
      const admin = estado.usuarios.find((u) => u.id === accion.usuarioId)
      const evento = estado.eventos.find((e) => e.id === accion.eventoId)
      if (admin?.rol !== 'centro' || !evento || evento.centroId !== admin.centroId) return estado
      const propuesta = proponerRemesa(
        evento,
        estado.ventas,
        estado.remesas,
        estado.asientos,
        estado.hoy,
        parametros.plazoRemesaDias,
      )
      if (!propuesta) return estado
      const seq = estado.seq + 1
      const remesa: Remesa = {
        id: `m-${seq}`,
        centroId: evento.centroId,
        eventoId: evento.id,
        fecha: estado.hoy,
        ...propuesta,
        referencia: referenciaRemesa(estado.remesas.length + 1),
        // Si no hay nada que transferir, no queda nada por conciliar.
        estado: propuesta.montoCentavos === 0 ? 'conciliada' : 'informada',
      }
      return aplicarBloqueos({ ...estado, seq, remesas: [...estado.remesas, remesa] })
    }

    case 'pagar-reserva': {
      const reserva = estado.reservas.find((r) => r.id === accion.reservaId)
      const evento = estado.eventos.find((e) => e.id === reserva?.eventoId)
      const resto = estado.reservas.filter((r) => r.id !== accion.reservaId)
      // Si la reserva ya venció no se vende: el cupo vuelve a quedar libre.
      if (!reserva || !evento || reserva.venceTs <= accion.ahora) {
        return { ...estado, reservas: resto }
      }
      const r = registrarVenta({
        seq: estado.seq,
        evento,
        comisionPct: parametros.comisionUrbanaPct,
        compradorId: reserva.usuarioId,
        vendedorId: null,
        canal: 'web',
        medioPago: 'electronico',
        cantidad: reserva.cantidad,
        fecha: estado.hoy,
      })
      return {
        ...estado,
        seq: r.seq,
        reservas: resto,
        ventas: [...estado.ventas, r.venta],
        entradas: [...estado.entradas, ...r.entradas],
        asientos: [...estado.asientos, ...r.asientos],
      }
    }
  }
}

/** Descripción para la auditoría de las acciones que cambian datos; null si no se registra. */
function describir(antes: Estado, despues: Estado, accion: Accion): Auditoria['texto'] | null {
  switch (accion.tipo) {
    case 'login':
      return 'Inició sesión.'
    case 'guardar-evento':
      return `${accion.evento.id ? 'Modificó' : 'Publicó'} el evento “${accion.evento.titulo}”.`
    case 'baja-evento':
      return `Dio de baja el evento “${antes.eventos.find((e) => e.id === accion.eventoId)?.titulo}”.`
    case 'generar-remesa':
      return `Generó la remesa ${despues.remesas[despues.remesas.length - 1]?.referencia}.`
    case 'cerrar-caja':
      return 'Cerró la caja del día.'
    case 'admin-guardar-usuario':
      return `${accion.datos.id ? 'Modificó' : 'Creó'} el usuario ${accion.datos.nombre.trim()} (${accion.datos.rol}).`
    case 'admin-estado-usuario':
      return `${accion.activo ? 'Habilitó' : 'Deshabilitó'} al usuario ${antes.usuarios.find((u) => u.id === accion.usuarioId)?.nombre}.`
    case 'admin-guardar-centro':
      return `${accion.datos.id ? 'Modificó' : 'Dio de alta'} el centro ${accion.datos.nombre.trim()}.`
    case 'admin-bloqueo-centro':
      return `${accion.bloqueado ? 'Bloqueó' : 'Desbloqueó'} manualmente a ${antes.centros.find((c) => c.id === accion.centroId)?.nombre}.`
    case 'acceso-denegado':
      return accion.detalle
    case 'reclamar':
      return 'Presentó un reclamo por una compra.'
    case 'resolver-incidencia':
      return `Resolvió una incidencia (${antes.incidencias.find((i) => i.id === accion.incidenciaId)?.tipo}).`
    case 'conciliar-dias':
      return `Concilió con la pasarela ${accion.fechas.length === 1 ? 'el día' : 'los días'} ${accion.fechas.join(', ')}.`
    case 'conciliar-remesa':
      return `Concilió la remesa ${antes.remesas.find((r) => r.id === accion.remesaId)?.referencia}.`
    case 'aprobar-liquidacion':
      return `Aprobó la liquidación de “${antes.eventos.find((e) => e.id === accion.eventoId)?.titulo}”.`
    case 'ejecutar-liquidacion':
      return `Ejecutó los pagos de “${antes.eventos.find((e) => e.id === accion.eventoId)?.titulo}”.`
    default:
      return null
  }
}

function actorDe(antes: Estado, accion: Accion): string {
  if ('adminId' in accion) return accion.adminId
  if (accion.tipo === 'login' || accion.tipo === 'acceso-denegado' || 'usuarioId' in accion) {
    return (accion as { usuarioId: string }).usuarioId
  }
  return antes.sesion ?? ''
}

/** Registra en la auditoría los accesos, los cambios de datos y los intentos denegados. */
function reductor(estado: Estado, accion: Accion): Estado {
  const nuevo = reductorBase(estado, accion)
  if (accion.tipo === 'reiniciar') return nuevo
  const esLogout = accion.tipo === 'logout' && estado.sesion !== null
  const cambio = nuevo !== estado || accion.tipo === 'acceso-denegado' || esLogout
  if (!cambio) return nuevo
  const texto = esLogout ? 'Cerró sesión.' : describir(estado, nuevo, accion)
  if (!texto) return nuevo
  const seq = nuevo.seq + 1
  const tipo: Auditoria['tipo'] =
    accion.tipo === 'acceso-denegado'
      ? 'denegado'
      : accion.tipo === 'login' || esLogout
        ? 'acceso'
        : 'cambio'
  const entrada: Auditoria = {
    id: `x-${seq}`,
    fecha: nuevo.hoy,
    usuarioId: esLogout ? (estado.sesion ?? '') : actorDe(estado, accion),
    tipo,
    texto,
  }
  return { ...nuevo, seq, auditoria: [...nuevo.auditoria, entrada] }
}

function leerGuardado(): Estado {
  try {
    const crudo = localStorage.getItem(STORAGE_KEY)
    if (crudo) {
      const guardado = JSON.parse(crudo) as { version: number; estado: Estado }
      if (guardado.version === VERSION) return guardado.estado
    }
  } catch {
    // sin acceso o datos corruptos: se arranca de cero
  }
  return estadoInicial()
}

type Contexto = {
  estado: Estado
  despachar: Dispatch<Accion>
  usuario: Usuario | null
}

const MvpContext = createContext<Contexto | null>(null)

export function MvpProvider({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reductor, undefined, leerGuardado)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, estado }))
    } catch {
      // idem
    }
  }, [estado])

  const valor = useMemo<Contexto>(
    () => ({
      estado,
      despachar,
      usuario: estado.usuarios.find((u) => u.id === estado.sesion) ?? null,
    }),
    [estado],
  )

  return <MvpContext.Provider value={valor}>{children}</MvpContext.Provider>
}

export function useMvp(): Contexto {
  const ctx = useContext(MvpContext)
  if (!ctx) throw new Error('useMvp debe usarse dentro de <MvpProvider>')
  return ctx
}
