interface PlayerCardProps {
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

export default function PlayerCard({ player, themeId }: PlayerCardProps) {
  const { nickname, gold, slots, label, isYou } = player;

  const bgColor = isYou ? '#F0386B' : '#0B0C3F';
  const goldColor = isYou ? '#FFFFFF' : '#FFC93C';
  const textColor = isYou ? '#FFFFFF' : '#C9CBFF';

  const filledSlots = slots.filter(s => s.itemName).length;
  const totalSlots = slots.length;

  // Halisaha theme: first slot is "kaleci"
  const isHalisaha = themeId === 'halisaha';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 14px',
        background: bgColor,
        border: '2px solid rgba(46,196,182,0.55)',
        borderRadius: '14px',
      }}
    >
      {/* Name and label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '18px', fontWeight: 800 }}>{nickname}</span>
        {label && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: label === 'PAS' ? '#FFFFFF' : textColor,
              ...(label === 'PAS' && {
                background: '#F0386B',
                padding: '2px 8px',
                borderRadius: '999px',
              }),
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Gold and slots count row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
            color: goldColor,
          }}
        >
          {gold}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: textColor }}>
          altın · {filledSlots}/{totalSlots} slot
        </span>
      </div>

      {/* Slots row */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {slots.map((slot, index) => {
          const isEmpty = !slot.itemName;
          const isKaleciSlot = isHalisaha && index === 0;

          return (
            <span
              key={index}
              style={{
                flex: 1,
                ...(isEmpty ? {} : { minWidth: 0 }),
                padding: '6px 6px',
                borderRadius: '8px',
                ...(isEmpty
                  ? {
                      border: '1.5px dashed rgba(255,255,255,0.3)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textAlign: 'center',
                      color: '#C9CBFF',
                    }
                  : {
                      background: slot.isNew
                        ? 'rgba(255,201,60,0.16)'
                        : 'rgba(255,201,60,0.16)',
                      border: '1.5px solid #FFC93C',
                      fontSize: '12px',
                      fontWeight: 700,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }),
              }}
            >
              {isEmpty
                ? isKaleciSlot
                  ? 'kaleci'
                  : isHalisaha
                  ? 'oyuncu'
                  : 'boş'
                : slot.itemName}
            </span>
          );
        })}
      </div>
    </div>
  );
}
