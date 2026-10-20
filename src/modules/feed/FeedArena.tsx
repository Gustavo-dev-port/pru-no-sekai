import { Pigeon } from '../../components/Pigeon'
import type { PigeonSlot } from '../../data/feedGame'
import { PIXEL_COLORS } from '../../pixel/palette'
import { PixelSprite } from '../../pixel/PixelSprite'
import { GRAIN, LANTERN } from '../../pixel/sprites/props'

export interface FlyingGrain {
  id: number
  /** Índice do pombo que vai bicar este grão. */
  pigeonIndex: number
  /** Posição do pombo alvo; o grão cai na frente do bico dele. */
  x: number
  y: number
  flip: boolean
}

/** Distância do centro do pombo até a ponta do bico: 10 pixels do sprite. */
const BEAK_OFFSET = 'calc(var(--px) * 10)'

interface FeedArenaProps {
  pigeons: readonly PigeonSlot[]
  flying: readonly FlyingGrain[]
  invaded: boolean
  /** Muda a cada invasão, para a faixa "INVASÃO!" animar de novo. */
  invasionRound: number
}

const MAIN_GROUP_SIZE = 8
const PINK_LANTERN = { r: PIXEL_COLORS.sakuraMid, R: PIXEL_COLORS.sakuraDark }

/**
 * A pracinha dos pombos. É decorativa (aria-hidden): o estado do jogo é dito
 * em texto pelo balão do Pombo-sama e pelos contadores.
 */
export function FeedArena({ pigeons, flying, invaded, invasionRound }: FeedArenaProps) {
  const pecking = new Set(flying.map((g) => g.pigeonIndex))

  return (
    <div className={`feed-arena px-box ${invaded ? 'feed-arena--invaded' : ''}`} aria-hidden="true">
      <div className="feed-arena__sign">
        <span lang="ja">鳩の広場</span>
        <span className="feed-arena__sign-sub">praça dos pombos</span>
      </div>
      <span className="feed-arena__lantern feed-arena__lantern--left">
        <PixelSprite width={LANTERN.width} height={LANTERN.height} layers={[{ grid: LANTERN.grid }]} />
      </span>
      <span className="feed-arena__lantern feed-arena__lantern--right">
        <PixelSprite width={LANTERN.width} height={LANTERN.height} layers={[{ grid: LANTERN.grid }]} recolor={PINK_LANTERN} />
      </span>

      {pigeons.map((slot, i) => {
        const invader = i >= MAIN_GROUP_SIZE
        return (
          <div
            key={i}
            className={`feed-pigeon ${invader ? 'feed-pigeon--invader' : ''}`}
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              zIndex: Math.round(slot.y),
              animationDelay: invader ? `${(i - MAIN_GROUP_SIZE) * 70}ms` : undefined,
            }}
          >
            <Pigeon variant={slot.variant} flip={slot.flip} pecking={pecking.has(i)} phase={i * 3} animated={!invader} />
          </div>
        )
      })}

      {flying.map((g) => (
        <span
          key={g.id}
          className="feed-grain"
          style={{ left: `calc(${g.x}% ${g.flip ? '+' : '-'} ${BEAK_OFFSET})`, top: `${g.y}%` }}
        >
          <PixelSprite width={GRAIN.width} height={GRAIN.height} layers={[{ grid: GRAIN.grid }]} />
        </span>
      ))}

      {invaded && (
        <p key={invasionRound} className="feed-arena__banner">
          INVASÃO!
        </p>
      )}
    </div>
  )
}
