// Cenário do portão: céu, Monte Fuji emoldurado pelo torii, cerejeiras,
// lanternas de pedra e o caminho até o portão. Puramente decorativo.
// viewBox 800x600 com "slice": no celular aparece o miolo (~x 260–540),
// no desktop aparecem também as laterais.

function SakuraTree({ x, flip = false }: { x: number; flip?: boolean }) {
  const s = flip ? -1 : 1
  return (
    <g transform={`translate(${x} 0) scale(${s} 1)`}>
      <path d="M-8 470 Q-4 400 -18 340 Q0 360 6 330 Q10 400 10 470 Z" fill="#8b5e4a" />
      <path d="M-2 380 Q30 350 52 340" stroke="#8b5e4a" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="-30" cy="300" r="52" fill="var(--sakura-200)" />
      <circle cx="30" cy="290" r="58" fill="var(--sakura-300)" />
      <circle cx="70" cy="330" r="40" fill="var(--sakura-200)" />
      <circle cx="-60" cy="340" r="36" fill="var(--sakura-300)" />
      <circle cx="0" cy="250" r="44" fill="var(--sakura-100)" />
      <circle cx="12" cy="300" r="5" fill="#fff" opacity="0.8" />
      <circle cx="-34" cy="280" r="4" fill="#fff" opacity="0.8" />
      <circle cx="52" cy="318" r="4" fill="#fff" opacity="0.8" />
    </g>
  )
}

function StoneLantern({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-16" y="56" width="32" height="8" rx="2" fill="#a59c96" />
      <rect x="-7" y="26" width="14" height="32" fill="#bdb4ad" />
      <rect x="-14" y="20" width="28" height="7" rx="2" fill="#a59c96" />
      <rect x="-11" y="3" width="22" height="18" fill="#bdb4ad" />
      <rect x="-6" y="7" width="12" height="10" rx="2" fill="var(--lantern-glow)" className="garden__lantern-light" />
      <path d="M-20 4 Q0 -14 20 4 Z" fill="#9a918b" />
      <circle cx="0" cy="-10" r="3.5" fill="#9a918b" />
    </g>
  )
}

export function GardenScene() {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" className="garden" aria-hidden="true">
      <defs>
        <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd6e3" />
          <stop offset="0.65" stopColor="#fff0e8" />
          <stop offset="1" stopColor="#fff8ee" />
        </linearGradient>
        <linearGradient id="garden-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3e3c8" />
          <stop offset="1" stopColor="#a9c49b" />
        </linearGradient>
      </defs>

      <rect width="800" height="600" fill="url(#garden-sky)" />

      {/* sol suave e nuvens */}
      <circle cx="590" cy="130" r="56" fill="#ffb3c6" opacity="0.55" />
      <g fill="#fff" opacity="0.75">
        <rect x="120" y="110" width="130" height="26" rx="13" />
        <rect x="160" y="92" width="70" height="26" rx="13" />
        <rect x="540" y="200" width="110" height="22" rx="11" />
      </g>

      {/* Monte Fuji, centralizado para aparecer dentro do torii */}
      <path d="M150 390 L360 196 Q400 168 440 196 L650 390 Z" fill="#c9d9c0" />
      <path d="M360 196 Q400 168 440 196 L426 212 L412 202 L400 216 L388 202 L374 212 Z" fill="#fff" />

      {/* colinas */}
      <path d="M0 380 Q120 340 260 372 Q400 400 540 366 Q680 336 800 372 L800 420 L0 420 Z" fill="var(--sage-300)" />

      {/* chão */}
      <rect y="400" width="800" height="200" fill="url(#garden-ground)" />

      {/* caminho de pedra */}
      <path d="M372 432 L428 432 L520 600 L280 600 Z" fill="var(--cream-200)" />
      <g stroke="var(--cream-300)" strokeWidth="3">
        <path d="M366 460 L434 460" />
        <path d="M352 494 L448 494" />
        <path d="M334 536 L466 536" />
        <path d="M312 580 L488 580" />
      </g>

      <SakuraTree x={130} />
      <SakuraTree x={680} flip />

      <StoneLantern x={300} y={410} />
      <StoneLantern x={500} y={410} />

      {/* torii */}
      <g>
        <rect x="316" y="216" width="20" height="232" fill="var(--torii)" />
        <rect x="464" y="216" width="20" height="232" fill="var(--torii)" />
        <rect x="310" y="440" width="32" height="14" rx="2" fill="var(--lacquer)" />
        <rect x="458" y="440" width="32" height="14" rx="2" fill="var(--lacquer)" />
        <rect x="296" y="254" width="208" height="14" fill="var(--torii)" />
        <rect x="296" y="266" width="208" height="4" fill="var(--torii-dark)" />
        <path d="M290 226 Q400 240 510 226 L512 212 Q400 226 288 212 Z" fill="var(--torii)" />
        <path d="M272 204 Q400 222 528 204 L536 188 Q400 208 264 188 Z" fill="var(--lacquer)" />
        <rect x="384" y="224" width="32" height="34" rx="2" fill="var(--lacquer)" stroke="var(--gold)" strokeWidth="2" />
        <text x="400" y="239" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--gold)">プ</text>
        <text x="400" y="253" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--gold)">ル</text>
      </g>

      {/* pétalas caídas */}
      <g fill="var(--sakura-300)">
        <ellipse cx="250" cy="520" rx="5" ry="3" transform="rotate(20 250 520)" />
        <ellipse cx="560" cy="500" rx="5" ry="3" transform="rotate(-30 560 500)" />
        <ellipse cx="430" cy="470" rx="4" ry="2.5" />
        <ellipse cx="610" cy="560" rx="5" ry="3" transform="rotate(50 610 560)" />
        <ellipse cx="190" cy="470" rx="4" ry="2.5" transform="rotate(-15 190 470)" />
      </g>
    </svg>
  )
}
