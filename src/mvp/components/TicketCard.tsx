import { QRCodeSVG } from 'qrcode.react'
import { formatearFecha, formatearHora } from '../format'
import type { Entrada, Evento } from '../types'
import { t } from '../../i18n'

type Props = {
  entrada: Entrada
  evento: Evento
  centro: string
}

export function TicketCard({ entrada, evento, centro }: Props) {
  return (
    <article className={entrada.anulada ? 'ticket ticket--void' : 'ticket'}>
      <div className="ticket__qr">
        <QRCodeSVG value={entrada.codigo} size={96} bgColor="#f4f2ec" fgColor="#16171b" />
      </div>
      <div className="ticket__info">
        <p className="ticket__title">{evento.titulo}</p>
        <p className="muted">{centro}</p>
        <p className="ticket__when">
          {formatearFecha(evento.fecha)} {t('·')}{" "}{formatearHora(evento.fecha)} {t('h')}</p>
        <p className="ticket__code">{entrada.codigo}</p>
        {entrada.anulada ? <p className="ticket__void">{t('Anulada por devolución')}</p> : null}
      </div>
    </article>
  )
}
