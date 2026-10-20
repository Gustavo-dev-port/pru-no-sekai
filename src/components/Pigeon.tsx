import { useId } from 'react'
import './Pigeon.css'

export type PigeonHat = 'none' | 'eboshi' | 'mail' | 'omikuji'

interface PigeonProps {
  hat?: PigeonHat
  /** Quando ausente, o pombo é decorativo (aria-hidden). */
  title?: string
  className?: string
  /** Liga o balanço de cabeça contínuo. */
  bobbing?: boolean
}

/** Pombo kawaii em SVG, olhando para a esquerda. Reutilizado em todos os módulos. */
export function Pigeon({ hat = 'none', title, className = '', bobbing = true }: PigeonProps) {
  const neckId = useId()
  return (
    <svg
      viewBox="0 0 120 120"
      className={`pigeon ${bobbing ? 'pigeon--bobbing' : ''} ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={neckId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--neck-green)" />
          <stop offset="1" stopColor="var(--neck-purple)" />
        </linearGradient>
      </defs>

      {/* sombra no chão */}
      <ellipse cx="62" cy="111" rx="30" ry="4" fill="var(--ink)" opacity="0.12" />

      {/* patinhas */}
      <g stroke="var(--pigeon-feet)" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M56 98 L55 109 M55 109 L49 111 M55 109 L58 112" />
        <path d="M70 98 L71 109 M71 109 L65 111 M71 109 L75 112" />
      </g>

      {/* cauda */}
      <path d="M90 78 L114 70 Q117 78 112 86 L92 92 Z" fill="var(--pigeon-500)" />

      {/* corpo */}
      <ellipse cx="64" cy="78" rx="34" ry="25" fill="var(--pigeon-300)" />
      <ellipse cx="58" cy="86" rx="22" ry="13" fill="var(--pigeon-100)" opacity="0.7" />

      {/* asa com as duas faixas clássicas de pombo */}
      <path d="M62 66 Q88 58 100 76 Q92 92 70 90 Q60 80 62 66 Z" fill="var(--pigeon-400)" />
      <path d="M74 74 Q84 72 92 78" stroke="var(--pigeon-700)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M72 81 Q82 80 90 85" stroke="var(--pigeon-700)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* cabeça + pescoço (animados juntos) */}
      <g className="pigeon__head">
        <ellipse cx="46" cy="58" rx="17" ry="15" fill={`url(#${neckId})`} />
        <circle cx="40" cy="40" r="19" fill="var(--pigeon-400)" />

        {/* bico */}
        <path d="M23 41 L12 45 L23 48 Z" fill="var(--pigeon-feet)" />
        <ellipse cx="24.5" cy="41.5" rx="3.5" ry="2.4" fill="var(--pigeon-100)" />

        {/* olho */}
        <circle cx="35" cy="37" r="5.2" fill="var(--pigeon-eye)" />
        <circle cx="34.5" cy="37" r="3.2" fill="var(--lacquer)" />
        <circle cx="33.2" cy="35.6" r="1.2" fill="#fff" />

        {/* bochecha */}
        <ellipse cx="44" cy="48" rx="5.5" ry="3.2" fill="var(--sakura-300)" opacity="0.8" />

        {hat === 'eboshi' && (
          <g>
            <path d="M30 25 Q36 2 54 14 Q52 22 48 25 Z" fill="var(--lacquer)" />
            <path d="M28 25 L52 25" stroke="var(--lacquer)" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}
        {hat === 'mail' && (
          <g>
            <path d="M27 26 Q40 10 54 24 Z" fill="#5b7fb8" />
            <path d="M22 26 L50 26" stroke="#3d5d93" strokeWidth="4" strokeLinecap="round" />
            <path d="M38 17 l2 4 l-4 0 Z" fill="var(--gold)" />
          </g>
        )}
        {hat === 'omikuji' && (
          <g>
            <path d="M30 28 Q40 18 52 26" stroke="var(--torii)" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M51 25 l9 -4 l-3 8 Z" fill="var(--torii)" />
          </g>
        )}
      </g>
    </svg>
  )
}
