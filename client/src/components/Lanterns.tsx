interface LanternsProps {
  stage: 'desktop' | 'phone';
}

interface LanternData {
  x: number;
  y: number;
  color: string;
}

// Desktop: 22 lanterns
const desktopLanterns: LanternData[] = [
  { x: 32.7, y: 8.3, color: '#F0386B' },
  { x: 98.2, y: 12.6, color: '#2EC4B6' },
  { x: 163.6, y: 16.5, color: '#FFC93C' },
  { x: 229.1, y: 19.9, color: '#7B5CFF' },
  { x: 294.5, y: 22.9, color: '#FF8A3D' },
  { x: 360.0, y: 25.5, color: '#2EC4B6' },
  { x: 425.5, y: 27.6, color: '#F0386B' },
  { x: 490.9, y: 29.4, color: '#F0386B' },
  { x: 556.4, y: 30.7, color: '#2EC4B6' },
  { x: 621.8, y: 31.5, color: '#FFC93C' },
  { x: 687.3, y: 31.9, color: '#7B5CFF' },
  { x: 752.7, y: 31.9, color: '#FF8A3D' },
  { x: 818.2, y: 31.5, color: '#2EC4B6' },
  { x: 883.6, y: 30.7, color: '#F0386B' },
  { x: 949.1, y: 29.4, color: '#F0386B' },
  { x: 1014.5, y: 27.6, color: '#2EC4B6' },
  { x: 1080.0, y: 25.5, color: '#FFC93C' },
  { x: 1145.5, y: 22.9, color: '#7B5CFF' },
  { x: 1210.9, y: 19.9, color: '#FF8A3D' },
  { x: 1276.4, y: 16.5, color: '#2EC4B6' },
  { x: 1341.8, y: 12.6, color: '#F0386B' },
  { x: 1407.3, y: 8.3, color: '#F0386B' },
];

// Phone: 8 lanterns
const phoneLanterns: LanternData[] = [
  { x: 24.4, y: 9.3, color: '#F0386B' },
  { x: 73.1, y: 14.5, color: '#2EC4B6' },
  { x: 121.9, y: 18.0, color: '#FFC93C' },
  { x: 170.6, y: 19.8, color: '#7B5CFF' },
  { x: 219.4, y: 19.8, color: '#FF8A3D' },
  { x: 268.1, y: 18.0, color: '#2EC4B6' },
  { x: 316.9, y: 14.5, color: '#F0386B' },
  { x: 365.6, y: 9.3, color: '#F0386B' },
];

export function Lanterns({ stage }: LanternsProps) {
  const isDesktop = stage === 'desktop';
  const lanterns = isDesktop ? desktopLanterns : phoneLanterns;
  const width = isDesktop ? 1440 : 390;
  const height = isDesktop ? 84 : 65;
  const wireY = 6;
  const wireControlY = isDesktop ? 58 : 34;

  // Desktop uses standard size, phone uses 0.857x scale (18.0 vs 21.0)
  const r = isDesktop ? 21.0 : 18.0;
  const glowRadius = isDesktop ? 16.8 : 14.4;
  const wireLength = isDesktop ? 5.25 : 4.5;
  const hookHeight = isDesktop ? 9.45 : 8.1;
  const hookWidth = isDesktop ? 5.25 : 4.5;
  const hookControl = isDesktop ? 1.05 : 0.9;
  const bodyTop = hookHeight;
  const bodyWidth = isDesktop ? 7.35 : 6.3;
  const bodyControl = isDesktop ? 10.5 : 9.0;
  const bodyBottom = r * 2 - hookHeight;
  const centerLineY = r;
  const centerLineHalfWidth = isDesktop ? 4.2 : 3.6;
  const bottomY = bodyBottom;
  const bottomTipY = isDesktop ? 36.75 : 31.5;
  const bottomWidth = isDesktop ? 3.15 : 2.7;

  return (
    <svg
      aria-hidden="true"
      height={height}
      style={{ position: 'relative', display: 'block' }}
      width={width}
    >
      {/* Wire string */}
      <path
        d={`M0 ${wireY} Q${width / 2} ${wireControlY} ${width} ${wireY}`}
        fill="none"
        stroke="rgba(255,201,60,0.7)"
        strokeWidth="1.4"
      />
      {/* Individual lanterns */}
      {lanterns.map((lantern, i) => (
        <g key={i} transform={`translate(${lantern.x} ${lantern.y})`}>
          {/* Glow */}
          <circle cx="0" cy={r} fill="#FFB347" opacity="0.28" r={glowRadius} />
          {/* Wire to hook */}
          <path d={`M0 0 L0 ${wireLength}`} stroke="#FFC93C" strokeWidth="1.2" />
          {/* Hook (top triangle) */}
          <path
            d={`M-${hookWidth} ${hookHeight} Q0 ${hookControl} ${hookWidth} ${hookHeight} Z`}
            fill="#FFC93C"
          />
          {/* Lantern body */}
          <path
            d={`M-${bodyWidth} ${bodyTop} Q-${bodyControl} ${r} -${bodyWidth} ${bodyBottom} L${bodyWidth} ${bodyBottom} Q${bodyControl} ${r} ${bodyWidth} ${bodyTop} Z`}
            fill={lantern.color}
            stroke="#FFC93C"
            strokeWidth="1.4"
          />
          {/* Center line */}
          <path
            d={`M-${centerLineHalfWidth} ${centerLineY} L${centerLineHalfWidth} ${centerLineY}`}
            opacity="0.8"
            stroke="#FFC93C"
            strokeWidth="0.9"
          />
          {/* Bottom triangle */}
          <path
            d={`M-${bottomWidth} ${bottomY} L0 ${bottomTipY} L${bottomWidth} ${bottomY} Z`}
            fill="#FFC93C"
          />
        </g>
      ))}
    </svg>
  );
}
