import { useState, type FormEvent } from 'react'
import { useMvp } from '../state'
import type { Centro } from '../types'
import { Modal } from './Modal'

type Props = {
  /** Centro a modificar; si falta, se da de alta uno nuevo. */
  centro?: Centro
  onClose: () => void
}

/** Alta y modificación de los espacios de la red (RF-PLA-04). */
export function CentroForm({ centro, onClose }: Props) {
  const { usuario: admin, despachar } = useMvp()
  const [nombre, setNombre] = useState(centro?.nombre ?? '')
  const [barrio, setBarrio] = useState(centro?.barrio ?? '')
  const [error, setError] = useState('')
  if (!admin) return null

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !barrio.trim()) return setError('Completá el nombre y el barrio.')
    despachar({
      tipo: 'admin-guardar-centro',
      adminId: admin!.id,
      datos: { id: centro?.id, nombre, barrio },
    })
    onClose()
  }

  return (
    <Modal titulo={centro ? 'Modificar centro' : 'Nuevo centro'} onClose={onClose}>
      <form className="form" onSubmit={enviar} noValidate>
        <label className="field">
          <span>Nombre del espacio</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="field">
          <span>Barrio</span>
          <input value={barrio} onChange={(e) => setBarrio(e.target.value)} />
        </label>
        {error ? (
          <p className="form__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary">
          {centro ? 'Guardar cambios' : 'Dar de alta'}
        </button>
      </form>
    </Modal>
  )
}
