import { useState } from 'react'
import { docente, integrantes, type Integrante } from '../data/equipo'

function iniciales({ nombre, apellido }: Integrante) {
  return `${nombre[0]}${apellido[0]}`.toUpperCase()
}

function Avatar({ integrante }: { integrante: Integrante }) {
  const [falla, setFalla] = useState(false)

  if (integrante.github && !falla) {
    return (
      <img
        className="member__avatar"
        src={`https://github.com/${integrante.github}.png?size=200`}
        alt={`Foto de ${integrante.nombre} ${integrante.apellido}`}
        width={96}
        height={96}
        loading="lazy"
        onError={() => setFalla(true)}
      />
    )
  }

  return (
    <div className="member__avatar member__avatar--initials" aria-hidden="true">
      {iniciales(integrante)}
    </div>
  )
}

export function Equipo() {
  return (
    <div className="page page--narrow">
      <p className="eyebrow">Equipo 23 · Comisión A</p>
      <h1>Quiénes hicimos Urbana Cult</h1>

      <p className="lead">
        Somos un equipo de desarrollo que ofrece a Urbana Cult, una red de 25 centros culturales
        independientes, una plataforma de gestión como servicio. La desarrollamos, la alojamos y la
        mantenemos, y resuelve en un solo lugar la cartelera, la venta de entradas con reparto del
        cobro, el efectivo, la liquidación y el alquiler de salas. Somos el Equipo 23 de la Comisión
        A de la Tecnicatura Superior en Desarrollo de Software a Distancia del IFTS N° 29, y este
        sitio reúne el resumen de la propuesta y un prototipo que muestra cómo funcionaría.
      </p>

      <ul className="members">
        {integrantes.map((integrante) => (
          <li key={`${integrante.apellido}-${integrante.nombre}`} className="member">
            <Avatar integrante={integrante} />
            <div className="member__body">
              <h2 className="member__name">
                {integrante.nombre} {integrante.apellido}
              </h2>
              <div className="member__links">
                {integrante.linkedin ? (
                  <a href={integrante.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                ) : null}
                {integrante.github ? (
                  <a
                    href={`https://github.com/${integrante.github}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                ) : null}
                {integrante.web ? (
                  <a href={integrante.web} target="_blank" rel="noreferrer">
                    Web
                  </a>
                ) : null}
                {!integrante.linkedin && !integrante.github && !integrante.web ? (
                  <span className="muted">Enlaces próximamente</span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="muted">Docente: {docente}</p>
    </div>
  )
}
