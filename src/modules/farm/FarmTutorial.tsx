import { useRef } from 'react'
import { Pigeon } from '../../components/Pigeon'
import { useModal } from '../../hooks/useModal'

/** Tutorial curto da primeira visita (também abre em "Como jogar"). */
export function FarmTutorial({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useModal(containerRef, buttonRef, onClose)

  return (
    <div className="farm-tutorial">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="farm-tutorial-title"
        className="farm-tutorial__window px-box"
      >
        <div className="farm-tutorial__pigeon" aria-hidden="true">
          <Pigeon hat="eboshi" />
        </div>
        <h2 id="farm-tutorial-title" className="farm-tutorial__title">
          Como cuidar da fazendinha
        </h2>
        <ol className="farm-tutorial__steps">
          <li>
            <strong>Escolha uma semente</strong> (milho, arroz ou girassol).
          </li>
          <li>
            <strong>Toque num canteiro vazio</strong> para plantar.
          </li>
          <li>
            <strong>Espere crescer.</strong> O tempo passa de verdade, até com o site fechado.
          </li>
          <li>
            <strong>Toque na plantinha pronta</strong> para colher. Os alimentos vão para o estoque e a planta devolve 1
            semente.
          </li>
        </ol>
        <p className="farm-tutorial__tip">Ficou sem sementes? O Pombo-sama deixa um saquinho grátis de tempos em tempos.</p>
        <button ref={buttonRef} type="button" className="btn btn--primary" onClick={onClose}>
          ▶ Vamos plantar!
        </button>
      </div>
    </div>
  )
}
