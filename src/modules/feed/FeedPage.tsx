import { useEffect, useRef, useState } from 'react'
import { BottomNav } from '../../components/BottomNav'
import {
  AFTER_INVASION_MESSAGE,
  FEED_STAGES,
  INVASION_AT,
  INVASION_MESSAGES,
  RESET_MESSAGE,
} from '../../data/feedGame'
import { getModule } from '../../data/modules'
import { useFocusOnMount } from '../../hooks/useFocusOnMount'
import { pickIndexAvoiding } from '../../lib/random'
import { FeedArena, type FlyingGrain } from './FeedArena'
import { eventBetween, isInvasion, pigeonsFor, stageFor } from './feedLogic'
import './Feed.css'

/** Tempo do grão no chão até ser comido. */
export const GRAIN_LIFETIME_MS = 700

/**
 * Módulo 3. Cada toque em "Jogar grãozinho" soma 1 grão, faz um pombo bicar
 * e, em certos números, chama mais pombos, até a invasão. Nada é salvo.
 */
export default function FeedPage() {
  const mod = getModule('alimentar')
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  const [grains, setGrains] = useState(0)
  const [message, setMessage] = useState(FEED_STAGES[0].message)
  const [flying, setFlying] = useState<FlyingGrain[]>([])
  const [invasionRound, setInvasionRound] = useState(0)
  // fonte da verdade do contador: toques muito rápidos (antes de a tela
  // atualizar) não podem ler um valor velho e "perder" grãos
  const grainsRef = useRef(0)
  const lastInvasionMessage = useRef<number | null>(null)
  const nextGrainId = useRef(0)
  const timers = useRef(new Set<number>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const pigeons = pigeonsFor(grains)
  const invaded = isInvasion(grains)

  const feed = () => {
    const before = grainsRef.current
    const after = before + 1
    grainsRef.current = after
    setGrains(after)

    const event = eventBetween(before, after)
    if (event === 'invasion') {
      const index = pickIndexAvoiding(INVASION_MESSAGES.length, lastInvasionMessage.current)
      lastInvasionMessage.current = index
      setMessage(INVASION_MESSAGES[index])
      setInvasionRound((r) => r + 1)
    } else if (event === 'stage') {
      setMessage(stageFor(after).message)
    } else if (after === INVASION_AT + 5) {
      setMessage(AFTER_INVASION_MESSAGE)
    }

    // o grão cai na frente do bico de um pombo sorteado, que bica
    const present = pigeonsFor(after)
    const target = Math.floor(Math.random() * present.length)
    const slot = present[target]
    const id = nextGrainId.current++
    setFlying((list) => [...list, { id, pigeonIndex: target, x: slot.x, y: slot.y, flip: slot.flip }])
    const timer = window.setTimeout(() => {
      setFlying((list) => list.filter((g) => g.id !== id))
      timers.current.delete(timer)
    }, GRAIN_LIFETIME_MS)
    timers.current.add(timer)
  }

  const reset = () => {
    if (grainsRef.current === 0) return
    grainsRef.current = 0
    setGrains(0)
    setFlying([])
    setMessage(RESET_MESSAGE)
  }

  return (
    <div className="feed-page">
      <main className="feed">
        <header className="feed__header">
          <p className="eyebrow">
            <span className="jp" lang="ja">
              {mod.jp}
            </span>{' '}
            · Módulo {mod.number}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {mod.name}
          </h1>
        </header>

        <div className="feed__dialog">
          <p className="feed__bubble px-box" aria-live="polite">
            <span className="feed__speaker" aria-hidden="true">
              Pombo-sama
            </span>
            {message}
          </p>
        </div>

        <FeedArena pigeons={pigeons} flying={flying} invaded={invaded} invasionRound={invasionRound} />

        <dl className="feed__hud">
          <div className="feed__stat px-box">
            <dt>Grãos oferecidos</dt>
            <dd data-testid="grain-count">{grains}</dd>
          </div>
          <div className="feed__stat px-box">
            <dt>Pombos reunidos</dt>
            <dd data-testid="pigeon-count">{pigeons.length}</dd>
          </div>
        </dl>

        <div className="feed__actions">
          <button type="button" className="btn btn--primary feed__throw" onClick={feed}>
            ▶ Jogar grãozinho
          </button>
          <button
            type="button"
            className={`btn ${invaded ? '' : 'btn--ghost'}`}
            onClick={reset}
            aria-disabled={grains === 0 || undefined}
          >
            ↺ Recomeçar
          </button>
        </div>
      </main>
      <BottomNav current="alimentar" />
    </div>
  )
}
