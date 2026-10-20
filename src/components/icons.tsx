// Ícones dos módulos, desenhados no mesmo traço "grosso" da interface.
import type { JSX } from 'react'
import type { FortuneIcon } from '../data/fortunes'
import type { ModuleId } from '../data/modules'

const stroke = {
  stroke: 'var(--ink)',
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

function ToriiIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M5 11 Q24 16 43 11 L44 6 Q24 11 4 6 Z" fill="var(--lacquer)" {...stroke} strokeWidth={2} />
      <rect x="9" y="19" width="30" height="5" fill="var(--torii)" {...stroke} strokeWidth={2} />
      <rect x="12" y="12" width="6" height="32" fill="var(--torii)" {...stroke} strokeWidth={2} />
      <rect x="30" y="12" width="6" height="32" fill="var(--torii)" {...stroke} strokeWidth={2} />
    </svg>
  )
}

function OmikujiIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M30 4 L34 6 L27 20" fill="none" {...stroke} />
      <path d="M14 16 L34 16 L36 42 L12 42 Z" fill="var(--torii)" {...stroke} />
      <rect x="19" y="22" width="10" height="14" rx="1" fill="var(--cream-50)" {...stroke} strokeWidth={2} />
      <path d="M24 25 L24 33" {...stroke} strokeWidth={2} />
    </svg>
  )
}

function GrainIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M6 24 L42 24 Q40 40 24 40 Q8 40 6 24 Z" fill="var(--sage-300)" {...stroke} />
      <g fill="var(--gold)" {...stroke} strokeWidth={2}>
        <ellipse cx="16" cy="19" rx="3.5" ry="2.5" />
        <ellipse cx="24" cy="16" rx="3.5" ry="2.5" />
        <ellipse cx="32" cy="19" rx="3.5" ry="2.5" />
        <ellipse cx="22" cy="8" rx="3" ry="2.2" />
        <ellipse cx="30" cy="10" rx="3" ry="2.2" />
      </g>
    </svg>
  )
}

function LetterIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="5" y="11" width="38" height="28" rx="3" fill="var(--cream-50)" {...stroke} />
      <path d="M6 13 L24 27 L42 13" fill="none" {...stroke} />
      <path
        d="M24 36 C17 31 18 26 21.5 26 C23 26 24 27.5 24 27.5 C24 27.5 25 26 26.5 26 C30 26 31 31 24 36 Z"
        fill="var(--sakura-500)"
        {...stroke}
        strokeWidth={2}
      />
    </svg>
  )
}

export function ModuleIcon({ id }: { id: ModuleId }) {
  switch (id) {
    case 'santuario':
      return <ToriiIcon />
    case 'oraculo':
      return <OmikujiIcon />
    case 'alimentar':
      return <GrainIcon />
    case 'correio':
      return <LetterIcon />
  }
}

const FORTUNE_ICON_PATHS: Record<FortuneIcon, JSX.Element> = {
  heart: (
    <path
      d="M24 40 C10 30 6 22 10 15 C14 9 21 10 24 16 C27 10 34 9 38 15 C42 22 38 30 24 40 Z"
      fill="var(--sakura-300)"
      {...stroke}
    />
  ),
  sun: (
    <g {...stroke}>
      <circle cx="24" cy="24" r="9" fill="var(--lantern-glow)" />
      <path d="M24 5 V10 M24 38 V43 M5 24 H10 M38 24 H43 M10.5 10.5 L14 14 M34 34 L37.5 37.5 M10.5 37.5 L14 34 M34 14 L37.5 10.5" fill="none" />
    </g>
  ),
  bird: (
    <g {...stroke}>
      <path d="M8 30 Q10 16 24 16 Q34 16 38 24 L44 22 L40 30 Q36 40 22 38 Q10 38 8 30 Z" fill="var(--pigeon-300)" />
      <path d="M18 26 Q24 22 30 28" fill="none" />
      <circle cx="16" cy="22" r="1.5" fill="var(--ink)" />
    </g>
  ),
  flower: (
    <g {...stroke} strokeWidth={2.5}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="24" cy="13" rx="6" ry="9" fill="var(--sakura-200)" transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="4" fill="var(--gold)" />
    </g>
  ),
  palette: (
    <g {...stroke}>
      <path d="M24 6 C12 6 5 15 6 24 C7 34 15 42 24 42 C28 42 29 38 27 35 C25 32 27 29 31 29 L36 29 C40 29 43 26 42 21 C40 12 33 6 24 6 Z" fill="var(--cream-100)" />
      <circle cx="16" cy="20" r="3" fill="var(--sakura-500)" strokeWidth={2} />
      <circle cx="24" cy="14" r="3" fill="var(--gold)" strokeWidth={2} />
      <circle cx="33" cy="17" r="3" fill="var(--sage-500)" strokeWidth={2} />
      <circle cx="15" cy="31" r="3" fill="#7fa6d6" strokeWidth={2} />
    </g>
  ),
  sparkles: (
    <g {...stroke} strokeWidth={2.5} fill="var(--lantern-glow)">
      <path d="M20 6 L23 17 L34 20 L23 23 L20 34 L17 23 L6 20 L17 17 Z" />
      <path d="M36 28 L37.5 33.5 L43 35 L37.5 36.5 L36 42 L34.5 36.5 L29 35 L34.5 33.5 Z" fill="var(--sakura-200)" />
    </g>
  ),
}

export function FortuneIconSvg({ icon }: { icon: FortuneIcon }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {FORTUNE_ICON_PATHS[icon]}
    </svg>
  )
}
