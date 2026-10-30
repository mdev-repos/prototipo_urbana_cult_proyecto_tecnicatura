import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/Logo'
import { Organigrama } from '../components/Organigrama'
import { ProcesoVenta } from '../components/ProcesoVenta'


type Slide = {
  id: string
  eyebrow: string
  title: string
  body: ReactNode
}

function Puntos({ items }: { items: string[] }) {
  return (
    <ul className="list">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )
}

function Cifras({ items }: { items: [string, string][] }) {
  return (
    <dl className="stats">
      {items.map(([valor, etiqueta]) => (
        <div key={etiqueta}>
          <dt>{etiqueta}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  )
}

type Paso = { titulo: string; valor: string; acento?: boolean }

type Alternativa = {
  id: string
  nombre: string
  /** Lo que se recorre por cada entrada de 20.000 pesos, hasta llegar a lo que cobra nuestro equipo. */
  pasos: Paso[]
  partes: Paso[]
  conserva: string
  cuota: string
  excedente: string
}

const alternativas: Alternativa[] = [
  {
    id: 'comision',
    nombre: 'Con la comisión actual',
    pasos: [
      { titulo: 'Entrada vendida', valor: '$20.000' },
      { titulo: 'Comisión del 10 % para Urbana Cult', valor: '$2.000', acento: true },
      { titulo: 'Urbana Cult cede el 9 % de su comisión', valor: '$180' },
    ],
    partes: [
      { titulo: '3 puntos para el mantenimiento', valor: '$60' },
      { titulo: '6 puntos para recuperar el desarrollo', valor: '$120' },
    ],
    conserva: '$1.820',
    cuota: 'USD 2.800',
    excedente: 'USD 5.100',
  },
  {
    id: 'cargo',
    nombre: 'Con un cargo al comprador',
    pasos: [
      { titulo: 'Entrada vendida', valor: '$20.000' },
      { titulo: 'Cargo del 3 % al comprador', valor: '$600', acento: true },
      { titulo: 'Nos corresponde el 30 % del cargo', valor: '$180' },
    ],
    partes: [
      { titulo: '10 puntos para el mantenimiento', valor: '$60' },
      { titulo: '20 puntos para recuperar el desarrollo', valor: '$120' },
    ],
    conserva: '$2.420',
    cuota: 'USD 2.700',
    excedente: 'USD 14.300',
  },
  {
    id: 'mixta',
    nombre: 'Mixta',
    pasos: [
      { titulo: 'Entrada vendida', valor: '$20.000' },
      {
        titulo: 'Cargo del 2 % al comprador, del que tomamos el 15 %, más el 6 % de la comisión',
        valor: '$180',
        acento: true,
      },
    ],
    partes: [
      { titulo: 'Un tercio para el mantenimiento', valor: '$60' },
      { titulo: 'Dos tercios para recuperar el desarrollo', valor: '$120' },
    ],
    conserva: '$2.220',
    cuota: 'USD 2.800',
    excedente: 'USD 11.200',
  },
]

function Financiamiento() {
  const [actual, setActual] = useState(0)
  const alt = alternativas[actual]
  return (
    <>
      <div className="chips" role="group" aria-label="Alternativas de financiamiento">
        {alternativas.map((a, i) => (
          <button
            key={a.id}
            type="button"
            className={i === actual ? 'chip is-active' : 'chip'}
            aria-pressed={i === actual}
            onClick={() => setActual(i)}
          >
            {i + 1}. {a.nombre}
          </button>
        ))}
      </div>

      <div className="flujo">
        {alt.pasos.map((p) => (
          <div key={p.titulo} className="flujo__fila">
            <div className={p.acento ? 'flujo__paso flujo__paso--acento' : 'flujo__paso'}>
              <span className="flujo__titulo">{p.titulo}</span>
              <span className="flujo__valor">{p.valor}</span>
            </div>
            <span className="flujo__flecha" aria-hidden="true">
              →
            </span>
          </div>
        ))}
        <div className="flujo__partes">
          {alt.partes.map((p) => (
            <div key={p.titulo} className="flujo__paso flujo__paso--acento">
              <span className="flujo__titulo">{p.titulo}</span>
              <span className="flujo__valor">{p.valor}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="flujo__resumen">
        Por cada entrada de $20.000, Urbana Cult conserva {alt.conserva} y nuestro equipo recibe
        $180. Con el volumen del caso base, unas 23.600 entradas por mes y unos USD 31.000 de
        comisión, la cuota total es de {alt.cuota} por mes, el desarrollo se recupera en unos 18
        meses y a Urbana Cult le queda un excedente mensual de {alt.excedente}.
      </p>
      <p className="muted">
        El mantenimiento tiene un piso de USD 600 y un tope de USD 1.200 por mes. La recuperación
        tiene un piso de USD 800 y dura hasta completar el monto. La comisión del 10 % no se
        modifica en ninguna alternativa.
      </p>
    </>
  )
}

const slides: Slide[] = [
  {
    id: 'portada',
    eyebrow: 'Equipo 23 · IFTS N° 29',
    title: 'Una plataforma de gestión para Urbana Cult',
    body: (
      <>
        <LogoMark className="slide__mark" />
        <p className="lead">
          Cartelera, venta de entradas con reparto del cobro, efectivo, liquidación y salas de
          ensayo en un solo sistema, ofrecido como servicio.
        </p>
        <p className="muted">Trabajo cuatrimestral de Ingeniería de Software · Entrega final</p>
      </>
    ),
  },
  {
    id: 'cliente',
    eyebrow: 'El cliente',
    title: 'Una red de 25 centros culturales',
    body: (
      <>
        <p>
          Urbana Cult reúne teatros autogestionados y salas de música que comparten agenda, venta de
          entradas y alquiler de salas de ensayo. Cada espacio sigue programando lo suyo.
        </p>
        <Cifras
          items={[
            ['25', 'espacios asociados'],
            ['24', 'personas en la Coordinación Central'],
            ['10 %', 'comisión por entrada, su único ingreso'],
          ]}
        />
        <p>
          Las decisiones de fondo las toma una Asamblea con un representante por espacio. La
          operación diaria queda en la Coordinación Central.
        </p>
      </>
    ),
  },
  {
    id: 'problema',
    eyebrow: 'El problema',
    title: 'Procesos manuales y canales paralelos',
    body: (
      <Puntos
        items={[
          'El reparto del cobro entre centro, artista y red se liquida a mano, con demoras.',
          'Hay sobreventa entre la boletería física y la venta digital.',
          'Una misma sala de ensayo se alquila dos veces para el mismo horario.',
          'No está definido quién responde cuando falla un cobro.',
          'No existe una única fuente de verdad sobre lo vendido ni sobre lo que le corresponde a cada centro.',
        ]}
      />
    ),
  },
  {
    id: 'analisis',
    eyebrow: 'El análisis',
    title: 'Cómo leímos a la organización',
    body: (
      <>
        <Puntos
          items={[
            'Paradigma verde-pluralista, que decide por consenso y corre el riesgo de la parálisis.',
            'Sistema abierto formado por 25 subsistemas y un núcleo central.',
            'La Asamblea fija las reglas importantes y el sistema las aplica.',
            'Cuatro áreas en la Coordinación Central, cada una con responsables definidos.',
          ]}
        />
        <Organigrama />
      </>
    ),
  },
  {
    id: 'propuesta',
    eyebrow: 'La propuesta',
    title: 'Una plataforma, ofrecida como servicio',
    body: (
      <>
        <p>
          Nuestro equipo la desarrolla, la aloja, la mantiene y da soporte. Todos los módulos
          comparten un libro mayor y una base de datos únicos.
        </p>
        <Puntos
          items={[
            'Cartelera unificada con criterio de portada definido por la Asamblea.',
            'Venta con stock único y reserva que vence, sin sobreventa entre canales.',
            'Reparto asentado al pagar y liquidación automática a D+2.',
            'Efectivo con remesa diaria y fondo de contingencia.',
            'Agenda de salas de ensayo sin choques de horario.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'proceso',
    eyebrow: 'El proceso de venta',
    title: 'Del cobro a la liquidación, en ocho pasos',
    body: <ProcesoVenta />,
  },
  {
    id: 'cobro',
    eyebrow: 'Cómo funciona un cobro',
    title: 'El reparto se asienta en el momento',
    body: (
      <>
        <p>
          Evento de 100 entradas a $10.000, con reparto de 60 % para el centro, 30 % para el artista
          y 10 % para Urbana Cult.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Beneficiario</th>
                <th className="num">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Centro cultural (60 %)</td>
                <td className="num">$600.000</td>
              </tr>
              <tr>
                <td>Artista (30 %)</td>
                <td className="num">$300.000</td>
              </tr>
              <tr>
                <td>Urbana Cult (10 %)</td>
                <td className="num">$100.000</td>
              </tr>
              <tr className="table__total">
                <td>Total</td>
                <td className="num">$1.000.000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          Nada se gira a terceros antes del evento, así que siempre se puede devolver.
        </p>
      </>
    ),
  },
  {
    id: 'alcance',
    eyebrow: 'Alcance y requerimientos',
    title: 'Qué incluye y qué queda para después',
    body: (
      <>
        <Cifras
          items={[
            ['44', 'requerimientos funcionales'],
            ['19', 'requerimientos no funcionales'],
            ['2', 'etapas de desarrollo'],
          ]}
        />
        <Puntos
          items={[
            'Etapa 1, el recorrido completo de una venta, desde la publicación hasta la liquidación.',
            'Etapa 2, los controles que lo refuerzan, como la conciliación y el fondo de contingencia.',
            'Si se corta internet en una boletería, la venta sigue con un bloque numerado de entradas reservado de antemano, y la plataforma apunta a una disponibilidad de 99,5 %.',
            'La entrada se valida con su QR en la puerta del evento.',
          ]}
        />
        <p className="muted">
          Más adelante se puede sumar, si la Asamblea lo decide, la venta sin conexión completa,
          otros medios de pago, la facturación electrónica y una aplicación nativa.
        </p>
      </>
    ),
  },
  {
    id: 'desarrollo',
    eyebrow: 'Cómo lo construimos',
    title: 'Scrum, en dos etapas y por tandas',
    body: (
      <>
        <Cifras
          items={[
            ['6 a 8', 'sprints de la etapa 1'],
            ['3', 'sprints de la etapa 2'],
            ['~20', 'semanas en total'],
          ]}
        />
        <Puntos
          items={[
            'Equipo de cinco personas, sprints de dos semanas y entrega de valor real en cada uno.',
            'La puesta en marcha en los centros es independiente de los sprints.',
            'Primero difusión en los 25 espacios, luego un piloto de venta en 3 o 4 centros y después tandas de 5 o 6.',
            'Cada centro entra completo o no entra.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'tecnologia',
    eyebrow: 'Tecnología',
    title: 'Herramientas probadas y costo acotado',
    body: (
      <div className="table-wrap">
        <table className="table">
          <tbody>
            <tr>
              <td>Front</td>
              <td>React, TypeScript, i18n</td>
            </tr>
            <tr>
              <td>Back</td>
              <td>Java con Spring Boot, API REST</td>
            </tr>
            <tr>
              <td>Datos</td>
              <td>PostgreSQL</td>
            </tr>
            <tr>
              <td>Cobros</td>
              <td>Mercado Pago como único medio de pago</td>
            </tr>
            <tr>
              <td>Alojamiento</td>
              <td>AWS (ECS Fargate, RDS, Backup, CloudWatch)</td>
            </tr>
            <tr>
              <td>Trabajo</td>
              <td>Git, GitHub Projects y Actions, Docker, Postman, k6</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'inversion',
    eyebrow: 'Inversión',
    title: 'Cuánto cuesta y qué recibe Urbana Cult',
    body: (
      <>
        <Cifras
          items={[
            ['USD 39.400', 'costo total del desarrollo'],
            ['USD 6.000', 'pago inicial'],
            ['USD 33.400', 'a recuperar con la comisión'],
          ]}
        />
        <Puntos
          items={[
            'Una licencia perpetua de la plataforma tal como se entrega.',
            'El código en custodia y la propiedad de sus datos.',
            'Un servicio con plazo mínimo de 24 meses, con mantenimiento incluido.',
            'La comisión del 10 % de la red no se modifica.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'financiamiento',
    eyebrow: 'Financiamiento',
    title: 'Cómo se paga, en tres alternativas',
    body: <Financiamiento />,
  },
  {
    id: 'demo',
    eyebrow: 'Para ver funcionando',
    title: 'El prototipo',
    body: (
      <>
        <p className="lead">
          Seis roles, una compra de punta a punta, el reparto del cobro, el efectivo, la liquidación
          y la validación del QR en la puerta.
        </p>
        <p>
          <Link to="/mvp" className="btn btn--primary">
            Abrir el MVP
          </Link>
        </p>
      </>
    ),
  },
]

export function Proyecto() {
  const [actual, setActual] = useState(0)
  const ultimo = slides.length - 1

  const ir = useCallback((n: number) => setActual(Math.min(Math.max(n, 0), ultimo)), [ultimo])

  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setActual((a) => Math.min(a + 1, ultimo))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setActual((a) => Math.max(a - 1, 0))
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [ultimo])

  const slide = slides[actual]

  return (
    <div className="page deck">
      <section className="slide" aria-live="polite" key={slide.id}>
        <p className="eyebrow">{slide.eyebrow}</p>
        <h1 className="slide__title">{slide.title}</h1>
        <div className="slide__body">{slide.body}</div>
      </section>

      <nav className="deck__nav" aria-label="Diapositivas">
        <button
          type="button"
          className="btn"
          onClick={() => ir(actual - 1)}
          disabled={actual === 0}
        >
          Anterior
        </button>
        <ol className="deck__dots">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={i === actual ? 'deck__dot is-active' : 'deck__dot'}
                onClick={() => ir(i)}
                aria-label={`${i + 1}. ${s.title}`}
                aria-current={i === actual}
              />
            </li>
          ))}
        </ol>
        <span className="muted deck__count">
          {actual + 1} / {slides.length}
        </span>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => ir(actual + 1)}
          disabled={actual === ultimo}
        >
          Siguiente
        </button>
      </nav>
    </div>
  )
}
