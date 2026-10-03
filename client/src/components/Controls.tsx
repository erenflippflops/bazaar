interface ControlsProps {
  mode: 'spin' | 'opening' | 'bidding' | 'passed' | 'out';
  currentBid?: number;
  myGold: number;
  myMaxBid?: number;
  mySlots?: { filled: number; total: number };
  onBid: (amount: number) => void;
  onPass: () => void;
  onSpin: () => void;
  outReason?: string;
}

export default function Controls({
  mode,
  currentBid = 0,
  myGold,
  myMaxBid = 0,
  mySlots = { filled: 0, total: 3 },
  onBid,
  onPass,
  onSpin,
  outReason,
}: ControlsProps) {
  const minBid = mode === 'opening' ? 1 : currentBid + 1;

  const canAfford = (amount: number) => amount <= myMaxBid;

  if (mode === 'out' && outReason) {
    return (
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            padding: '18px 16px',
            borderRadius: '16px',
            background: '#0B0C3F',
            border: '3px solid #F0386B',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0386B' }}>
            {outReason}
          </span>
        </div>
      </div>
    );
  }

  if (mode === 'passed') {
    return (
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            padding: '18px 16px',
            borderRadius: '16px',
            background: '#2EC4B6',
            border: '3px solid #2EC4B6',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#0B0C3F',
            }}
          >
            Pas dedin
          </span>
        </div>
      </div>
    );
  }

  if (mode === 'spin') {
    return (
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onSpin}
          style={{
            height: '64px',
            border: '3px solid #0B0C3F',
            borderRadius: '16px',
            background: '#FFC93C',
            color: '#0B0C3F',
            boxShadow: '0 6px 0 #0B0C3F',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          ÇARKI ÇEVİR
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          fontWeight: 700,
          color: '#C9CBFF',
        }}
      >
        <span>Altının {myGold}</span>
        <span>En fazla {myMaxBid}</span>
        <span>
          Slot {mySlots.filled}/{mySlots.total}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        <button
          onClick={() => onBid(minBid)}
          disabled={!canAfford(minBid)}
          style={{
            height: '50px',
            borderRadius: '12px',
            border: '3px solid #2EC4B6',
            background: '#0B0C3F',
            color: '#FFFFFF',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
            cursor: canAfford(minBid) ? 'pointer' : 'not-allowed',
            opacity: canAfford(minBid) ? 1 : 0.5,
          }}
        >
          +1
        </button>
        <button
          onClick={() => onBid(currentBid + 2)}
          disabled={!canAfford(currentBid + 2)}
          style={{
            height: '50px',
            borderRadius: '12px',
            border: '3px solid #2EC4B6',
            background: '#0B0C3F',
            color: '#FFFFFF',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
            cursor: canAfford(currentBid + 2) ? 'pointer' : 'not-allowed',
            opacity: canAfford(currentBid + 2) ? 1 : 0.5,
          }}
        >
          +2
        </button>
        <button
          onClick={() => onBid(currentBid + 5)}
          disabled={!canAfford(currentBid + 5)}
          style={{
            height: '50px',
            borderRadius: '12px',
            border: '3px solid #2EC4B6',
            background: '#0B0C3F',
            color: '#FFFFFF',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
            cursor: canAfford(currentBid + 5) ? 'pointer' : 'not-allowed',
            opacity: canAfford(currentBid + 5) ? 1 : 0.5,
          }}
        >
          +5
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mode === 'bidding' ? 'minmax(0,1fr) minmax(0,2fr)' : '1fr',
          gap: '10px',
        }}
      >
        {mode === 'bidding' && (
          <button
            onClick={onPass}
            style={{
              height: '64px',
              borderRadius: '12px',
              border: '3px solid #F0386B',
              background: '#0B0C3F',
              color: '#F0386B',
              fontFamily: "'Bungee', 'Impact', sans-serif",
              fontSize: '22px',
              cursor: 'pointer',
            }}
          >
            PAS
          </button>
        )}
        <button
          onClick={() => onBid(minBid)}
          disabled={!canAfford(minBid)}
          style={{
            height: '64px',
            border: '3px solid #0B0C3F',
            borderRadius: '16px',
            background: '#FFC93C',
            color: '#0B0C3F',
            boxShadow: '0 6px 0 #0B0C3F',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '24px',
            cursor: canAfford(minBid) ? 'pointer' : 'not-allowed',
            opacity: canAfford(minBid) ? 1 : 0.5,
          }}
        >
          {mode === 'opening' ? `TEKLİF VER · ${minBid}` : `TEKLİF VER · ${minBid}`}
        </button>
      </div>
    </div>
  );
}
