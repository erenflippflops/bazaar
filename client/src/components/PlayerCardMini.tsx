interface PlayerCardMiniProps {
  player: {
    nickname: string;
    gold: number;
    slots: Array<{ itemName: string | null; isNew?: boolean }>;
    label?: 'SIRA SENDE' | 'SIRA ONDA' | 'SEN' | 'PAS' | 'BAĞLANTI KOPTU';
    isYou?: boolean;
    outReason?: string;
    passedBadge?: boolean;
    isDisconnected?: boolean;
  };
  themeId: string;
}

export default function PlayerCardMini({ player, themeId }: PlayerCardMiniProps) {
  const { nickname, gold, slots, label, isYou } = player;

  const bgColor = isYou ? '#F0386B' : '#0B0C3F';
  const goldTextColor = isYou ? '#FFFFFF' : '#C9CBFF';

  const filledSlots = slots.filter(s => s.itemName).length;

  // Generate dots for slots
  const dots = slots.map((slot, index) => {
    const filled = !!slot.itemName;
    return {
      filled,
      color: filled ? '#FFC93C' : 'rgba(255,255,255,0.22)',
    };
  });

  // Label text for phone - "SIRA SENDE" becomes "SIRA"
  const shortLabel = label === 'SIRA SENDE' ? 'SIRA' : label === 'SIRA ONDA' ? '' : label;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '7px 8px',
        background: bgColor,
        border: '2px solid rgba(46,196,182,0.55)',
        borderRadius: '12px',
      }}
    >
      {/* Name and label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '14px', fontWeight: 800 }}>{nickname}</span>
        {shortLabel && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: isYou ? '#FFFFFF' : '#C9CBFF',
            }}
          >
            {shortLabel}
          </span>
        )}
      </div>

      {/* Gold and dots row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700 }}>
          {gold}{' '}
          <span style={{ fontWeight: 600, color: goldTextColor }}>altın</span>
        </span>
        <span style={{ display: 'flex', gap: '3px' }}>
          {dots.map((dot, index) => (
            <span
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: dot.color,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
