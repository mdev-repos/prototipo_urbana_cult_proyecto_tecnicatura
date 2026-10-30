type Paso = { n: number; titulo: string; quien: string }

const VENTA: Paso[] = [
  { n: 1, titulo: 'Selección de entradas', quien: 'Cliente o cajero del centro' },
  { n: 2, titulo: 'Reserva de cupo con vencimiento', quien: 'Plataforma, stock único' },
  { n: 3, titulo: 'Cobro por pasarela o en efectivo', quien: 'Pasarela de pago o cajero' },
  { n: 4, titulo: 'Asiento del reparto, estado retenido', quien: 'Plataforma, libro mayor' },
  { n: 5, titulo: 'Emisión de la entrada con QR único', quien: 'Plataforma de venta' },
]

function Tarjeta({ paso, variante }: { paso: Paso; variante?: string }) {
  return (
    <li className={variante ? `proceso__paso proceso__paso--${variante}` : 'proceso__paso'}>
      <span className="proceso__num">{paso.n}</span>
      <span className="proceso__titulo">{paso.titulo}</span>
      <span className="proceso__quien">{paso.quien}</span>
    </li>
  )
}

/** Proceso de venta de entradas con reparto automático, en sus ocho pasos. */
export function ProcesoVenta() {
  return (
    <div className="proceso">
      <section className="proceso__grupo">
        <h3>Al momento de la venta, en la web o en la boletería</h3>
        <ol className="proceso__pasos">
          {VENTA.map((p) => (
            <Tarjeta key={p.n} paso={p} />
          ))}
        </ol>
        <p className="muted">
          El efectivo se marca en poder del centro. Si el pago se rechaza o la reserva vence, el
          cupo se libera. Antes del evento el dinero queda retenido, así que siempre se puede
          devolver. En la puerta, el QR se valida una sola vez.
        </p>
      </section>

      <section className="proceso__grupo">
        <h3>Después de la venta</h3>
        <ol className="proceso__pasos proceso__pasos--tres">
          <Tarjeta
            paso={{
              n: 6,
              titulo: 'Remesa diaria del efectivo, con cierre de caja',
              quien: 'Centro y plataforma',
            }}
          />
          <Tarjeta
            paso={{
              n: 7,
              titulo: 'Liquidación final a D+2',
              quien: 'Urbana Cult, único agente pagador',
            }}
          />
          <li className="proceso__paso proceso__paso--alerta">
            <span className="proceso__titulo">Si un centro no remesa a tiempo</span>
            <span className="proceso__quien">
              El artista cobra lo respaldado más el fondo de contingencia, y el centro queda
              bloqueado hasta regularizarse.
            </span>
          </li>
        </ol>
      </section>

      <section className="proceso__grupo">
        <h3>En todo momento</h3>
        <ol className="proceso__pasos proceso__pasos--uno">
          <Tarjeta
            variante="incidencia"
            paso={{
              n: 8,
              titulo: 'Conciliación e incidencias de cobro',
              quien: 'Soporte de boletería, dentro de Boletería y Cobros',
            }}
          />
        </ol>
      </section>
    </div>
  )
}
