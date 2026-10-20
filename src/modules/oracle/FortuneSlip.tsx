import { useEffect, useRef } from 'react'
import { FortuneIconSvg } from '../../components/icons'
import type { ParsedFortune } from '../../data/fortunes'

/**
 * O papelzinho do omikuji. Montado de novo a cada sorteio (key no pai):
 * desenrola com animação e leva o foco ao título, para quem usa teclado ou
 * leitor de tela ouvir a previsão logo que ela aparece.
 */
export function FortuneSlip({ fortune }: { fortune: ParsedFortune }) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <article className={`fortune fortune--${fortune.luck}`} aria-labelledby={`fortune-${fortune.id}-title`}>
      <header className="fortune__header">
        <span className="fortune__stamp" lang="ja" aria-hidden="true">
          {fortune.kanji}
        </span>
        <p className="fortune__luck">
          <span className="visually-hidden">Sorte: </span>
          {fortune.luckLabel}
          {fortune.luck === 'kyo' && <span className="fortune__danger"> (nível de perigo: fofo)</span>}
        </p>
        <p className="fortune__category">
          <span className="fortune__category-icon">
            <FortuneIconSvg icon={fortune.icon} />
          </span>
          {fortune.category}
        </p>
      </header>

      <h2 id={`fortune-${fortune.id}-title`} ref={titleRef} tabIndex={-1} className="fortune__title">
        {fortune.title}
      </h2>
      <p className="fortune__body">{fortune.body}</p>
      <p className="fortune__extra">
        <span className="fortune__extra-label">Nota do oráculo:</span> {fortune.extra}
      </p>
      <p className="fortune__number">
        <span className="visually-hidden">Previsão </span>nº {fortune.id}
      </p>
    </article>
  )
}
