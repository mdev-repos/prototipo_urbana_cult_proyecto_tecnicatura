import type { ReactNode } from 'react'

const img = (name: string) => `${import.meta.env.BASE_URL}img/${name}`

const secciones = [
  { id: 'materia', label: 'La materia' },
  { id: 'consigna', label: 'La consigna' },
  { id: 'urbana', label: 'Urbana' },
  { id: 'decisiones', label: 'Decisiones' },
]

function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Seccion({
  id,
  numero,
  titulo,
  children,
}: {
  id: string
  numero: string
  titulo: string
  children: ReactNode
}) {
  return (
    <section id={id} className="block">
      <h2 className="block__title">
        <span className="block__num">{numero}</span> {titulo}
      </h2>
      {children}
    </section>
  )
}

function Figura({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="figure">
      <a
        className="figure__paper"
        href={src}
        target="_blank"
        rel="noreferrer"
        title="Abrir en tamaño completo"
      >
        <img src={src} alt={alt} loading="lazy" />
      </a>
      <figcaption>{caption} Tocá la imagen para verla en tamaño completo.</figcaption>
    </figure>
  )
}

const decisiones = [
  {
    titulo: 'Reparto asentado al pagar',
    texto:
      'El split se calcula y se asienta en el momento del cobro, con estado "retenido". Nada se gira a terceros antes del evento, así que siempre se puede devolver.',
  },
  {
    titulo: 'Liquidación automática a D+2',
    texto:
      'Urbana es el único agente pagador: dos días después del evento paga al artista, acredita al centro y retiene su comisión. El plazo lo fija la Asamblea.',
  },
  {
    titulo: 'Libro mayor interno',
    texto:
      'Cada beneficiario tiene su saldo por evento en tres estados: retenido, disponible y pagado. Es la fuente de verdad para conciliar y auditar.',
  },
  {
    titulo: 'Stock único con reserva',
    texto:
      'Una sola cuenta de cupo por evento para la web y la boletería, con reserva temporal que vence. Así no hay sobreventa entre canales.',
  },
  {
    titulo: 'Efectivo con remesa diaria',
    texto:
      'El efectivo queda "en poder del centro" y el centro remesa cada día. La última remesa descuenta su parte. Si no remesa, queda bloqueado.',
  },
  {
    titulo: 'Fondo de contingencia',
    texto:
      'Si un centro incumple, el artista cobra lo respaldado más el fondo, y después se recupera del centro. El aporte lo define la Asamblea.',
  },
  {
    titulo: 'Responsables definidos',
    texto:
      'Soporte de boletería, dentro de Boletería y Cobros, es responsable en primera instancia de las incidencias de cobro. Antes no estaba definido quién respondía.',
  },
  {
    titulo: 'Separación de funciones',
    texto:
      'El Admin de plataforma no puede aprobar ni ejecutar pagos. Administración General aprueba y Boletería y Cobros ejecuta.',
  },
]

export function Proyecto() {
  return (
    <div className="page page--narrow">
      <p className="eyebrow">Proyecto</p>
      <h1>La materia, la consigna y Urbana</h1>
      <p className="lead">
        Un resumen del trabajo: qué se pedía, qué es Urbana Cult y qué decidimos para resolver sus
        problemas de gestión.
      </p>

      <nav className="chips" aria-label="Secciones de esta página">
        {secciones.map((s) => (
          <button key={s.id} type="button" className="chip" onClick={() => irA(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      <Seccion id="materia" numero="01" titulo="La materia">
        <p>
          <strong>Ingeniería de Software</strong>, 2° A, de la Tecnicatura Superior en Desarrollo de
          Software a Distancia del IFTS N° 29. Docente: Ayelen Natalia Arias Gomez.
        </p>
        <p>La materia se apoya en dos bloques que este trabajo pone a prueba al mismo tiempo:</p>
        <ul className="list">
          <li>
            <strong>Procesos y sistemas administrativos:</strong> tipos de organizaciones, sistemas
            de información, procesos de negocio y teoría general de sistemas.
          </li>
          <li>
            <strong>Ciclo de vida del sistema:</strong> ingeniería de requerimientos y proceso de
            desarrollo de software.
          </li>
        </ul>
      </Seccion>

      <Seccion id="consigna" numero="02" titulo="La consigna">
        <p>
          La Práctica Formativa pide sentar las bases de una empresa ficticia a partir de la
          investigación de empresas reales similares (tamaño, ubicación, competidores, mercado y
          tipo de comercio) y luego analizarla. Nuestro caso fue el{' '}
          <strong>Caso 3: Cultura Digital, plataforma de eventos “Urbana Cult”</strong>.
        </p>

        <h3 className="block__sub">El caso</h3>
        <p>
          Una red de 25 centros culturales independientes, teatros autogestionados y salas de música
          que comparten agenda, venta de entradas y alquiler de salas de ensayo. Sus problemas de
          gestión:
        </p>
        <ul className="list">
          <li>
            Decisiones caóticas: se rechazan las directivas y todo se vota en asamblea, lo que
            paraliza.
          </li>
          <li>Disputas por qué eventos se promocionan en la portada.</li>
          <li>No está claro quién responde cuando falla un cobro.</li>
          <li>Liquidación manual del split de pagos, con demoras.</li>
          <li>Doble reserva de salas y sobreventa entre boletería física y digital.</li>
        </ul>

        <h3 className="block__sub">Qué se pidió analizar</h3>
        <ul className="list">
          <li>La presentación de la empresa y la justificación del caso.</li>
          <li>El relevamiento y la mejora de procesos.</li>
          <li>Los objetivos financieros y las restricciones presupuestarias.</li>
          <li>Las necesidades de gestión que un software podría cubrir.</li>
          <li>El modelo organizativo y su paradigma.</li>
          <li>
            Los requerimientos funcionales de un portal de “Publicación y Boletería Transparente”,
            con su trazabilidad.
          </li>
        </ul>
        <p className="muted">Fecha de entrega del trabajo cuatrimestral: 31/10/2026.</p>
      </Seccion>

      <Seccion id="urbana" numero="03" titulo="Urbana">
        <p>
          Urbana Cult es el núcleo administrativo y digital de la red. No reemplaza a los espacios:
          cada uno sigue programando su agenda y manejando su sala. Les da tres herramientas
          comunes:
        </p>
        <ul className="list">
          <li>
            una <strong>cartelera unificada</strong>,
          </li>
          <li>
            una <strong>venta de entradas</strong> sin sobreventa entre boletería y web, con split
            de pagos automático,
          </li>
          <li>
            una <strong>agenda compartida</strong> para reservar salas de ensayo sin choques de
            horario.
          </li>
        </ul>

        <dl className="stats">
          <div>
            <dt>espacios asociados</dt>
            <dd>25</dd>
          </div>
          <div>
            <dt>personas en la Coordinación Central</dt>
            <dd>24</dd>
          </div>
          <div>
            <dt>áreas</dt>
            <dd>5</dd>
          </div>
          <div>
            <dt>requerimientos</dt>
            <dd>61</dd>
          </div>
        </dl>

        <p>
          Las decisiones de fondo no las toma un directorio sino una{' '}
          <strong>Asamblea de representantes</strong> (uno por espacio), como en redes reales de
          cooperativas y centros culturales. La organización encaja en un paradigma
          verde-pluralista, con su riesgo conocido: que el exceso de consenso derive en parálisis.
          El diseño busca que la Asamblea fije solo las reglas importantes y que la operación diaria
          quede en la Coordinación Central.
        </p>

        <Figura
          src={img('organigrama.png')}
          alt="Organigrama de Urbana Cult: Asamblea de Representantes, Coordinación Central de 24 personas en cinco áreas y 25 espacios asociados"
          caption="Modelo organizativo: Asamblea, Coordinación Central (24 personas en 5 áreas) y espacios asociados."
        />
      </Seccion>

      <Seccion id="decisiones" numero="04" titulo="Decisiones de diseño">
        <p>
          El corazón del caso es el proceso de{' '}
          <strong>venta de entradas con split automático</strong>. Estas son las decisiones que lo
          ordenan:
        </p>

        <ol className="cards">
          {decisiones.map((d, i) => (
            <li key={d.titulo} className="card">
              <span className="card__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{d.titulo}</h3>
              <p>{d.texto}</p>
            </li>
          ))}
        </ol>

        <h3 className="block__sub">Un ejemplo con números</h3>
        <p>
          Evento de 100 entradas a $10.000, con reparto pactado de 60 % para el centro, 30 % para el
          artista y 10 % para Urbana (la comisión la fija la Asamblea; el resto lo acuerdan centro y
          artista por contrato):
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Beneficiario</th>
                <th>Reparto</th>
                <th className="num">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Centro cultural</td>
                <td>60 %</td>
                <td className="num">$600.000</td>
              </tr>
              <tr>
                <td>Artista</td>
                <td>30 %</td>
                <td className="num">$300.000</td>
              </tr>
              <tr>
                <td>Urbana Cult</td>
                <td>10 %</td>
                <td className="num">$100.000</td>
              </tr>
              <tr className="table__total">
                <td>Total</td>
                <td>100 %</td>
                <td className="num">$1.000.000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Figura
          src={img('proceso-venta.png')}
          alt="Diagrama del proceso de venta de entradas con split automático en ocho pasos, del cobro a la liquidación"
          caption="El proceso completo en ocho pasos, del cobro a la liquidación."
        />

        <h3 className="block__sub">Ingeniería de requerimientos</h3>
        <p>
          Se relevaron <strong>61 requerimientos</strong> (43 funcionales y 18 no funcionales) en
          cuatro áreas: cartelera, venta y cobros, reserva de salas y plataforma. Diez están
          desarrollados con su ficha de especificación y su proceso de elicitación; el resto queda
          identificado con su fuente y su técnica de elicitación previstas.
        </p>
      </Seccion>
    </div>
  )
}
