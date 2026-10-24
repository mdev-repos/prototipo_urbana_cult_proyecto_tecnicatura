import { useState } from 'react'
import { calcularLiquidacion, fechaLiquidacion } from '../domain/liquidacion'
import { diasConciliables } from '../domain/pasarela'
import { netoVenta } from '../domain/ventas'
import { formatearCentavos, formatearDiaCorto } from '../format'
import { etiquetaUsuario } from '../roles'
import { artistas, parametros, useMvp } from '../state'
import type { CalculoLiquidacion, Evento, Incidencia, Liquidacion } from '../types'

type Pestana = 'liquidacion' | 'incidencias' | 'pasarela' | 'remesas' | 'libro' | 'fondo'

const ESTADO_ASIENTO = ['retenido', 'disponible', 'pagado'] as const

function TablaLiquidacion({ c }: { c: CalculoLiquidacion }) {
  const pagoArtista = c.pagoArtista + c.coberturaFondo
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th />
            <th className="num">Centro</th>
            <th className="num">Artista</th>
            <th className="num">Urbana Cult</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Le corresponde</td>
            <td className="num">{formatearCentavos(c.correspondeCentro)}</td>
            <td className="num">{formatearCentavos(c.correspondeArtista)}</td>
            <td className="num">{formatearCentavos(c.correspondeUrbana)}</td>
          </tr>
          <tr>
            <td>Ya tiene en mano</td>
            <td className="num">{formatearCentavos(c.centroEnMano)}</td>
            <td className="num">—</td>
            <td className="num">{formatearCentavos(c.urbanaEnMano)}</td>
          </tr>
          <tr className="table__total">
            <td>Se liquida en D+{parametros.plazoLiquidacionDias}</td>
            <td className="num">{formatearCentavos(c.acreditaCentro)}</td>
            <td className="num">{formatearCentavos(pagoArtista)}</td>
            <td className="num">{formatearCentavos(c.retieneUrbana)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Liquidaciones() {
  const { estado, usuario, despachar } = useMvp()
  if (!usuario) return null
  const area = usuario.area

  const conVentas = estado.eventos.filter(
    (e) => !e.baja && estado.ventas.some((v) => v.eventoId === e.id),
  )
  const hoy = estado.hoy
  const venceHoy = (e: Evento) => fechaLiquidacion(e, parametros.plazoLiquidacionDias)
  const liquidables = conVentas
    .filter((e) => venceHoy(e) <= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const proximas = conVentas
    .filter((e) => venceHoy(e) > hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  function tarjeta(evento: Evento) {
    const liq: Liquidacion | undefined = estado.liquidaciones.find((l) => l.eventoId === evento.id)
    const calculo =
      liq?.calculo ??
      calcularLiquidacion({
        evento,
        ventas: estado.ventas,
        asientos: estado.asientos,
        remesas: estado.remesas,
        aporteFondoPct: parametros.aporteFondoPct,
        saldoFondoCentavos: estado.fondo.saldoCentavos,
      })
    const centro = estado.centros.find((c) => c.id === evento.centroId)?.nombre
    const quien = (id?: string) => estado.usuarios.find((u) => u.id === id)?.nombre
    const nombreEstado = !liq
      ? 'Pendiente de aprobación'
      : liq.estado === 'aprobada'
        ? 'Aprobada'
        : 'Ejecutada'

    return (
      <section key={evento.id} className="order">
        <header className="order__head">
          <h3>{evento.titulo}</h3>
          <p className="muted">
            {artistas.find((a) => a.id === evento.artistaId)?.nombre} · {centro} · liquida el{' '}
            {formatearDiaCorto(venceHoy(evento))} ·{' '}
            <span
              className={
                liq?.estado === 'ejecutada' ? 'status status--pagado' : 'status status--retenido'
              }
            >
              {nombreEstado}
            </span>
          </p>
        </header>

        <TablaLiquidacion c={calculo} />

        {calculo.aporteFondo > 0 ? (
          <p className="muted checkout__hint">
            De su comisión, Urbana destina {formatearCentavos(calculo.aporteFondo)} al fondo de
            contingencia ({parametros.aporteFondoPct} % de lo recaudado).
          </p>
        ) : null}
        {calculo.coberturaFondo > 0 || calculo.pendienteCentro > 0 ? (
          <p className="notice notice--error">
            <span>
              <strong>El centro tiene efectivo sin remesar</strong>, así que Urbana no tiene en mano
              todo lo que debe pagar. El pago se prorratea: el artista cobra lo respaldado y,
              además, el fondo de contingencia le cubre {formatearCentavos(calculo.coberturaFondo)}{' '}
              (que el centro deberá recuperar). A {centro} le quedan{' '}
              {formatearCentavos(calculo.pendienteCentro)} pendientes hasta que regularice.
            </span>
          </p>
        ) : null}

        {liq ? (
          <p className="muted checkout__hint">
            Aprobada por {quien(liq.aprobadaPor)} el {formatearDiaCorto(liq.fecha)}
            {liq.ejecutadaPor
              ? ` · ejecutada por ${quien(liq.ejecutadaPor)} el ${formatearDiaCorto(liq.fechaEjecucion ?? liq.fecha)}`
              : ''}
            .
          </p>
        ) : null}

        <div className="checkout__actions">
          {!liq ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={area !== 'administracion'}
              title={area !== 'administracion' ? 'La aprueba Administración General' : undefined}
              onClick={() =>
                despachar({
                  tipo: 'aprobar-liquidacion',
                  usuarioId: usuario!.id,
                  eventoId: evento.id,
                })
              }
            >
              Aprobar liquidación
            </button>
          ) : null}
          {liq?.estado === 'aprobada' ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={area !== 'cobros'}
              title={area !== 'cobros' ? 'La ejecuta Boletería y Cobros' : undefined}
              onClick={() =>
                despachar({
                  tipo: 'ejecutar-liquidacion',
                  usuarioId: usuario!.id,
                  eventoId: evento.id,
                })
              }
            >
              Ejecutar pagos
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <div className="caja">
      <p className="muted">
        Urbana es el único agente pagador. Cuando llega la fecha de liquidación,{' '}
        <strong>Administración General aprueba</strong> el cálculo y{' '}
        <strong>Boletería y Cobros ejecuta</strong> los pagos: la misma persona no puede hacer las
        dos cosas. Estás como <strong>{etiquetaUsuario(usuario)}</strong>.
      </p>
      {liquidables.length === 0 ? (
        <p className="notice">
          Todavía no hay eventos para liquidar. Avanzá la fecha de la demo hasta D+
          {parametros.plazoLiquidacionDias} de un evento.
        </p>
      ) : (
        <div className="orders">{liquidables.map(tarjeta)}</div>
      )}
      {proximas.length > 0 ? (
        <section>
          <h2 className="caja__title">Próximas liquidaciones</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Liquida</th>
                  <th className="num">Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {proximas.map((e) => (
                  <tr key={e.id}>
                    <td>{e.titulo}</td>
                    <td>{formatearDiaCorto(venceHoy(e))}</td>
                    <td className="num">
                      {formatearCentavos(
                        estado.ventas
                          .filter((v) => v.eventoId === e.id)
                          .reduce((s, v) => s + netoVenta(v), 0),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}

const ETIQUETA_TIPO: Record<Incidencia['tipo'], string> = {
  'diferencia-caja': 'Diferencia de caja',
  reclamo: 'Reclamo de cliente',
  pasarela: 'Pasarela',
  'baja-evento': 'Baja de evento',
}

const RESOLUCIONES: Record<'diferencia-caja' | 'pasarela', string[]> = {
  'diferencia-caja': [
    'Se justificó la diferencia con el vendedor.',
    'Se descuenta del próximo cierre del centro.',
    'Se registra a favor del centro.',
  ],
  pasarela: [
    'Duplicado de la pasarela: ya estaba asentado una sola vez (idempotencia), sin efecto en el libro mayor.',
    'Se reclama el duplicado a la pasarela.',
  ],
}

function IncidenciaCard({ inc }: { inc: Incidencia }) {
  const { estado, usuario, despachar } = useMvp()
  const [resolucion, setResolucion] = useState('')
  if (!usuario) return null
  const puede = usuario.area === 'cobros'
  const aviso = puede ? undefined : 'Las gestiona Soporte de boletería (Boletería y Cobros)'
  const centro = estado.centros.find((c) => c.id === inc.centroId)?.nombre
  const evento = estado.eventos.find((e) => e.id === inc.eventoId)?.titulo
  const quien = (id?: string) => estado.usuarios.find((u) => u.id === id)?.nombre

  const resolver = (aprobar: boolean | undefined, texto: string) =>
    despachar({
      tipo: 'resolver-incidencia',
      usuarioId: usuario.id,
      incidenciaId: inc.id,
      aprobar,
      resolucion: texto,
    })

  const opciones =
    inc.tipo === 'diferencia-caja' || inc.tipo === 'pasarela' ? RESOLUCIONES[inc.tipo] : []
  const elegida = resolucion || opciones[0]

  return (
    <section className="order">
      <header className="order__head">
        <h3>{ETIQUETA_TIPO[inc.tipo]}</h3>
        <p className="muted">
          {formatearDiaCorto(inc.fecha)}
          {centro ? ` · ${centro}` : ''}
          {evento ? ` · ${evento}` : ''} ·{' '}
          <span
            className={
              inc.estado === 'abierta' ? 'status status--vencida' : 'status status--disponible'
            }
          >
            {inc.estado === 'abierta' ? 'Abierta' : 'Resuelta'}
          </span>
        </p>
      </header>
      <p>{inc.descripcion}</p>
      {inc.motivo ? <p className="muted">Motivo: {inc.motivo}</p> : null}
      {inc.montoCentavos ? (
        <p className="muted">Importe en juego: {formatearCentavos(Math.abs(inc.montoCentavos))}</p>
      ) : null}

      {inc.estado === 'resuelta' ? (
        <p className="notice notice--ok">
          {inc.resolucion}{' '}
          <span className="muted">
            ({quien(inc.resueltaPor)}, {formatearDiaCorto(inc.fechaResolucion ?? inc.fecha)})
          </span>
        </p>
      ) : inc.tipo === 'reclamo' ? (
        <div className="checkout__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={!puede}
            title={aviso}
            onClick={() =>
              resolver(
                true,
                'Reversión prorrateada del reparto: cada parte devuelve lo que había recibido.',
              )
            }
          >
            Aprobar devolución
          </button>
          <button
            type="button"
            className="btn"
            disabled={!puede}
            title={aviso}
            onClick={() => resolver(false, 'No corresponde según el motivo informado.')}
          >
            Rechazar
          </button>
        </div>
      ) : inc.tipo === 'baja-evento' ? (
        <div className="checkout__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={!puede}
            title={aviso}
            onClick={() => resolver(undefined, 'Todas las entradas quedaron anuladas.')}
          >
            Revertir los cobros del evento
          </button>
        </div>
      ) : (
        <div className="form" style={{ maxWidth: '560px' }}>
          <label className="field">
            <span>Resolución</span>
            <select
              value={elegida}
              disabled={!puede}
              onChange={(e) => setResolucion(e.target.value)}
            >
              {opciones.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!puede}
            title={aviso}
            onClick={() => resolver(undefined, elegida)}
          >
            Resolver
          </button>
        </div>
      )}
    </section>
  )
}

function IncidenciasTab() {
  const { estado } = useMvp()
  const [filtro, setFiltro] = useState<'abiertas' | 'resueltas' | 'todas'>('abiertas')
  const lista = estado.incidencias
    .filter(
      (i) =>
        filtro === 'todas' ||
        (filtro === 'abiertas' ? i.estado === 'abierta' : i.estado === 'resuelta'),
    )
    .slice()
    .reverse()

  return (
    <div className="caja">
      <p className="muted">
        Soporte de boletería, dentro de Boletería y Cobros, es el responsable en primera instancia
        de las incidencias de cobro: diferencias de caja, reclamos de clientes, desvíos con la
        pasarela y bajas de eventos con ventas. Las devoluciones se hacen con una reversión
        prorrateada: no se borra ni se modifica ningún asiento.
      </p>
      <div className="chips" role="group" aria-label="Filtrar incidencias">
        {(['abiertas', 'resueltas', 'todas'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={f === filtro ? 'chip is-active' : 'chip'}
            aria-pressed={f === filtro}
            onClick={() => setFiltro(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="muted">No hay incidencias para mostrar.</p>
      ) : (
        <div className="orders">
          {lista.map((i) => (
            <IncidenciaCard key={i.id} inc={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function PasarelaTab() {
  const { estado, usuario, despachar } = useMvp()
  if (!usuario) return null
  const puede = usuario.area === 'cobros'
  const dias = diasConciliables(estado.hoy).reverse()
  const hechas = new Map(estado.conciliaciones.map((c) => [c.fecha, c]))
  const pendientes = dias.filter((d) => !hechas.has(d))

  return (
    <div className="caja">
      <p className="muted">
        Cada día se concilia el informe de la pasarela de pago contra los cobros asentados en el
        libro mayor. Toda diferencia abre una incidencia. Como las confirmaciones de la pasarela son
        idempotentes, un cobro informado dos veces se asienta una sola.
      </p>
      <div className="toolbar">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!puede || pendientes.length === 0}
          title={!puede ? 'La concilia Boletería y Cobros' : undefined}
          onClick={() =>
            despachar({ tipo: 'conciliar-dias', usuarioId: usuario.id, fechas: pendientes })
          }
        >
          Conciliar los {pendientes.length} días pendientes
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Día</th>
              <th className="num">Libro mayor</th>
              <th className="num">Informe pasarela</th>
              <th className="num">Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => {
              const c = hechas.get(d)
              const dif = c ? c.informadoCentavos - c.registradoCentavos : 0
              return (
                <tr key={d}>
                  <td>{formatearDiaCorto(d)}</td>
                  <td className="num">{c ? formatearCentavos(c.registradoCentavos) : '—'}</td>
                  <td className="num">{c ? formatearCentavos(c.informadoCentavos) : '—'}</td>
                  <td className="num">{c ? formatearCentavos(dif) : '—'}</td>
                  <td>
                    {!c ? (
                      <span className="status">Pendiente</span>
                    ) : dif === 0 ? (
                      <span className="status status--disponible">Conciliado</span>
                    ) : (
                      <span className="status status--vencida">Con diferencia</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RemesasTab() {
  const { estado, usuario, despachar } = useMvp()
  if (!usuario) return null
  const remesas = estado.remesas.slice().reverse()
  const puedeConciliar = usuario.area === 'cobros'

  return (
    <div className="caja">
      <p className="muted">
        Cada remesa informada por un centro se concilia contra la transferencia recibida, usando su
        referencia única, y se acredita en el libro mayor. La concilia Boletería y Cobros.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Centro</th>
              <th>Evento</th>
              <th className="num">Monto</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {remesas.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.referencia}</td>
                <td>{estado.centros.find((c) => c.id === r.centroId)?.nombre}</td>
                <td>{estado.eventos.find((e) => e.id === r.eventoId)?.titulo}</td>
                <td className="num">{formatearCentavos(r.montoCentavos)}</td>
                <td>
                  <span
                    className={
                      r.estado === 'conciliada'
                        ? 'status status--disponible'
                        : 'status status--retenido'
                    }
                  >
                    {r.estado === 'conciliada' ? 'Conciliada' : 'Informada'}
                  </span>
                </td>
                <td className="actions">
                  {r.estado === 'informada' ? (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={!puedeConciliar}
                      title={!puedeConciliar ? 'La concilia Boletería y Cobros' : undefined}
                      onClick={() =>
                        despachar({
                          tipo: 'conciliar-remesa',
                          usuarioId: usuario.id,
                          remesaId: r.id,
                        })
                      }
                    >
                      Conciliar
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LibroMayor() {
  const { estado } = useMvp()
  const [eventoId, setEventoId] = useState('todos')

  const asientos = estado.asientos.filter((a) => eventoId === 'todos' || a.eventoId === eventoId)
  const suma = (b: 'centro' | 'artista' | 'urbana', e: (typeof ESTADO_ASIENTO)[number]) =>
    asientos
      .filter((a) => a.beneficiario === b && a.estado === e)
      .reduce((s, a) => s + a.montoCentavos, 0)

  // Partida doble: cada venta asienta exactamente lo que se cobró.
  const ventas = estado.ventas.filter((v) => eventoId === 'todos' || v.eventoId === eventoId)
  const desbalanceadas = ventas.filter(
    (v) =>
      estado.asientos.filter((a) => a.ventaId === v.id).reduce((s, a) => s + a.montoCentavos, 0) !==
      netoVenta(v),
  ).length

  const online = estado.ventas
    .filter((v) => v.medioPago === 'electronico')
    .reduce((s, v) => s + v.totalCentavos, 0)
  // Lo devuelto a compradores que pagaron electrónicamente sale de los fondos de Urbana.
  const devuelto = estado.ventas
    .filter((v) => v.medioPago === 'electronico')
    .reduce((s, v) => s + (v.reembolsadoCentavos ?? 0), 0)
  const remesado = estado.remesas
    .filter((r) => r.estado === 'conciliada')
    .reduce((s, r) => s + r.montoCentavos, 0)
  const pagado = estado.liquidaciones
    .filter((l) => l.estado === 'ejecutada')
    .reduce((s, l) => s + l.calculo.pagoArtista + l.calculo.acreditaCentro, 0)

  return (
    <div className="caja">
      <section>
        <h2 className="caja__title">Fondos en poder de Urbana</h2>
        <p className="muted">
          Cobros electrónicos {formatearCentavos(online)} + remesas conciliadas{' '}
          {formatearCentavos(remesado)} − devoluciones {formatearCentavos(devuelto)} − pagos
          ejecutados {formatearCentavos(pagado)} ={' '}
          <strong>{formatearCentavos(online + remesado - devuelto - pagado)}</strong>
        </p>
      </section>

      <section>
        <label className="field" style={{ maxWidth: '420px' }}>
          <span>Evento</span>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            <option value="todos">Todos los eventos</option>
            {estado.eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo}
              </option>
            ))}
          </select>
        </label>
        <p className={desbalanceadas === 0 ? 'notice notice--ok' : 'notice notice--error'}>
          {desbalanceadas === 0
            ? `Débitos = créditos: las ${ventas.length} ventas balancean con sus asientos.`
            : `${desbalanceadas} ventas no balancean con sus asientos.`}
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Saldo por estado</th>
                {ESTADO_ASIENTO.map((e) => (
                  <th key={e} className="num">
                    {e[0].toUpperCase() + e.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['centro', 'artista', 'urbana'] as const).map((b) => (
                <tr key={b}>
                  <td>
                    {b === 'urbana' ? 'Urbana Cult' : b === 'centro' ? 'Centros' : 'Artistas'}
                  </td>
                  {ESTADO_ASIENTO.map((e) => (
                    <td key={e} className="num">
                      {formatearCentavos(suma(b, e))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="caja__title">Últimos asientos</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Evento</th>
                <th>Beneficiario</th>
                <th className="num">Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {asientos
                .slice(-30)
                .reverse()
                .map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.ventaId}</td>
                    <td>{estado.eventos.find((e) => e.id === a.eventoId)?.titulo}</td>
                    <td>
                      {a.beneficiario === 'urbana'
                        ? 'Urbana Cult'
                        : a.beneficiario === 'centro'
                          ? estado.centros.find((c) => c.id === a.beneficiarioId)?.nombre
                          : artistas.find((x) => x.id === a.beneficiarioId)?.nombre}
                    </td>
                    <td className="num">{formatearCentavos(a.montoCentavos)}</td>
                    <td>
                      <span className={`status status--${a.estado}`}>{a.estado}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Fondo() {
  const { estado } = useMvp()
  const movimientos = estado.fondo.movimientos.slice().reverse()
  return (
    <div className="caja">
      <section>
        <h2 className="caja__title">Saldo del fondo de contingencia</h2>
        <p className="kpi__big">{formatearCentavos(estado.fondo.saldoCentavos)}</p>
        <p className="muted">
          El fondo se alimenta con un aporte de Urbana ({parametros.aporteFondoPct} % de lo
          recaudado en cada evento, tomado de su comisión) y se usa para pagarle al artista cuando
          un centro no remesó. Ese monto lo debe recuperar el centro. El aporte y la regla ante
          incumplimientos los define la Asamblea.
        </p>
      </section>
      <section>
        <h2 className="caja__title">Movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="muted">Todavía no hubo movimientos.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Detalle</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td>{formatearDiaCorto(m.fecha)}</td>
                    <td>{m.texto}</td>
                    <td className="num">{formatearCentavos(m.montoCentavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export function Coordinacion() {
  const { estado, usuario } = useMvp()
  const [pestana, setPestana] = useState<Pestana>('liquidacion')
  if (!usuario) return null

  const pendientes = estado.eventos.filter(
    (e) =>
      !e.baja &&
      estado.ventas.some((v) => v.eventoId === e.id) &&
      fechaLiquidacion(e, parametros.plazoLiquidacionDias) <= estado.hoy &&
      estado.liquidaciones.find((l) => l.eventoId === e.id)?.estado !== 'ejecutada',
  ).length
  const porConciliar = estado.remesas.filter((r) => r.estado === 'informada').length
  const abiertas = estado.incidencias.filter((i) => i.estado === 'abierta').length
  const avisos = estado.avisos
    .filter((a) => a.para === 'coordinacion')
    .slice(-3)
    .reverse()

  const pestanas: [Pestana, string][] = [
    ['liquidacion', 'Liquidación'],
    ['incidencias', 'Incidencias'],
    ['pasarela', 'Pasarela'],
    ['remesas', 'Remesas'],
    ['libro', 'Libro mayor'],
    ['fondo', 'Fondo de contingencia'],
  ]

  return (
    <div className="page">
      <p className="eyebrow">{etiquetaUsuario(usuario)}</p>
      <h1>Hola, {usuario.nombre.split(' ')[0]}</h1>
      <p className="lead">
        Concilia las remesas de los centros, liquida cada evento a D+
        {parametros.plazoLiquidacionDias} y controlá el libro mayor y el fondo de contingencia.
      </p>

      <dl className="kpis">
        <div>
          <dt>Liquidaciones pendientes</dt>
          <dd>{pendientes}</dd>
        </div>
        <div>
          <dt>Remesas por conciliar</dt>
          <dd>{porConciliar}</dd>
        </div>
        <div>
          <dt>Incidencias abiertas</dt>
          <dd className={abiertas > 0 ? 'kpi--closed' : undefined}>{abiertas}</dd>
        </div>
        <div>
          <dt>Fondo de contingencia</dt>
          <dd>{formatearCentavos(estado.fondo.saldoCentavos)}</dd>
        </div>
        <div>
          <dt>Centros bloqueados</dt>
          <dd
            className={
              estado.centros.some((c) => c.estado === 'bloqueado') ? 'kpi--closed' : undefined
            }
          >
            {estado.centros.filter((c) => c.estado === 'bloqueado').length}
          </dd>
        </div>
      </dl>

      {avisos.length > 0 ? (
        <ul className="avisos">
          {avisos.map((a) => (
            <li key={a.id}>
              <span className="muted">{formatearDiaCorto(a.fecha)}</span> {a.texto}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="tabs" role="tablist" aria-label="Secciones del panel">
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

      {pestana === 'liquidacion' ? <Liquidaciones /> : null}
      {pestana === 'incidencias' ? <IncidenciasTab /> : null}
      {pestana === 'pasarela' ? <PasarelaTab /> : null}
      {pestana === 'remesas' ? <RemesasTab /> : null}
      {pestana === 'libro' ? <LibroMayor /> : null}
      {pestana === 'fondo' ? <Fondo /> : null}
    </div>
  )
}
