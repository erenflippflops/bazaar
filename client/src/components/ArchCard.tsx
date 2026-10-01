interface ArchCardProps {
  item: {
    name: string;
    description: string;
  } | null;
}

export default function ArchCard({ item }: ArchCardProps) {
  if (!item) return null;

  // Responsive sizing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const width = isMobile ? 300 : 440;
  const height = isMobile ? 118 : 150;
  const marginTop = isMobile ? -34 : -60;

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        maxWidth: '90vw',
        height: `${height}px`,
        filter: 'drop-shadow(0 6px 0 #0B0C3F)',
        marginTop: `${marginTop}px`,
      }}
    >
      {/* Arch shape SVG */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        }}
        aria-hidden="true"
      >
        {isMobile ? (
          <>
            {/* Mobile arch shape */}
            <path
              d="M0 118 L0 44 C0 26 90 20 126 12 C141 8 150 0 150 0 C150 0 159 8 174 12 C210 20 300 26 300 44 L300 118 Z"
              fill="#FFC93C"
              stroke="#0B0C3F"
              strokeWidth="3"
            />
            <path
              d="M10 108 L10 48 C10 32 93 27 129 20 C141 17 150 11 150 11 C150 11 159 17 171 20 C207 27 290 32 290 48 L290 108 Z"
              fill="none"
              stroke="#F0386B"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </>
        ) : (
          <>
            {/* Desktop arch shape */}
            <path
              d="M0 150 L0 44 C0 26 132 20 185 12 C207 8 220 0 220 0 C220 0 233 8 255 12 C308 20 440 26 440 44 L440 150 Z"
              fill="#FFC93C"
              stroke="#0B0C3F"
              strokeWidth="3"
            />
            <path
              d="M10 140 L10 48 C10 32 136 27 189 20 C207 17 220 11 220 11 C220 11 233 17 251 20 C304 27 430 32 430 48 L430 140 Z"
              fill="none"
              stroke="#F0386B"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </>
        )}
      </svg>

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: isMobile ? '38px' : '38px',
          bottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: '0 22px',
          textAlign: 'center',
          color: '#0B0C3F',
        }}
      >
        <span
          style={{
            fontFamily: 'Bungee, Impact, sans-serif',
            fontSize: isMobile ? '23px' : '32px',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {item.name}!
        </span>
        <span
          style={{
            fontSize: isMobile ? '13px' : '21px',
            fontWeight: 700,
            fontFamily: 'Rubik, sans-serif',
          }}
        >
          {item.description}
        </span>
      </div>
    </div>
  );
}
