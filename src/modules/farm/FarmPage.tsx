import { useEffect, useRef, useState } from 'react'
import { BottomNav } from '../../components/BottomNav'
import { PixelCanvas } from '../../components/PixelCanvas'
import { CROP_ORDER, CROPS, FREE_POUCH, type CropId } from '../../data/crops'
import { getModule } from '../../data/modules'
import { growthOf, pouchReadyIn } from '../../economy/farm'
import { finishTutorial, getEconomy, harvestAt, plantAt, takeFreePouch, useEconomy } from '../../economy/store'
import { useFocusOnMount } from '../../hooks/useFocusOnMount'
import { useSaveStatus } from '../../lib/save'
import { farmErrorMessage, formatDuration } from './farmText'
import { drawFarm } from '../../pixel/farmScene'
import { PixelSprite } from '../../pixel/PixelSprite'
import { CROP_ICONS, SEED_POUCH } from '../../pixel/sprites/farm'
import { GuardianPortrait } from '../feed/GuardianPortrait'
import { FarmTutorial } from './FarmTutorial'
import { PlotButton } from './PlotButton'
import './Farm.css'

const HARVEST_POP_MS = 900

/** Relógio da tela: atualiza a cada segundo (contagem regressiva e estágios). */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function CropIcon({ crop, scale = 3 }: { crop: CropId; scale?: number }) {
  return <PixelSprite width={8} height={8} layers={[{ grid: CROP_ICONS[crop] }]} scale={scale} />
}

/**
 * Módulo 5 — Fazendinha. Escolha uma semente, toque num canteiro vazio para
 * plantar, volte quando estiver pronto e toque para colher. O crescimento é
 * calculado pelo horário real, então continua com o site fechado.
 */
export default function FarmPage() {
  const mod = getModule('fazenda')
  const economy = useEconomy()
  // na primeira visita o tutorial abre junto: o foco fica nele, não no título
  const headingRef = useFocusOnMount<HTMLHeadingElement>(economy.tutorialDone)
  const now = useNow()

  const [selected, setSelected] = useState<CropId>('milho')
  const [message, setMessage] = useState('Bem-vinda à fazendinha! Escolha uma semente e toque num canteiro vazio.')
  const [announcement, setAnnouncement] = useState('')
  const [pops, setPops] = useState<{ id: number; plot: number; text: string }[]>([])
  const [helpOpen, setHelpOpen] = useState(false)
  const popId = useRef(0)
  const timers = useRef(new Set<number>())
  const readyBefore = useRef<Set<number> | null>(null)
  // uma ação de cada vez nesta aba (as outras abas esperam pelo Web Lock)
  const busy = useRef(false)
  const [working, setWorking] = useState(false)
  const readOnly = useSaveStatus() === 'future-version'

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const say = (text: string) => {
    setMessage(text)
    setAnnouncement(text)
  }

  // avisa (uma vez) quando uma plantação fica pronta com a tela aberta
  const readyNow = new Set(economy.plots.flatMap((p, i) => (p && growthOf(p, now).ready ? [i] : [])))
  useEffect(() => {
    const before = readyBefore.current
    readyBefore.current = readyNow
    if (!before) return
    const fresh = [...readyNow].filter((i) => !before.has(i))
    if (fresh.length === 0) return
    const names = fresh.map((i) => `${CROPS[economy.plots[i]!.crop].name} no canteiro ${i + 1}`).join(', ')
    setAnnouncement(`Pronto para colher: ${names}.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [[...readyNow].join(',')])

  const pop = (plot: number, text: string) => {
    const id = popId.current++
    setPops((list) => [...list, { id, plot, text }])
    const t = window.setTimeout(() => {
      setPops((list) => list.filter((p) => p.id !== id))
      timers.current.delete(t)
    }, HARVEST_POP_MS)
    timers.current.add(t)
  }

  /** Roda uma ação econômica; toques durante a espera são ignorados. */
  const guarded = async (work: () => Promise<void>) => {
    if (busy.current) return
    busy.current = true
    setWorking(true)
    try {
      await work()
    } finally {
      busy.current = false
      setWorking(false)
    }
  }

  const onPlot = (index: number) =>
    guarded(async () => {
      if (!economy.plots[index]) {
        const result = await plantAt(index, selected)
        if (!result.ok) return say(farmErrorMessage(result.error, selected))
        const crop = CROPS[selected]
        return say(`Plantou ${crop.name.toLowerCase()} no canteiro ${index + 1}. Fica pronto em ${formatDuration(crop.growMs)}.`)
      }
      const result = await harvestAt(index)
      if (!result.ok) {
        // o estado mais recente diz o que há no canteiro agora
        const current = getEconomy().plots[index]
        const crop = current?.crop ?? economy.plots[index]?.crop ?? selected
        const wait = current ? growthOf(current, Date.now()).remainingMs : 0
        return say(farmErrorMessage(result.error, crop, wait))
      }
      // o que foi colhido de fato: o canteiro como estava dentro da operação protegida
      const crop = CROPS[result.before.plots[index]!.crop]
      pop(index, `+${crop.yield}`)
      say(`Colheu ${crop.yield} de ${crop.foodName}! A plantinha devolveu 1 semente de ${crop.name.toLowerCase()}.`)
    })

  const pouchWait = pouchReadyIn(economy, now)
  const onPouch = () =>
    guarded(async () => {
      const result = await takeFreePouch()
      if (!result.ok) return say(farmErrorMessage(result.error, selected, pouchReadyIn(getEconomy(), Date.now())))
      const gifts = CROP_ORDER.map((c) => `+${FREE_POUCH.seeds[c]} ${CROPS[c].name.toLowerCase()}`).join(', ')
      say(`O Pombo-sama deixou um saquinho de sementes: ${gifts}.`)
    })

  const showTutorial = !economy.tutorialDone || helpOpen
  const closeTutorial = () => {
    const firstVisit = !economy.tutorialDone
    finishTutorial()
    setHelpOpen(false)
    // primeira visita: ninguém abriu o tutorial, então o foco vai para o título
    if (firstVisit) window.setTimeout(() => headingRef.current?.focus(), 0)
  }

  return (
    <div className="farm-page">
      <main className="farm" inert={showTutorial}>
        <header className="farm__header">
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

        {readOnly && (
          <p className="farm__readonly px-box" role="note">
            Este progresso foi salvo por uma versão mais nova do Pru no Sekai. Para não estragar nada, a fazendinha está
            só para olhar por aqui.
          </p>
        )}

        <div className="farm__dialog px-box">
          <span className="farm__speaker" aria-hidden="true">
            Pombo-sama
          </span>
          <GuardianPortrait surprised={false} />
          <p className="farm__message">{message}</p>
        </div>

        {/* Escolha da semente */}
        <div className="seed-picker" role="group" aria-label="Semente para plantar">
          {CROP_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              className="seed-picker__option"
              aria-pressed={selected === c}
              onClick={() => setSelected(c)}
            >
              <CropIcon crop={c} />
              <span className="seed-picker__name">{CROPS[c].name}</span>
              <span className="seed-picker__info">
                {economy.seeds[c]} · {formatDuration(CROPS[c].growMs)}
              </span>
            </button>
          ))}
        </div>

        {/* Canteiros */}
        <section className="farm-field px-box" aria-label="Canteiros" aria-busy={working}>
          <PixelCanvas draw={drawFarm} className="farm-field__scene" />
          <ul className="farm-field__plots">
            {economy.plots.map((plot, i) => (
              <li key={i} className="farm-field__item">
                <PlotButton
                  index={i}
                  plot={plot}
                  growth={plot ? growthOf(plot, now) : null}
                  selected={selected}
                  hasSeeds={economy.seeds[selected] > 0}
                  onActivate={onPlot}
                />
                {pops
                  .filter((p) => p.plot === i)
                  .map((p) => (
                    <span key={p.id} className="farm-field__pop" aria-hidden="true">
                      {p.text}
                    </span>
                  ))}
              </li>
            ))}
          </ul>
        </section>

        <div className="farm__actions">
          <button type="button" className="btn farm__pouch" onClick={onPouch} aria-disabled={pouchWait > 0 || undefined}>
            <PixelSprite width={8} height={8} layers={[{ grid: SEED_POUCH }]} scale={3} />
            {pouchWait > 0 ? `Saquinho grátis em ${formatDuration(pouchWait)}` : 'Pegar saquinho grátis'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setHelpOpen(true)}>
            ? Como jogar
          </button>
        </div>
        {/* Estoque */}
        <section className="farm-stock px-box" aria-labelledby="stock-title">
          <h2 id="stock-title" className="farm-stock__title">
            Estoque
          </h2>
          <table className="farm-stock__table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">Planta</span>
                </th>
                <th scope="col">Sementes</th>
                <th scope="col">Alimentos</th>
              </tr>
            </thead>
            <tbody>
              {CROP_ORDER.map((c) => (
                <tr key={c}>
                  <th scope="row">
                    <span className="farm-stock__crop">
                      <CropIcon crop={c} />
                      {CROPS[c].name}
                    </span>
                  </th>
                  <td data-testid={`seeds-${c}`}>{economy.seeds[c]}</td>
                  <td data-testid={`food-${c}`}>{economy.food[c]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </main>

      <p className="visually-hidden" role="status" aria-atomic="true">
        {announcement}
      </p>

      {showTutorial && <FarmTutorial onClose={closeTutorial} />}
      <BottomNav current="fazenda" />
    </div>
  )
}
