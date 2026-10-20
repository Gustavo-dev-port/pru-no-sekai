import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { hasEnteredSanctuary, setEnteredSanctuary } from '../../lib/session'
import { Courtyard } from './Courtyard'
import { Gate } from './Gate'
import './Sanctuary.css'

type Phase = 'gate' | 'entering' | 'inside'

/** Precisa bater com a duração da transição em Sanctuary.css (.gate--entering). */
const ENTER_DURATION_MS = 1300

/**
 * Módulo 1. Fluxo: portão (gate) → animação de travessia (entering) → pátio (inside).
 * Quem já entrou nesta aba volta direto ao pátio ao sair de outro módulo.
 */
export default function SanctuaryPage() {
  const reducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState<Phase>(() => (hasEnteredSanctuary() ? 'inside' : 'gate'))
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const enter = () => {
    setEnteredSanctuary(true)
    if (reducedMotion) {
      setPhase('inside')
      return
    }
    setPhase('entering')
    timer.current = window.setTimeout(() => setPhase('inside'), ENTER_DURATION_MS)
  }

  const backToGate = () => {
    setEnteredSanctuary(false)
    setPhase('gate')
  }

  if (phase === 'inside') return <Courtyard onBackToGate={backToGate} />
  return <Gate entering={phase === 'entering'} onEnter={enter} />
}
