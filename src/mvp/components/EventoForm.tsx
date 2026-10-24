import { useState, type FormEvent } from 'react'
import { entradasNetas, repartir } from '../domain/ventas'
import { formatearCentavos } from '../format'
import { artistas, parametros, useMvp } from '../state'
import type { Evento } from '../types'
import { Modal } from './Modal'

const CATEGORIAS = ['Música', 'Teatro', 'Danza', 'Humor', 'Taller']

type Props = {
  /** Evento a editar; si falta, se crea uno nuevo. */
  evento?: Evento
  /** Valores iniciales para un evento nuevo (por ejemplo, al duplicar). */
  base?: Partial<Evento>
  onClose: () => void
}

/** Alta y modificación de un evento del centro (RF-CAR-01). */
export function EventoForm({ evento, base, onClose }: Props) {
  const { estado, usuario, despachar } = useMvp()
  const inicial = evento ?? base
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [categoria, setCategoria] = useState(inicial?.categoria ?? CATEGORIAS[0])
  const [artistaId, setArtistaId] = useState(inicial?.artistaId ?? artistas[0].id)
  const [fecha, setFecha] = useState(inicial?.fecha ?? '')
  const [precio, setPrecio] = useState(String(inicial?.precio ?? ''))
  const [cupo, setCupo] = useState(String(inicial?.cupo ?? ''))
  const [pesoCentro, setPesoCentro] = useState(String(inicial?.resto?.centro ?? 1))
  const [pesoArtista, setPesoArtista] = useState(String(inicial?.resto?.artista ?? 1))
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [error, setError] = useState('')

  if (!usuario?.centroId) return null
  const centroId = usuario.centroId

  const vendidas = evento
    ? estado.ventas
        .filter((v) => v.eventoId === evento.id)
        .reduce((s, v) => s + entradasNetas(v), 0)
    : 0
  // Con ventas ya asentadas el reparto pactado no puede cambiar.
  const repartoBloqueado = vendidas > 0

  const wc = Number(pesoCentro)
  const wa = Number(pesoArtista)
  const repartoValido = wc > 0 && wa > 0 && Number.isInteger(wc) && Number.isInteger(wa)
  const ejemplo = repartoValido
    ? repartir(1_000_000, parametros.comisionUrbanaPct, { centro: wc, artista: wa })
    : null

  function enviar(e: FormEvent) {
    e.preventDefault()
    const p = Math.round(Number(precio))
    const c = Math.round(Number(cupo))
    if (!titulo.trim()) return setError('Poné un título para el evento.')
    if (!fecha) return setError('Elegí la fecha y la hora.')
    if (fecha.slice(0, 10) < estado.hoy) return setError('La fecha no puede ser anterior a hoy.')
    if (!(p >= 1)) return setError('El precio debe ser mayor a cero.')
    if (!(c >= 1)) return setError('El cupo debe ser de al menos 1 entrada.')
    if (evento && c < vendidas) {
      return setError(`El cupo no puede ser menor que las ${vendidas} entradas ya vendidas.`)
    }
    if (!repartoValido)
      return setError('El reparto entre centro y artista debe ser de números enteros positivos.')
    const choque = estado.eventos.some(
      (x) => x.centroId === centroId && !x.baja && x.id !== evento?.id && x.fecha === fecha,
    )
    if (choque) return setError('Tu centro ya tiene un evento en ese día y horario.')

    despachar({
      tipo: 'guardar-evento',
      usuarioId: usuario!.id,
      evento: {
        id: evento?.id,
        titulo: titulo.trim(),
        categoria,
        artistaId,
        fecha,
        precio: p,
        cupo: c,
        descripcion: descripcion.trim(),
        resto: { centro: wc, artista: wa },
      },
    })
    onClose()
  }

  return (
    <Modal titulo={evento ? 'Modificar evento' : 'Nuevo evento'} onClose={onClose}>
      {evento && vendidas > 0 ? (
        <p className="notice">
          Este evento ya tiene {vendidas} entradas vendidas. Si cambiás la fecha se avisa a
          Coordinación, y el reparto ya no se puede modificar.
        </p>
      ) : null}
      <form className="form" onSubmit={enviar} noValidate>
        <label className="field">
          <span>Título</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <div className="form__row">
          <label className="field">
            <span>Categoría</span>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {[...new Set([...CATEGORIAS, categoria])].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Artista</span>
            <select value={artistaId} onChange={(e) => setArtistaId(e.target.value)}>
              {artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Fecha y hora</span>
          <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <div className="form__row">
          <label className="field">
            <span>Precio por entrada ($)</span>
            <input inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </label>
          <label className="field">
            <span>Cupo</span>
            <input inputMode="numeric" value={cupo} onChange={(e) => setCupo(e.target.value)} />
          </label>
        </div>

        <fieldset className="choice">
          <legend>Reparto pactado con el artista</legend>
          <div className="form__row">
            <label className="field">
              <span>Parte del centro</span>
              <input
                inputMode="numeric"
                value={pesoCentro}
                disabled={repartoBloqueado}
                onChange={(e) => setPesoCentro(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Parte del artista</span>
              <input
                inputMode="numeric"
                value={pesoArtista}
                disabled={repartoBloqueado}
                onChange={(e) => setPesoArtista(e.target.value)}
              />
            </label>
          </div>
          <p className="muted checkout__hint">
            Urbana retiene {parametros.comisionUrbanaPct} % (lo fija la Asamblea). El resto se
            divide entre centro y artista en la proporción que acuerden.
            {ejemplo
              ? ` Por cada ${formatearCentavos(1_000_000)}: centro ${formatearCentavos(ejemplo.centro)}, artista ${formatearCentavos(ejemplo.artista)}, Urbana ${formatearCentavos(ejemplo.urbana)}.`
              : ''}
          </p>
        </fieldset>

        <label className="field">
          <span>Descripción</span>
          <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>
        <p className="muted checkout__hint">
          La portada la define la Asamblea: un evento no puede marcarse como destacado desde acá.
        </p>
        {error ? (
          <p className="form__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary">
          {evento ? 'Guardar cambios' : 'Publicar evento'}
        </button>
      </form>
    </Modal>
  )
}
