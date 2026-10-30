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

// Orden por aporte al trabajo, de mayor a menor.
export const integrantes: Integrante[] = [
  {
    apellido: 'Savia',
    nombre: 'Martín Raúl',
    github: 'martin-2t',
    linkedin: 'https://www.linkedin.com/in/martin-savia-03840738a',
  },
  {
    apellido: 'Mazzitelli',
    nombre: 'Matías Nicolás',
    github: 'mdev-repos',
    linkedin: 'https://www.linkedin.com/in/mnm-dev',
  },
  { apellido: 'Piedrabuena', nombre: 'Julián', github: 'juliganSW' },
  {
    apellido: 'Valdez Montigel',
    nombre: 'Emmanuel Alejandro',
    github: 'Emmanuel-Valdez',
    linkedin: 'https://www.linkedin.com/in/evaldezdev/',
    web: 'https://evaldez.ar/',
  },
  {
    apellido: 'Álvarez Márquez',
    nombre: 'Camila',
    github: 'CAM-75',
    linkedin: 'https://www.linkedin.com/in/camila-%C3%A1lvarez-m%C3%A1rquez/',
    web: 'https://muckrack.com/camila-alvarez-marquez-',
  },
]

export const docente = 'Ayelen Natalia Arias Gomez'
