import { useEffect, useRef, useState } from 'react'
import {
  FINAL_LETTER_FOOTER,
  FINAL_LETTER_ID,
  LETTER_FOOTERS,
  RARITY_LABEL,
  type LoveLetter,
} from '../../data/loveLetters'
import { useModal } from '../../hooks/useModal'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Envelope } from './Envelope'
import { LetterIcon } from './LetterIcon'

/** O lacre se abre depois deste tempo; o papel sobe logo em seguida (CSS). */
export const FLAP_OPEN_MS = 300

interface LetterDialogProps {
  letter: LoveLetter
  onClose: () => void
}

/**
 * A carta aberta, numa janela modal: o envelope abre a aba, o papel sobe e
 * aparece o texto completo. O texto está no documento desde o início, para
 * o leitor de tela ler o título assim que a janela abre.
 */
export function LetterDialog({ letter, onClose }: LetterDialogProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [flapOpen, setFlapOpen] = useState(reducedMotion)
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  useModal(containerRef, titleRef, onClose)

  useEffect(() => {
    if (reducedMotion) return
    const id = window.setTimeout(() => setFlapOpen(true), FLAP_OPEN_MS)
    return () => window.clearTimeout(id)
  }, [reducedMotion])

  const isFinal = letter.id === FINAL_LETTER_ID
  const footer = isFinal ? FINAL_LETTER_FOOTER : LETTER_FOOTERS[(letter.id - 1) % LETTER_FOOTERS.length]
  const titleId = `letter-${letter.id}-title`

  return (
    <div className="letter-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`letter-modal__window letter-modal__window--${letter.rarity} ${isFinal ? 'letter-modal__window--final' : ''}`}
      >
        <div className="letter-modal__envelope" aria-hidden="true">
          <Envelope rarity={letter.rarity} open={flapOpen} />
        </div>

        <article className={`letter-paper px-box ${flapOpen ? 'letter-paper--out' : ''}`}>
          <header className="letter-paper__header">
            <span className="letter-paper__icon" aria-hidden="true">
              <LetterIcon icon={letter.icon} scale={4} />
            </span>
            <span className={`rarity-seal rarity-seal--${letter.rarity}`}>{RARITY_LABEL[letter.rarity]}</span>
          </header>

          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="letter-paper__title">
            {letter.title}
          </h2>
          <p className="letter-paper__from">De: {letter.sender}</p>
          <p className="letter-paper__body">{letter.body}</p>

          <footer className="letter-paper__footer">
            <span className="letter-paper__postmark" aria-hidden="true" lang="ja">
              鳩便
            </span>
            <span className="letter-paper__stamp-text">{footer}</span>
          </footer>
        </article>

        <button type="button" className="btn letter-modal__close" onClick={onClose}>
          ✕ Fechar carta
        </button>
      </div>
    </div>
  )
}
