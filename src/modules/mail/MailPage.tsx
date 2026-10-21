import { useEffect, useRef, useState } from 'react'
import { BottomNav } from '../../components/BottomNav'
import { Pigeon } from '../../components/Pigeon'
import {
  CARRIER_LINES,
  FINAL_LETTER_ID,
  LOVE_LETTERS,
  RARITY_LABEL,
  UNLOCK_HINTS,
  type LetterRarity,
} from '../../data/loveLetters'
import { getModule } from '../../data/modules'
import { useFocusOnMount } from '../../hooks/useFocusOnMount'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useRotatingMessage } from '../../hooks/useRotatingMessage'
import { markOpened, markSeen, recordPoke, useProgress } from '../../lib/progress'
import { PixelSprite } from '../../pixel/PixelSprite'
import { POSTBOX } from '../../pixel/sprites/mail'
import { KingDelivery } from './KingDelivery'
import { LetterCard, type LetterState } from './LetterCard'
import { LetterDialog } from './LetterDialog'
import { conditionProgress, letterById, newlyUnlocked, ruleFor, unlockedIds } from './unlocks'
import './Mail.css'

type Filter = 'todas' | LetterRarity

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'comum', label: 'Comuns' },
  { id: 'rara', label: 'Raras' },
  { id: 'lendaria', label: 'Lendárias' },
]

/** Quanto dura a chegada do pombo-carteiro com cartas novas. */
export const DELIVERY_MS = 1100

const CARRIER_GREETING = 'Pru-pru! Sou o pombo-carteiro. Me cutuque se quiser conversar.'

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/**
 * Módulo 4. Álbum de cartinhas colecionáveis. Cartas novas chegam pelo
 * pombo-carteiro; a carta final é entregue pelo Rei Pombo.
 */
export default function MailPage() {
  const mod = getModule('correio')
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const reducedMotion = usePrefersReducedMotion()
  const progress = useProgress()
  const carrier = useRotatingMessage(CARRIER_LINES, CARRIER_GREETING)

  const [filter, setFilter] = useState<Filter>('todas')
  const [openLetterId, setOpenLetterId] = useState<number | null>(null)
  const [kingOpen, setKingOpen] = useState(false)
  const [delivery, setDelivery] = useState<{ ids: number[]; round: number } | null>(null)
  const [highlight, setHighlight] = useState<Set<number>>(new Set())
  const [announcement, setAnnouncement] = useState('')
  const deliveryRound = useRef(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const unlocked = unlockedIds(progress)
  const unlockedSet = new Set(unlocked)

  // Entrega: quando há cartas desbloqueadas que ainda não apareceram no
  // álbum (e nenhuma janela aberta), o carteiro chega trazendo-as. A carta
  // final fica para o Rei Pombo, depois das outras.
  useEffect(() => {
    if (openLetterId !== null || kingOpen || delivery) return
    const fresh = newlyUnlocked(progress)
    if (fresh.length === 0) return

    const normal = fresh.filter((id) => id !== FINAL_LETTER_ID)
    if (normal.length === 0) {
      setKingOpen(true)
      setAnnouncement('O Rei Pombo chegou com a carta mais importante do reino.')
      return
    }

    deliveryRound.current++
    setDelivery({ ids: normal, round: deliveryRound.current })
    setHighlight((prev) => new Set([...prev, ...normal]))
    const titles = normal.map((id) => letterById(id).title).join(', ')
    setAnnouncement(
      `O pombo-carteiro trouxe ${normal.length} ${plural(normal.length, 'carta nova', 'cartas novas')}: ${titles}.`,
    )
    timer.current = window.setTimeout(
      () => {
        markSeen(normal)
        setDelivery(null)
      },
      reducedMotion ? 0 : DELIVERY_MS,
    )
  }, [progress, openLetterId, kingOpen, delivery, reducedMotion])

  const openLetter = (id: number) => {
    markOpened(id)
    setHighlight((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setOpenLetterId(id)
  }

  const receiveFromKing = () => {
    markSeen([FINAL_LETTER_ID])
    setKingOpen(false)
    openLetter(FINAL_LETTER_ID)
  }

  const dismissKing = () => {
    markSeen([FINAL_LETTER_ID])
    setHighlight((prev) => new Set([...prev, FINAL_LETTER_ID]))
    setKingOpen(false)
  }

  const pokeCarrier = () => {
    recordPoke()
    carrier.next()
  }

  const stateOf = (id: number): LetterState =>
    !unlockedSet.has(id) ? 'locked' : progress.opened.includes(id) ? 'opened' : 'discovered'

  const hintFor = (id: number) => {
    const { condition } = ruleFor(id)
    const { current, target } = conditionProgress(condition, progress, unlocked.filter((u) => u !== FINAL_LETTER_ID).length)
    const text = UNLOCK_HINTS[condition] ?? 'Continue explorando.'
    return target > 1 ? `${text} (${current}/${target})` : text
  }

  const visible = LOVE_LETTERS.filter((l) => filter === 'todas' || l.rarity === filter)
  const found = unlocked.length
  const read = progress.opened.length
  const delivering = delivery !== null
  const bubble = delivering
    ? `Entrega! Trouxe ${delivery.ids.length} ${plural(delivery.ids.length, 'cartinha nova', 'cartinhas novas')} para você.`
    : carrier.message

  const openLetterData = openLetterId !== null ? letterById(openLetterId) : null

  return (
    <div className="mail-page">
      <main className="mail" inert={openLetterData !== null || kingOpen}>
        <header className="mail__header">
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

        {/* agência do correio: caixa vermelha + pombo-carteiro */}
        <section className="post-office px-box" aria-label="Agência do correio">
          <div className="post-office__bubble">
            <span className="post-office__speaker" aria-hidden="true">
              Pombo-carteiro
            </span>
            <p key={delivering ? `d${delivery.round}` : carrier.count} className="post-office__text">
              {bubble}
            </p>
          </div>
          <div className="post-office__scene">
            <span className="post-office__postbox" aria-hidden="true">
              <PixelSprite width={POSTBOX.width} height={POSTBOX.height} layers={[{ grid: POSTBOX.grid }]} />
            </span>
            <button
              type="button"
              className={`post-office__carrier ${delivering ? 'post-office__carrier--arriving' : ''}`}
              onClick={pokeCarrier}
              aria-label="Cutucar o pombo-carteiro"
            >
              <Pigeon
                key={delivering ? `fly-${delivery.round}` : 'idle'}
                hat="mail"
                pokeCount={carrier.count}
                flapOnMountMs={delivering ? 0 : null}
              />
            </button>
          </div>
        </section>

        <section className="album" aria-labelledby="album-title">
          <div className="album__top">
            <h2 id="album-title" className="album__title">
              Álbum de cartinhas
            </h2>
            <p className="album__count" data-testid="album-count">
              <strong>{found}</strong> / {LOVE_LETTERS.length} cartas encontradas
              <span className="album__read"> · {read} lidas</span>
            </p>
          </div>

          <div className="album__filters" role="group" aria-label="Filtrar por raridade">
            {FILTERS.map((f) => {
              const total = LOVE_LETTERS.filter((l) => f.id === 'todas' || l.rarity === f.id)
              const have = total.filter((l) => unlockedSet.has(l.id)).length
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`album__filter album__filter--${f.id}`}
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}{' '}
                  <span className="album__filter-count">
                    {have}/{total.length}
                  </span>
                </button>
              )
            })}
          </div>

          <ul className="album__grid">
            {visible.map((letter) => (
              <li key={letter.id} className="album__item">
                <LetterCard
                  letter={letter}
                  state={stateOf(letter.id)}
                  isNew={highlight.has(letter.id) && !progress.opened.includes(letter.id)}
                  hint={hintFor(letter.id)}
                  onOpen={openLetter}
                />
              </li>
            ))}
          </ul>
          <p className="album__legend">
            Lacres: <span className="rarity-seal rarity-seal--comum">{RARITY_LABEL.comum}</span>{' '}
            <span className="rarity-seal rarity-seal--rara">{RARITY_LABEL.rara}</span>{' '}
            <span className="rarity-seal rarity-seal--lendaria">{RARITY_LABEL.lendaria}</span>
          </p>
        </section>
      </main>

      {/* fora do <main>: continua anunciando mesmo com uma janela aberta */}
      <p className="visually-hidden" role="status" aria-atomic="true">
        {announcement}
      </p>

      {openLetterData && <LetterDialog key={openLetterData.id} letter={openLetterData} onClose={() => setOpenLetterId(null)} />}
      {kingOpen && <KingDelivery onReceive={receiveFromKing} onClose={dismissKing} />}

      <BottomNav current="correio" />
    </div>
  )
}
