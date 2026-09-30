interface ArchCardProps {
  item: {
    name: string;
    description: string;
  } | null;
}

export default function ArchCard({ item }: ArchCardProps) {
  if (!item) return null;

  return (
    <div
      style={{
        position: 'relative',
        width: '300px',
        maxWidth: '90vw',
        height: '118px',
        filter: 'drop-shadow(0 6px 0 #0B0C3F)',
        marginTop: '-34px',
      }}
    >
      {/* Arch shape SVG */}
      <svg
        width="300"
        height="118"
        viewBox="0 0 300 118"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        }}
        aria-hidden="true"
      >
        {/* Main saffron arch shape with dark outline */}
        <path
          d="M0 118 L0 44 C0 26 90 20 126 12 C141 8 150 0 150 0 C150 0 159 8 174 12 C210 20 300 26 300 44 L300 118 Z"
          fill="#FFC93C"
          stroke="#0B0C3F"
          strokeWidth="3"
        />
        {/* Inner dashed pomegranate trim */}
        <path
          d="M10 108 L10 48 C10 32 93 27 129 20 C141 17 150 11 150 11 C150 11 159 17 171 20 C207 27 290 32 290 48 L290 108 Z"
          fill="none"
          stroke="#F0386B"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '38px',
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
            fontSize: '23px',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {item.name}!
        </span>
        <span
          style={{
            fontSize: '13px',
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
