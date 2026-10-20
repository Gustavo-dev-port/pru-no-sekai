import { useEffect, useRef, useState } from 'react'
import { BottomNav } from '../../components/BottomNav'
import { Pigeon } from '../../components/Pigeon'
import { FORTUNES, type ParsedFortune } from '../../data/fortunes'
import { getModule } from '../../data/modules'
import { useFocusOnMount } from '../../hooks/useFocusOnMount'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { pickIndexAvoiding } from '../../lib/random'
import { FortuneSlip } from './FortuneSlip'
import { OmikujiBox } from './OmikujiBox'
import './Oracle.css'

/** Precisa bater com a animação .omikuji-box--shaking em Oracle.css. */
export const SHAKE_DURATION_MS = 1000

const LINE_IDLE = 'Concentre-se na sua pergunta… ou no milho. Os pombos não julgam.'
const LINE_SHAKING = 'Os pombos estão consultando os astros…'
const LINE_DONE = 'O oráculo falou! Quer outra opinião? Os pombos adoram trabalhar.'

/**
 * Módulo 2. Sacode a caixa de omikuji, sorteia uma previsão que nunca é
 * igual à anterior e desenrola o papelzinho. A previsão fica na tela até a
 * próxima consulta. Nada é salvo.
 */
export default function OraclePage() {
  const mod = getModule('oraculo')
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const reducedMotion = usePrefersReducedMotion()

  const [shaking, setShaking] = useState(false)
  const [fortune, setFortune] = useState<ParsedFortune | null>(null)
  const [drawCount, setDrawCount] = useState(0)
  const lastIndex = useRef<number | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const reveal = () => {
    const index = pickIndexAvoiding(FORTUNES.length, lastIndex.current)
    lastIndex.current = index
    setFortune(FORTUNES[index])
    setDrawCount((c) => c + 1)
    setShaking(false)
  }

  const draw = () => {
    if (shaking) return
    if (reducedMotion) {
      reveal()
      return
    }
    setShaking(true)
    timer.current = window.setTimeout(reveal, SHAKE_DURATION_MS)
  }

  const line = shaking ? LINE_SHAKING : fortune ? LINE_DONE : LINE_IDLE

  return (
    <div className="oracle-page">
      <main className="oracle" aria-busy={shaking}>
        <header className="oracle__header">
          <p className="eyebrow">
            <span className="jp" lang="ja">
              {mod.jp}
            </span>{' '}
            · Módulo {mod.number}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {mod.name}
          </h1>
          <p className="oracle__tagline">{mod.tagline}</p>
        </header>

        <section className="oracle__altar" aria-label="Altar do oráculo">
          <OmikujiBox shaking={shaking} drawn={fortune !== null} />
          <div className="oracle__pigeon">
            <Pigeon hat="omikuji" />
          </div>
          <p className="oracle__line px-box">{line}</p>
        </section>

        {fortune && <FortuneSlip key={drawCount} fortune={fortune} />}

        <button type="button" className="btn btn--primary oracle__draw" onClick={draw} aria-disabled={shaking || undefined}>
          {shaking ? 'Sacudindo…' : fortune ? '▶ Tirar outra previsão' : '▶ Tirar um omikuji'}
        </button>

        <p className="visually-hidden" role="status">
          {shaking ? LINE_SHAKING : ''}
        </p>
      </main>
      <BottomNav current="oraculo" />
    </div>
  )
}
