export type Rol = 'cliente' | 'vendedor' | 'centro' | 'artista' | 'admin' | 'coordinacion'

/** Áreas de la Coordinación Central que intervienen en la demo. */
export type AreaCoordinacion = 'administracion' | 'cobros'

export type Centro = {
  id: string
  nombre: string
  barrio: string
  estado: 'habilitado' | 'bloqueado'
  /** Bloqueo decidido por el administrador de la plataforma, además del automático por remesas vencidas. */
  bloqueoManual?: boolean
}

export type Artista = {
  id: string
  nombre: string
}

export type Evento = {
  id: string
  titulo: string
  categoria: string
  centroId: string
  artistaId: string
  /** Fecha y hora local, formato ISO sin zona (YYYY-MM-DDTHH:mm). */
  fecha: string
  /** Precio por entrada, en pesos. */
  precio: number
  cupo: number
  /** Destacado en la portada por decisión de la Asamblea. */
  destacado: boolean
  /** Reparto del resto (lo que queda tras la comisión de Urbana) entre centro y artista, por contrato. */
  resto: { centro: number; artista: number }
  descripcion: string
  /** Evento dado de baja: sale de la cartelera y se bloquea su venta. */
  baja?: boolean
}

export type Usuario = {
  id: string
  nombre: string
  email: string
  rol: Rol
  centroId?: string
  artistaId?: string
  area?: AreaCoordinacion
  /** Un usuario deshabilitado no puede ingresar, pero conserva su historial. */
  activo?: boolean
}

export type Parametros = {
  comisionUrbanaPct: number
  aporteFondoPct: number
  /** Saldo del fondo de contingencia al comenzar la demo, en pesos. */
  fondoInicialPesos: number
  plazoLiquidacionDias: number
  /** Días de gracia para remesar el efectivo de una venta antes de que el centro quede bloqueado. */
  plazoRemesaDias: number
  vencimientoReservaMin: number
  fechaInicialDemo: string
}

export type CanalVenta = 'web' | 'boleteria'
export type MedioPago = 'electronico' | 'efectivo'
export type Beneficiario = 'centro' | 'artista' | 'urbana'
/** Estados de un asiento del libro mayor: retenido hasta el cierre del evento, luego disponible y finalmente pagado. */
export type EstadoAsiento = 'retenido' | 'disponible' | 'pagado'

/** Cupo apartado de forma temporal mientras el comprador paga. */
export type Reserva = {
  id: string
  eventoId: string
  usuarioId: string
  cantidad: number
  /** Instante (ms desde epoch) en que la reserva vence y libera el cupo. */
  venceTs: number
}

export type Venta = {
  id: string
  eventoId: string
  /** Comprador registrado; las ventas de boletería pueden no tenerlo. */
  compradorId: string | null
  vendedorId: string | null
  canal: CanalVenta
  medioPago: MedioPago
  cantidad: number
  /** Importes en centavos para evitar errores de redondeo. */
  totalCentavos: number
  /** Día de la venta (YYYY-MM-DD, según el reloj de la demo). */
  fecha: string
  /** Entradas devueltas (por reclamo aprobado o baja del evento). */
  devueltas?: number
  /** Dinero reembolsado por las devoluciones, en centavos. */
  reembolsadoCentavos?: number
}

export type Entrada = {
  id: string
  ventaId: string
  eventoId: string
  /** Código único que se codifica en el QR. */
  codigo: string
  /** Una entrada devuelta queda anulada y deja de ser válida. */
  anulada?: boolean
}

/** Una línea del libro mayor: la parte de un beneficiario en una venta. */
export type Asiento = {
  id: string
  ventaId: string
  eventoId: string
  beneficiario: Beneficiario
  /** Id del centro o del artista; vacío para Urbana. */
  beneficiarioId: string
  montoCentavos: number
  estado: EstadoAsiento
  fecha: string
  /** Si es una reversión, el asiento que compensa. */
  reversaDe?: string
}

/** Cierre diario de caja de un vendedor: lo que declara contra lo que el sistema registró. */
export type CierreCaja = {
  id: string
  centroId: string
  vendedorId: string
  /** Día cerrado (YYYY-MM-DD). */
  fecha: string
  efectivoRegistradoCentavos: number
  efectivoDeclaradoCentavos: number
  /** Declarado menos registrado: negativo es faltante, positivo es sobrante. */
  diferenciaCentavos: number
  entradasEmitidas: number
}

/** Transferencia de efectivo del centro a Urbana. Las previas al evento son brutas; la final descuenta la parte del centro. */
export type Remesa = {
  id: string
  centroId: string
  eventoId: string
  /** Día en que el centro la generó (YYYY-MM-DD). */
  fecha: string
  tipo: 'bruta' | 'final'
  /** Efectivo de ventas que esta remesa cubre. */
  efectivoCubiertoCentavos: number
  /** Parte del centro que se queda del efectivo (solo en la remesa final). */
  retenidoCentroCentavos: number
  /** Lo que el centro debe transferir. */
  montoCentavos: number
  /** Referencia única para identificar la transferencia. */
  referencia: string
  estado: 'informada' | 'conciliada'
}

export type Aviso = {
  id: string
  /** Día del aviso (YYYY-MM-DD). */
  fecha: string
  para: 'coordinacion' | 'admin' | 'centro'
  /** Solo cuando `para` es 'centro'. */
  centroId?: string
  texto: string
}

/** Registro de auditoría: accesos, cambios de datos e intentos denegados. */
export type Auditoria = {
  id: string
  /** Día del registro (YYYY-MM-DD, según el reloj de la demo). */
  fecha: string
  /** Quién lo hizo; vacío si no había sesión. */
  usuarioId: string
  tipo: 'acceso' | 'cambio' | 'denegado'
  texto: string
}

/** Movimiento del fondo de contingencia: el aporte de Urbana entra y la cobertura a un artista sale. */
export type FondoMovimiento = {
  id: string
  fecha: string
  tipo: 'aporte' | 'cobertura'
  eventoId: string
  /** Positivo si entra al fondo, negativo si sale. */
  montoCentavos: number
  texto: string
}

/** Cómo se liquida un evento: lo que corresponde a cada parte, lo que ya tiene en mano y lo que se paga. */
export type CalculoLiquidacion = {
  totalCentavos: number
  correspondeCentro: number
  correspondeArtista: number
  correspondeUrbana: number
  /** Efectivo del evento que el centro se quedó como parte suya en la última remesa. */
  centroEnMano: number
  /** Fondos que Urbana tiene en mano: cobros electrónicos más remesas conciliadas. */
  urbanaEnMano: number
  /** Lo que Urbana paga al artista con fondos respaldados. */
  pagoArtista: number
  /** Lo que el fondo de contingencia cubre al artista cuando faltan fondos. */
  coberturaFondo: number
  /** Lo que Urbana acredita al centro: su parte menos el efectivo que ya tiene. */
  acreditaCentro: number
  /** Parte del centro que queda pendiente hasta que regularice sus remesas. */
  pendienteCentro: number
  /** Comisión que Urbana se queda, ya descontado el aporte al fondo. */
  retieneUrbana: number
  /** Parte de la comisión que Urbana destina al fondo de contingencia. */
  aporteFondo: number
}

export type Liquidacion = {
  id: string
  eventoId: string
  /** Día en que se aprobó (YYYY-MM-DD). */
  fecha: string
  estado: 'aprobada' | 'ejecutada'
  aprobadaPor: string
  ejecutadaPor?: string
  fechaEjecucion?: string
  calculo: CalculoLiquidacion
}

/** Algo que Soporte de boletería debe revisar: una diferencia de caja, un reclamo, un desvío con la pasarela o una baja con ventas. */
export type Incidencia = {
  id: string
  /** Día en que se abrió (YYYY-MM-DD). */
  fecha: string
  tipo: 'diferencia-caja' | 'reclamo' | 'pasarela' | 'baja-evento'
  estado: 'abierta' | 'resuelta'
  descripcion: string
  centroId?: string
  eventoId?: string
  ventaId?: string
  /** Quien presentó el reclamo. */
  usuarioId?: string
  /** Para un reclamo: cuántas entradas se piden devolver. */
  cantidad?: number
  motivo?: string
  /** Importe en juego, en centavos (con signo para las diferencias de caja). */
  montoCentavos?: number
  resolucion?: string
  resueltaPor?: string
  fechaResolucion?: string
}

/** Conciliación diaria entre el informe de la pasarela de pago y el libro mayor. */
export type ConciliacionDia = {
  fecha: string
  registradoCentavos: number
  informadoCentavos: number
}
