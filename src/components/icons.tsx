// Ícones dos módulos, desenhados no mesmo traço "grosso" da interface.
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
