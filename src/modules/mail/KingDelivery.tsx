import { useRef } from 'react'
import { Pigeon } from '../../components/Pigeon'
import { useModal } from '../../hooks/useModal'

interface KingDeliveryProps {
  onReceive: () => void
  onClose: () => void
}

/**
 * Entrada dramática do Rei Pombo, que entrega em mãos a carta final.
 * Janela modal: o foco vai para "Receber a carta"; Esc fecha (a carta fica
 * no álbum, marcada como nova).
 */
export function KingDelivery({ onReceive, onClose }: KingDeliveryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useModal(containerRef, buttonRef, onClose)

  return (
    <div className="king-modal">
      <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby="king-title" className="king-modal__window px-box">
        <span className="king-modal__rays" aria-hidden="true" />
        <div className="king-modal__pigeon">
          <Pigeon hat="king" flapOnMountMs={120} />
        </div>
        <h2 id="king-title" className="king-modal__title">
          O Rei Pombo chegou!
        </h2>
        <p className="king-modal__text">
          Por decreto real, a carta mais importante de todo o reino foi guardada para este momento. Ela é sua, Pru.
        </p>
        <button ref={buttonRef} type="button" className="btn btn--primary king-modal__button" onClick={onReceive}>
          ♛ Receber a carta
        </button>
      </div>
    </div>
  )
}
