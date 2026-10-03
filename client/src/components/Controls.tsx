interface ControlsProps {
  myGold: number;
  maxBid: number;
  slotsUsed: number;
  totalSlots: number;
  currentBid: number;
  canBid: boolean;
  canPass: boolean;
  onBidIncrement: (amount: number) => void;
  onPass: () => void;
  onSubmitBid: () => void;
  nextBid: number;
}

export default function Controls({
  myGold,
  maxBid,
  slotsUsed,
  totalSlots,
  currentBid,
  canBid,
  canPass,
  onBidIncrement,
  onPass,
  onSubmitBid,
  nextBid,
}: ControlsProps) {
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
        <span>En fazla {maxBid}</span>
        <span>Slot {slotsUsed}/{totalSlots}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        <button
          onClick={() => onBidIncrement(1)}
          disabled={!canBid}
          style={{
            height: '50px',
            borderRadius: '12px',
            border: '3px solid #2EC4B6',
            background: '#0B0C3F',
            color: '#FFFFFF',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
            cursor: canBid ? 'pointer' : 'not-allowed',
            opacity: canBid ? 1 : 0.5,
          }}
        >
          +1
        </button>
        <button
          onClick={() => onBidIncrement(2)}
          disabled={!canBid}
          style={{
            height: '50px',
            borderRadius: '12px',
            border: '3px solid #2EC4B6',
            background: '#0B0C3F',
            color: '#FFFFFF',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
            cursor: canBid ? 'pointer' : 'not-allowed',
            opacity: canBid ? 1 : 0.5,
          }}
        >
          +2
        </button>
        <button
          onClick={() => onBidIncrement(5)}
          disabled={!canBid}
          style={{
            height: '50px',
            borderRadius: '12px',
            border: '3px solid #2EC4B6',
            background: '#0B0C3F',
            color: '#FFFFFF',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
            cursor: canBid ? 'pointer' : 'not-allowed',
            opacity: canBid ? 1 : 0.5,
          }}
        >
          +5
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '10px' }}>
        <button
          onClick={onPass}
          disabled={!canPass}
          style={{
            height: '64px',
            borderRadius: '12px',
            border: '3px solid #F0386B',
            background: '#0B0C3F',
            color: '#F0386B',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '22px',
            cursor: canPass ? 'pointer' : 'not-allowed',
            opacity: canPass ? 1 : 0.5,
          }}
        >
          PAS
        </button>
        <button
          onClick={onSubmitBid}
          disabled={!canBid}
          style={{
            height: '64px',
            border: '3px solid #0B0C3F',
            borderRadius: '16px',
            background: canBid ? '#FFC93C' : '#555',
            color: '#0B0C3F',
            boxShadow: '0 6px 0 #0B0C3F',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '24px',
            cursor: canBid ? 'pointer' : 'not-allowed',
          }}
        >
          TEKLİF VER · {nextBid}
        </button>
      </div>
    </div>
  );
}
