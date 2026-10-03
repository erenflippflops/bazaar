export function Background() {
  return (
    <>
      {/* Rays layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-conic-gradient(from 0deg at 50% 45%, rgba(255,255,255,0.06) 0deg 10deg, rgba(255,255,255,0) 10deg 20deg)',
          pointerEvents: 'none',
        }}
      />
      {/* Star pattern SVG */}
      <svg
        aria-hidden="true"
        height="900"
        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
        width="1440"
      >
        <defs>
          <pattern height="44" id="starD" patternUnits="userSpaceOnUse" width="44">
            <g transform="translate(12 12)">
              <path
                d="M10 0 L12.9 7.1 L20 10 L12.9 12.9 L10 20 L7.1 12.9 L0 10 L7.1 7.1 Z"
                fill="none"
                stroke="rgba(255,201,60,0.13)"
                strokeWidth="1.2"
              />
              <path
                d="M10 0 L12.9 7.1 L20 10 L12.9 12.9 L10 20 L7.1 12.9 L0 10 L7.1 7.1 Z"
                fill="none"
                stroke="rgba(255,201,60,0.13)"
                strokeWidth="1.2"
                transform="rotate(45 10 10)"
              />
            </g>
          </pattern>
        </defs>
        <rect fill="url(#starD)" height="900" width="1440" />
      </svg>
    </>
  );
}
