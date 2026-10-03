interface BidHistoryProps {
  bids: Array<{
    playerName: string;
    amount: number;
    timing: string; // "şimdi", "3 sn önce", "açılış"
  }>;
}

export default function BidHistory({ bids }: BidHistoryProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#C9CBFF',
          marginBottom: '8px',
        }}
      >
        TEKLİF GEÇMİŞİ
      </span>
      {bids.map((bid, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: '9px 0',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 700 }}>{bid.playerName}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#C9CBFF' }}>
            {bid.timing}
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
      ))}
    </div>
  );
}
