interface HeaderProps {
  roomCode: string | null;
  theme: string;
  auctionNumber: number | null;
  totalAuctions: number | null;
  mode: 'lobby' | 'game';
}

export function Header({
  roomCode,
  theme,
  auctionNumber,
  totalAuctions,
  mode,
}: HeaderProps) {
  // Detect if phone or desktop (simplified - could use media query hook in real app)
  const isPhone = window.innerWidth < 768;

  if (isPhone) {
    return (
      <header
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 10px',
          marginTop: '-8px',
        }}
      >
        <span
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '28px',
            color: '#FFC93C',
            textShadow: '3px 3px 0 #F0386B',
          }}
        >
          BAZAAR
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#C9CBFF',
            }}
          >
            {roomCode ? `ODA ${roomCode}` : ''} · {theme.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "'Bungee', 'Impact', sans-serif",
              fontSize: '14px',
              color: '#2EC4B6',
            }}
          >
            {mode === 'lobby'
              ? 'LOBİ'
              : `MEZAT ${auctionNumber}/${totalAuctions}`}
          </span>
        </div>
      </header>
    );
  }

  // Desktop layout
  return (
    <header
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px 6px',
        marginTop: '-18px',
      }}
    >
      <span
        style={{
          fontFamily: "'Bungee', 'Impact', sans-serif",
          fontSize: '40px',
          color: '#FFC93C',
          textShadow: '4px 4px 0 #F0386B',
        }}
      >
        BAZAAR
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#C9CBFF',
          }}
        >
          {roomCode ? `ODA ${roomCode}` : ''} · {theme.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '18px',
            color: '#2EC4B6',
          }}
        >
          {mode === 'lobby'
            ? 'LOBİ'
            : `MEZAT ${auctionNumber}/${totalAuctions}`}
        </span>
      </div>
    </header>
  );
}
