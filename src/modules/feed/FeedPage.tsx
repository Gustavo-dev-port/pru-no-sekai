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
import { FeedArena, type ArenaEffect, type FlyingGrain, type GrainPhase } from './FeedArena'
import { announcementFor, eventBetween, isInvasion, pickTarget, pigeonsFor, stageFor } from './feedLogic'
import { GuardianPortrait } from './GuardianPortrait'
import './Feed.css'

/**
 * Linha do tempo de cada grão (ms desde o toque):
 *   0    o grão cai (2 quadros)
 *   160  o pombo inclina a cabeça
 *   280  o bico chega ao chão: o grão some, saem farelos e "nhac!"
 *   440  a cabeça volta a inclinar
 *   560  o pombo fica em pé de novo
 * Cada grão tem a sua linha do tempo: toques rápidos não esperam os anteriores.
 */
export const GRAIN_TIMELINE: readonly [GrainPhase, number][] = [
  ['tilt', 160],
  ['reach', 280],
  ['back', 440],
]
export const GRAIN_LIFETIME_MS = 560
const EFFECT_MS = 520
const HEARTS_MS = 900
/** Por quanto tempo o grupo principal fica assustado quando a invasão chega. */
export const INVASION_SHOCK_MS = 1600

/**
 * Módulo 3. Cada toque em "Jogar grãozinho" soma 1 grão, faz um pombo bicar
 * e, em certos números, chama mais pombos, até a invasão. Nada é salvo.
 */
export default function FeedPage() {
  const mod = getModule('alimentar')
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  const [grains, setGrains] = useState(0)
  const [message, setMessage] = useState(FEED_STAGES[0].message)
  const [announcement, setAnnouncement] = useState('')
  const [flying, setFlying] = useState<FlyingGrain[]>([])
  const [effects, setEffects] = useState<ArenaEffect[]>([])
  const [invasionRound, setInvasionRound] = useState(0)
  const [shocked, setShocked] = useState(false)

  // fonte da verdade do contador: toques muito rápidos (antes de a tela
  // atualizar) não podem ler um valor velho e "perder" grãos
  const grainsRef = useRef(0)
  const flyingRef = useRef<FlyingGrain[]>([])
  const lastInvasionMessage = useRef<number | null>(null)
  const nextId = useRef(0)

  // AUD-004-01: todo temporizador passa por aqui, e "Recomeçar" cancela todos.
  const timers = useRef(new Set<number>())
  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }
  const cancelAllTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current.clear()
  }

  useEffect(() => cancelAllTimers, [])

  const updateFlying = (fn: (list: FlyingGrain[]) => FlyingGrain[]) => {
    flyingRef.current = fn(flyingRef.current)
    setFlying(flyingRef.current)
  }

  const addEffect = (effect: Omit<ArenaEffect, 'id'>, ms: number) => {
    const id = nextId.current++
    // corações: só a reação mais recente fica na tela (toques rápidos não empilham)
    setEffects((list) => [...(effect.kind === 'hearts' ? list.filter((e) => e.kind !== 'hearts') : list), { ...effect, id }])
    schedule(() => setEffects((list) => list.filter((e) => e.id !== id)), ms)
  }

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
      setAnnouncement(announcementFor('invasion', after, INVASION_MESSAGES[index]))
      setInvasionRound((r) => r + 1)
      setEffects((list) => list.filter((e) => e.kind !== 'hearts')) // a faixa da invasão é a reação agora
      setShocked(true)
      schedule(() => setShocked(false), INVASION_SHOCK_MS)
    } else if (event === 'stage') {
      const stage = stageFor(after)
      setMessage(stage.message)
      setAnnouncement(announcementFor('stage', after, stage.message))
      const added = pigeonsFor(after).length - pigeonsFor(before).length
      if (added > 0) addEffect({ kind: 'hearts', pigeonIndex: pigeonsFor(after).length - 1, added }, HEARTS_MS)
    } else if (after === INVASION_AT + 5) {
      setMessage(AFTER_INVASION_MESSAGE)
    }

    // o grão cai na frente do bico de um pombo bem visível e livre
    const present = pigeonsFor(after)
    const busy = new Set(flyingRef.current.map((g) => g.pigeonIndex))
    const pigeonIndex = pickTarget(present, busy)
    const id = nextId.current++
    updateFlying((list) => [...list, { id, pigeonIndex, phase: 'fall' }])

    for (const [phase, at] of GRAIN_TIMELINE) {
      schedule(() => updateFlying((list) => list.map((g) => (g.id === id ? { ...g, phase } : g))), at)
    }
    schedule(() => addEffect({ kind: 'nhac', pigeonIndex }, EFFECT_MS), GRAIN_TIMELINE[1][1])
    schedule(() => updateFlying((list) => list.filter((g) => g.id !== id)), GRAIN_LIFETIME_MS)
  }

  const reset = () => {
    if (grainsRef.current === 0) return
    cancelAllTimers()
    grainsRef.current = 0
    setGrains(0)
    updateFlying(() => [])
    setEffects([])
    setShocked(false)
    setMessage(RESET_MESSAGE)
    setAnnouncement(`${RESET_MESSAGE} 1 pombo reunido.`)
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

        {/* key: o balão "treme" de novo a cada invasão */}
        <div className={`feed__dialog ${shocked ? 'feed__dialog--shocked' : ''}`} key={`dialog-${invasionRound}`}>
          <div className="feed__bubble px-box">
            <span className="feed__speaker" aria-hidden="true">
              Pombo-sama
            </span>
            <GuardianPortrait surprised={shocked} />
            <p className="feed__message">{message}</p>
          </div>
        </div>

        <FeedArena
          pigeons={pigeons}
          flying={flying}
          effects={effects}
          invaded={invaded}
          invasionRound={invasionRound}
          shocked={shocked}
        />

        <div className="feed__hud">
          <dl className="feed__stats">
            <div className="feed__stat px-box">
              <dt>Grãos oferecidos</dt>
              <dd data-testid="grain-count">{grains}</dd>
            </div>
            <div className="feed__stat px-box">
              <dt>Pombos reunidos</dt>
              <dd data-testid="pigeon-count">{pigeons.length}</dd>
            </div>
          </dl>
          <button
            type="button"
            className={`btn feed__reset ${invaded ? 'feed__reset--highlight' : ''}`}
            onClick={reset}
            aria-disabled={grains === 0 || undefined}
          >
            <span aria-hidden="true" className="feed__reset-icon">
              ↺
            </span>
            Recomeçar
          </button>
        </div>

        <button type="button" className="btn btn--primary feed__throw" onClick={feed}>
          ▶ Jogar grãozinho
        </button>

        {/* AUD-004-03: um único anúncio, só quando algo importante muda */}
        <p className="visually-hidden" role="status" aria-atomic="true">
          {announcement}
        </p>
      </main>
      <BottomNav current="alimentar" />
    </div>
  )
}
