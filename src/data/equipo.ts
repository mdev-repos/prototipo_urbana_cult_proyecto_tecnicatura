export type Integrante = {
  nombre: string
  apellido: string
  /** Usuario de GitHub (sin @). Si existe, se usa su foto de perfil. */
  github?: string
  /** URL completa del perfil de LinkedIn. */
  linkedin?: string
  /** Sitio personal o portfolio. */
  web?: string
}

// Orden alfabético por apellido, como figura en la portada del documento.
// Pendiente: enlaces de Camila Álvarez Márquez.
export const integrantes: Integrante[] = [
  { apellido: 'Álvarez Márquez', nombre: 'Camila' },
  {
    apellido: 'Mazzitelli',
    nombre: 'Matías Nicolás',
    github: 'mdev-repos',
    linkedin: 'https://www.linkedin.com/in/mnm-dev',
  },
  { apellido: 'Piedrabuena', nombre: 'Julián', github: 'juliganSW' },
  {
    apellido: 'Savia',
    nombre: 'Martín Raúl',
    github: 'martin-2t',
    linkedin: 'https://www.linkedin.com/in/martin-savia-03840738a',
  },
  {
    apellido: 'Valdez Montigel',
    nombre: 'Emmanuel Alejandro',
    github: 'Emmanuel-Valdez',
    linkedin: 'https://www.linkedin.com/in/evaldezdev/',
    web: 'https://evaldez.ar/',
  },
]

export const docente = 'Ayelen Natalia Arias Gomez'
