/** Caixa hexagonal de omikuji. Ao sacudir, um palitinho escapa pelo furo. */
export function OmikujiBox({ shaking }: { shaking: boolean }) {
  return (
    <div className={`omikuji-box ${shaking ? 'omikuji-box--shaking' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 100 140">
        {/* palitinho (aparece durante o sacode) */}
        <g className="omikuji-box__stick">
          <rect x="46" y="2" width="8" height="40" rx="3" fill="var(--wood)" stroke="var(--ink)" strokeWidth="2.5" />
          <rect x="46" y="2" width="8" height="9" rx="3" fill="var(--torii)" stroke="var(--ink)" strokeWidth="2.5" />
        </g>
        {/* corpo */}
        <path d="M20 26 L80 26 L86 128 L14 128 Z" fill="var(--torii)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M38 26 L37 128 M62 26 L63 128" stroke="var(--torii-dark)" strokeWidth="2" />
        {/* tampa */}
        <rect x="16" y="20" width="68" height="10" rx="3" fill="var(--lacquer)" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="50" cy="25" r="4" fill="var(--ink)" />
        {/* etiqueta */}
        <rect x="36" y="48" width="28" height="58" rx="2" fill="var(--cream-50)" stroke="var(--ink)" strokeWidth="2.5" />
        <text x="50" y="68" textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--torii-dark)">
          御
        </text>
        <text x="50" y="98" textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--torii-dark)">
          籤
        </text>
        <rect x="10" y="126" width="80" height="8" rx="3" fill="var(--lacquer)" stroke="var(--ink)" strokeWidth="3" />
      </svg>
    </div>
  )
}
