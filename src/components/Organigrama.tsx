type Area = { lineas: string[]; detalle: string }

const AREAS: Area[] = [
  { lineas: ['Cartelera', 'y Espacios'], detalle: 'Cura la portada y da de alta espacios y salas' },
  { lineas: ['Boletería', 'y Cobros'], detalle: 'Liquida, concilia y da soporte de boletería' },
  { lineas: ['Gestión', 'de Plataforma'], detalle: 'Usuarios, parámetros y contraparte técnica' },
  {
    lineas: ['Administración', 'General'],
    detalle: 'Contratos, aprobación y enlace con la Asamblea',
  },
]

const ANCHO = 168
const HUECO = 12
const X0 = 20

/** Organigrama de Urbana Cult con las cuatro áreas de la Coordinación Central. */
export function Organigrama() {
  return (
    <svg
      className="organigrama"
      viewBox="0 0 760 440"
      role="img"
      aria-label="Organigrama de Urbana Cult: la Asamblea de Representantes, la Coordinación Central de 24 personas con cuatro áreas y los 25 espacios asociados"
    >
      <g className="organigrama__lineas">
        <path d="M380 70v34" />
        <path d="M170 318v34" />
        <path d="M464 318l186 34" strokeDasharray="4 4" />
      </g>

      <rect
        className="organigrama__caja organigrama__caja--acento"
        x="230"
        y="14"
        width="300"
        height="56"
        rx="8"
      />
      <text className="organigrama__titulo" x="380" y="38" textAnchor="middle">
        Asamblea de Representantes
      </text>
      <text className="organigrama__detalle" x="380" y="58" textAnchor="middle">
        Uno por espacio, decide las reglas
      </text>

      <rect className="organigrama__marco" x="8" y="104" width="744" height="214" rx="10" />
      <text className="organigrama__titulo" x="380" y="132" textAnchor="middle">
        Coordinación Central · 24 personas
      </text>
      {AREAS.map((a, i) => {
        const x = X0 + i * (ANCHO + HUECO)
        const centro = x + ANCHO / 2
        return (
          <g key={a.lineas.join(' ')}>
            <rect className="organigrama__caja" x={x} y="150" width={ANCHO} height="148" rx="8" />
            <text className="organigrama__titulo organigrama__titulo--chico" textAnchor="middle">
              <tspan x={centro} y="180">
                {a.lineas[0]}
              </tspan>
              <tspan x={centro} y="198">
                {a.lineas[1]}
              </tspan>
            </text>
            <foreignObject x={x + 8} y="214" width={ANCHO - 16} height="76">
              <p className="organigrama__texto">{a.detalle}</p>
            </foreignObject>
          </g>
        )
      })}

      <rect className="organigrama__caja" x="20" y="352" width="300" height="56" rx="8" />
      <text className="organigrama__titulo" x="170" y="376" textAnchor="middle">
        25 espacios asociados
      </text>
      <text className="organigrama__detalle" x="170" y="396" textAnchor="middle">
        Autónomos en su programación y sus salas
      </text>

      <rect
        className="organigrama__caja organigrama__caja--acento"
        x="560"
        y="352"
        width="180"
        height="56"
        rx="8"
      />
      <text
        className="organigrama__titulo organigrama__titulo--chico"
        x="650"
        y="376"
        textAnchor="middle"
      >
        Nuestro equipo
      </text>
      <text className="organigrama__detalle" x="650" y="396" textAnchor="middle">
        Desarrolla y mantiene
      </text>
    </svg>
  )
}
