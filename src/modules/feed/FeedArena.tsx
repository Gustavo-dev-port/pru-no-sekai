import type { CSSProperties } from 'react'
import { Pigeon, type PigeonPose } from '../../components/Pigeon'
import { PixelCanvas } from '../../components/PixelCanvas'
import { MAIN_SLOTS, type PigeonSlot } from '../../data/feedGame'
import { drawPlaza } from '../../pixel/plaza'
import { PixelSprite } from '../../pixel/PixelSprite'
import { GRAIN, HEART, PETAL } from '../../pixel/sprites/props'

export type GrainPhase = 'fall' | 'tilt' | 'reach' | 'back'

export interface FlyingGrain {
  id: number
  /** Índice do pombo que vai bicar este grão. */
  pigeonIndex: number
  phase: GrainPhase
}

export interface ArenaEffect {
  id: number
  kind: 'nhac' | 'hearts'
  pigeonIndex: number
  /** Quantos pombos chegaram (reação de nova etapa). */
  added?: number
}

interface FeedArenaProps {
  pigeons: readonly PigeonSlot[]
  flying: readonly FlyingGrain[]
  effects: readonly ArenaEffect[]
  invaded: boolean
  /** Muda a cada invasão, para a faixa "INVASÃO!" animar de novo. */
  invasionRound: number
  /** O grupo principal acabou de ver a invasão chegar. */
  shocked: boolean
}

const MAIN_GROUP_SIZE = MAIN_SLOTS.length
/** Intervalo entre a chegada de cada invasor (igual ao atraso no CSS). */
const INVADER_STAGGER_MS = 90

/** Posição de um pombo como variáveis CSS (ver .feed-spot em Feed.css). */
function spotStyle(slot: PigeonSlot, extra?: CSSProperties): CSSProperties {
  return { '--x': `${slot.x}%`, top: `${slot.y}%`, ...extra } as CSSProperties
}

/** O grão é bicado em "reach"; antes disso a cabeça só se inclina. */
function poseFor(index: number, flying: readonly FlyingGrain[]): PigeonPose {
  let pose: PigeonPose = 'stand'
  for (const g of flying) {
    if (g.pigeonIndex !== index) continue
    if (g.phase === 'reach') return 'reach'
    if (g.phase === 'tilt' || g.phase === 'back') pose = 'tilt'
  }
  return pose
}

/**
 * A Praça dos Pombos. É decorativa (aria-hidden): o estado do jogo é dito
 * em texto pelo balão do Pombo-sama, pelos contadores e pelo anúncio.
 */
export function FeedArena({ pigeons, flying, effects, invaded, invasionRound, shocked }: FeedArenaProps) {
  return (
    <div className={`feed-arena px-box ${invaded ? 'feed-arena--invaded' : ''}`} aria-hidden="true">
      <PixelCanvas draw={drawPlaza} className="feed-arena__scene" />

      <div className="feed-arena__sign">
        <span lang="ja">鳩の広場</span>
        <span className="feed-arena__sign-sub">praça dos pombos</span>
      </div>

      {[0, 1, 2].map((i) => (
        <span key={`petal-${i}`} className={`feed-arena__petal feed-arena__petal--${i}`}>
          <PixelSprite width={PETAL.width} height={PETAL.height} layers={[{ grid: PETAL.grid }]} />
        </span>
      ))}

      {pigeons.map((slot, i) => {
        const invader = i >= MAIN_GROUP_SIZE
        const delay = invader ? (i - MAIN_GROUP_SIZE) * INVADER_STAGGER_MS : 0
        const scared = shocked && !invader
        return (
          <div
            key={i}
            className={`feed-spot feed-pigeon ${slot.flip ? 'is-flipped' : ''} ${invader ? 'feed-pigeon--invader' : ''}`}
            style={spotStyle(slot, { zIndex: Math.round(slot.y) * 2, animationDelay: `${delay}ms` })}
          >
            <Pigeon
              variant={slot.variant}
              flip={slot.flip}
              pose={poseFor(i, flying)}
              expression={scared ? 'surpreso' : (slot.expression ?? 'normal')}
              exclaim={scared}
              phase={i * 3}
              animated={!invader}
              flapOnMountMs={i === 0 ? null : delay}
            />
          </div>
        )
      })}

      {flying
        .filter((g) => g.phase === 'fall' || g.phase === 'tilt')
        .map((g) => {
          const slot = pigeons[g.pigeonIndex]
          return (
            <span
              key={g.id}
              className={`feed-spot feed-grain ${slot.flip ? 'is-flipped' : ''}`}
              style={spotStyle(slot, { zIndex: Math.round(slot.y) * 2 + 1 })}
            >
              <PixelSprite width={GRAIN.width} height={GRAIN.height} layers={[{ grid: GRAIN.grid }]} />
            </span>
          )
        })}

      {effects.map((e) => {
        const slot = pigeons[e.pigeonIndex]
        if (!slot) return null
        if (e.kind === 'nhac') {
          return (
            <span key={e.id} className={`feed-spot feed-nhac ${slot.flip ? 'is-flipped' : ''}`} style={spotStyle(slot)}>
              <span className="feed-nhac__crumb feed-nhac__crumb--1" />
              <span className="feed-nhac__crumb feed-nhac__crumb--2" />
              <span className="feed-nhac__crumb feed-nhac__crumb--3" />
              <span className="feed-nhac__crumb feed-nhac__crumb--4" />
              <span className="feed-nhac__text">nhac!</span>
            </span>
          )
        }
        return (
          <span key={e.id} className="feed-spot feed-hearts" style={spotStyle(slot)}>
            {[0, 1, 2].map((h) => (
              <span key={h} className={`feed-hearts__heart feed-hearts__heart--${h}`}>
                <PixelSprite width={HEART.width} height={HEART.height} layers={[{ grid: HEART.grid }]} />
              </span>
            ))}
            <span className="feed-hearts__label">+{e.added ?? 1} pombo{(e.added ?? 1) > 1 ? 's' : ''}!</span>
          </span>
        )
      })}

      {invaded && (
        <div key={invasionRound} className="feed-arena__banner">
          <span className="feed-arena__banner-title">INVASÃO!</span>
          <span className="feed-arena__banner-sub">{pigeons.length} pombos!</span>
        </div>
      )}
    </div>
  )
}
