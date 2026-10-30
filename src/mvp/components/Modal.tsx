import { useEffect, useRef, type ReactNode } from 'react'
import { t } from '../../i18n'

type Props = {
  titulo: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ titulo, onClose, children }: Props) {
  const cuadro = useRef<HTMLDivElement>(null)
  // Se guarda el último onClose para no reiniciar el efecto en cada render: antes cada
  // render (la cuenta regresiva refresca seguido) devolvía el foco al cuadro y cerraba
  // los desplegables nativos.
  const alCerrar = useRef(onClose)
  alCerrar.current = onClose

  useEffect(() => {
    cuadro.current?.focus()
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar.current()
    }
    document.addEventListener('keydown', alTeclear)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && alCerrar.current()}>
      <div
        className="modal__box"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        ref={cuadro}
      >
        <header className="modal__head">
          <h2>{titulo}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('Cerrar')}</button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
