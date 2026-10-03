interface BidHistoryProps {
  bids: Array<{ playerId: string; amount: number; at: number }>;
  players: Map<string, { nickname: string }>;
  currentTime: number;
}

export default function BidHistory({ bids, players, currentTime }: BidHistoryProps) {
  const formatTime = (bidTime: number) => {
    const diff = Math.floor((currentTime - bidTime) / 1000);
    if (diff < 2) return 'şimdi';
    if (diff < 60) return `${diff} sn önce`;
    return 'açılış';
  };

  const getLabel = (index: number, bid: { at: number }) => {
    if (index === 0) {
      const diff = Math.floor((currentTime - bid.at) / 1000);
      if (diff < 2) return 'şimdi';
    }
    if (index === bids.length - 1) return 'açılış';
    return formatTime(bid.at);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#C9CBFF',
        }}
      >
        TEKLİF GEÇMİŞİ
      </span>
      {bids.slice(0, 3).map((bid, index) => {
        const player = players.get(bid.playerId);
        return (
          <div
            key={`${bid.playerId}-${bid.at}-${index}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '9px 0',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700 }}>
              {player?.nickname || 'Unknown'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#C9CBFF' }}>
              {getLabel(index, bid)}
            </span>
            <span
              style={{
                fontFamily: "'Bungee', 'Impact', sans-serif",
                fontSize: '18px',
                color: '#FFC93C',
              }}
            >
              {bid.amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
