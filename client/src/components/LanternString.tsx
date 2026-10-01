import { useEffect, useState } from 'react';

const LANTERN_COLORS = [
  'var(--pomegranate)',
  'var(--turquoise)',
  'var(--saffron)',
  'var(--violet)',
  'var(--orange)',
];

export default function LanternString() {
  const [lanternCount, setLanternCount] = useState(8);

  useEffect(() => {
    const updateLanternCount = () => {
      setLanternCount(window.innerWidth >= 1024 ? 22 : 8);
    };
    updateLanternCount();
    window.addEventListener('resize', updateLanternCount);
    return () => window.removeEventListener('resize', updateLanternCount);
  }, []);

  const lanterns = Array.from({ length: lanternCount }, (_, i) => ({
    id: i,
    color: LANTERN_COLORS[i % LANTERN_COLORS.length],
    delay: Math.random() * 5,
  }));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '80px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      viewBox="0 0 1000 80"
      preserveAspectRatio="none"
    >
      {/* String path - sagging curve */}
      <path
        d="M 0,10 Q 250,30 500,30 T 1000,10"
        stroke="var(--saffron)"
        strokeWidth="2"
        fill="none"
      />

      {/* Lanterns */}
      {lanterns.map((lantern, index) => {
        const x = (index / (lanternCount - 1)) * 1000;
        const y = 10 + 20 * Math.sin((index / (lanternCount - 1)) * Math.PI);

        return (
          <g key={lantern.id}>
            {/* Glow */}
            <ellipse
              cx={x}
              cy={y + 15}
              rx="12"
              ry="14"
              fill="var(--glow)"
              opacity="0.4"
              style={{
                filter: 'blur(8px)',
                animation: prefersReducedMotion ? 'none' : `flicker-${lantern.id} ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${lantern.delay}s`,
              }}
            />

            {/* Hanging string */}
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={y + 8}
              stroke="var(--saffron)"
              strokeWidth="1"
            />

            {/* Lantern body */}
            <rect
              x={x - 4}
              y={y + 8}
              width="8"
              height="12"
              rx="1"
              fill={lantern.color}
              opacity="0.85"
              style={{
                animation: prefersReducedMotion ? 'none' : `flicker-${lantern.id} ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${lantern.delay}s`,
              }}
            />

            {/* Lantern top (metal cap) */}
            <rect
              x={x - 4.5}
              y={y + 7}
              width="9"
              height="2"
              fill="var(--saffron)"
            />

            {/* Lantern bottom (metal cap) */}
            <rect
              x={x - 4.5}
              y={y + 20}
              width="9"
              height="1.5"
              fill="var(--saffron)"
            />
          </g>
        );
      })}

      {/* CSS animations for flicker */}
      <style>{`
        ${lanterns.map(lantern => `
          @keyframes flicker-${lantern.id} {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `).join('\n')}
      `}</style>
    </svg>
  );
}
