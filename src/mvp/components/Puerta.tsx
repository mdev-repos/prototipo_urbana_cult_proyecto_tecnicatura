import { useState, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { validarEnPuerta, type ResultadoPuerta } from '../domain/puerta'
import { formatearFecha, formatearHora } from '../format'
import { useMvp } from '../state'
import { t } from '../../i18n'

/** Control de acceso en la puerta del evento: valida el código del QR y marca la entrada como usada. */
export function Puerta({ centroId }: { centroId: string }) {
  const { estado, despachar } = useMvp()
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState<ResultadoPuerta | null>(null)

  const eventosDelCentro = new Set(
    estado.eventos
      .filter((e) => e.centroId === centroId && !e.baja && e.fecha.slice(0, 10) >= estado.hoy)
      .map((e) => e.id),
  )
  // Códigos de ejemplo para la demostración, en lugar de una cámara real.
  const ejemplos = [
    ...estado.entradas
      .filter((e) => eventosDelCentro.has(e.eventoId) && !e.anulada && !e.ingreso)
      .slice(0, 3),
    ...estado.entradas.filter((e) => eventosDelCentro.has(e.eventoId) && e.anulada).slice(0, 1),
    ...estado.entradas.filter((e) => eventosDelCentro.has(e.eventoId) && e.ingreso).slice(0, 1),
  ]

  function validar(valor: string) {
    const r = validarEnPuerta(estado.entradas, estado.eventos, valor, centroId)
    setResultado(r)
    if (r.tipo === 'valida') despachar({ tipo: 'usar-entrada', entradaId: r.entrada.id })
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (codigo.trim()) validar(codigo)
  }

  const ingresados = estado.entradas.filter(
    (e) => e.ingreso && eventosDelCentro.has(e.eventoId),
  ).length

  return (
    <div className="puerta">
      <p className="muted">
        {t(
          'Simulá el control de acceso: escribí o elegí el código del QR de una entrada. El sistema comprueba que exista, que sea de un evento de tu centro, que no esté anulada y que no se haya usado antes.',
          'Simule o controle de acesso: digite ou escolha o código do QR de um ingresso. O sistema verifica se existe, se é de um evento do seu centro, se não foi anulado e se não foi usado antes.',
        )}
      </p>

      <form onSubmit={enviar} className="form puerta__form" noValidate>
        <label className="field">
          <span>{t('Código de la entrada', 'Código do ingresso')}</span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder={t('UC-XXXXXXX')}
            autoCapitalize="characters"
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={!codigo.trim()}>
          {t('Validar entrada', 'Validar ingresso')}
        </button>
      </form>

      {ejemplos.length > 0 ? (
        <div className="puerta__ejemplos">
          <span className="muted">{t('Códigos de prueba', 'Códigos de teste')}</span>
          <div className="chips">
            {ejemplos.map((e) => (
              <button
                key={e.id}
                type="button"
                className="chip"
                onClick={() => {
                  setCodigo(e.codigo)
                  validar(e.codigo)
                }}
              >
                {e.codigo}
                {e.anulada
                  ? ` · ${t('anulada')}`
                  : e.ingreso
                    ? ` · ${t('usada')}`
                    : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {resultado ? (
        <div
          className={resultado.tipo === 'valida' ? 'notice notice--ok' : 'notice notice--error'}
          role="status"
        >
          {resultado.tipo === 'inexistente' ? (
            <p>
              <strong>{t('Entrada no encontrada.', 'Ingresso não encontrado.')}</strong>{' '}
              {t(
                'El código no corresponde a ninguna entrada emitida.',
                'O código não corresponde a nenhum ingresso emitido.',
              )}
            </p>
          ) : (
            <>
              <div className="puerta__ticket">
                <QRCodeSVG
                  value={resultado.entrada.codigo}
                  size={64}
                  bgColor="#f4f2ec"
                  fgColor="#16171b"
                />
                <div>
                  <p>
                    <strong>
                      {resultado.tipo === 'valida' &&
                        t('Entrada válida, puede pasar.', 'Ingresso válido, pode entrar.')}
                      {resultado.tipo === 'usada' &&
                        t('Entrada ya usada.', 'Ingresso já utilizado.')}
                      {resultado.tipo === 'anulada' &&
                        t('Entrada anulada por devolución.', 'Ingresso anulado por devolução.')}
                      {resultado.tipo === 'otro-centro' &&
                        t('La entrada es de otro centro.', 'O ingresso é de outro centro.')}
                    </strong>
                  </p>
                  <p>
                    {resultado.evento.titulo} {t('·')}{" "}{formatearFecha(resultado.evento.fecha)} {t('·')}{' '}
                    {formatearHora(resultado.evento.fecha)} {t('h')}</p>
                  <p className="muted">{resultado.entrada.codigo}</p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      <p className="muted">
        {t(
          'Ingresos registrados en los eventos de tu centro',
          'Entradas registradas nos eventos do seu centro',
        )}
        {t(':')}{" "}<strong>{ingresados}</strong>
      </p>
    </div>
  )
}
