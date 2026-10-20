import './PaperLanterns.css'

const COLORS = ['var(--torii)', 'var(--sakura-300)', 'var(--lantern-glow)', 'var(--sakura-300)', 'var(--torii)']

/** Varal de chōchin (lanternas de papel) balançando. Decorativo. */
export function PaperLanterns() {
  return (
    <div className="lanterns" aria-hidden="true">
      <svg className="lanterns__rope" viewBox="0 0 100 10" preserveAspectRatio="none">
        <path d="M0 2 Q50 12 100 2" stroke="var(--lacquer)" strokeWidth="0.6" fill="none" />
      </svg>
      {COLORS.map((color, i) => (
        <svg key={i} className="lanterns__item" viewBox="0 0 40 64" style={{ animationDelay: `${i * -0.6}s` }}>
          <line x1="20" y1="0" x2="20" y2="8" stroke="var(--lacquer)" strokeWidth="2" />
          <rect x="11" y="8" width="18" height="6" rx="2" fill="var(--lacquer)" />
          <ellipse cx="20" cy="33" rx="17" ry="21" fill={color} stroke="var(--lacquer)" strokeWidth="2" />
          <g stroke="var(--lacquer)" strokeWidth="1" opacity="0.35" fill="none">
            <path d="M5 24 Q20 28 35 24" />
            <path d="M3 33 Q20 37 37 33" />
            <path d="M5 42 Q20 46 35 42" />
          </g>
          <rect x="11" y="52" width="18" height="6" rx="2" fill="var(--lacquer)" />
          <line x1="20" y1="58" x2="20" y2="64" stroke="var(--gold)" strokeWidth="3" />
        </svg>
      ))}
    </div>
  )
}
