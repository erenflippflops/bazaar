import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface AuctionPanelProps {
  socket: Socket | null;
  phase: string;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  players: any[];
  myPlayerId?: string;
  myMaxBid?: number;
  auctionEndsAt?: number;
  openingEndsAt?: number;
  currentOpenerIndex: number;
}

export default function AuctionPanel({
  socket,
  phase,
  currentHighestBid,
  currentHighestBidderId,
  players,
  myPlayerId,
  myMaxBid,
  auctionEndsAt,
  openingEndsAt,
  currentOpenerIndex,
}: AuctionPanelProps) {
  const [bidAmount, setBidAmount] = useState(0);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (phase === 'bidding' && auctionEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((auctionEndsAt - Date.now()) / 1000));
        setCountdown(remaining);
      }, 100);
      return () => clearInterval(interval);
    } else if (phase === 'opening' && openingEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((openingEndsAt - Date.now()) / 1000));
        setCountdown(remaining);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [phase, auctionEndsAt, openingEndsAt]);

  const handlePlaceBid = () => {
    if (!socket || bidAmount <= 0) return;
    socket.emit('place_bid', { amount: bidAmount }, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Teklif verilemedi');
      }
    });
  };

  const currentOpener = players[currentOpenerIndex];
  const isMyTurn = currentOpener?.id === myPlayerId;
  const highestBidder = players.find(p => p.id === currentHighestBidderId);
  const amIHighestBidder = currentHighestBidderId === myPlayerId;
  const minBid = currentHighestBid + 1;
  const canBid = !amIHighestBidder && bidAmount >= minBid && bidAmount <= (myMaxBid || 0);

  if (phase === 'opening') {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="timer" style={{ margin: '0 auto 20px' }}>
          {countdown}
        </div>
        <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--white)' }}>
          {isMyTurn ? 'Açılış teklifi ver' : `${currentOpener?.nickname} açılış teklifi veriyor...`}
        </h3>
        {isMyTurn && (
          <>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '15px' }}>
              En az 1 altın vermelisin
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button className="secondary-button" onClick={() => setBidAmount(Math.max(1, bidAmount - 1))}>-1</button>
              <input
                type="number"
                value={bidAmount || ''}
                onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                min={1}
                max={myMaxBid}
                style={{ flex: 1, textAlign: 'center' }}
              />
              <button className="secondary-button" onClick={() => setBidAmount(Math.min(myMaxBid || 0, bidAmount + 1))}>+1</button>
            </div>
            <button 
              className="primary-button" 
              onClick={handlePlaceBid}
              disabled={bidAmount < 1 || bidAmount > (myMaxBid || 0)}
              style={{ width: '100%' }}
            >
              Teklif Ver
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === 'bidding') {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="timer" style={{ margin: '0 auto 20px' }}>
          {countdown}
        </div>
        <h3 style={{ fontSize: '20px', marginBottom: '10px', color: 'var(--white)' }}>
          Mevcut Teklif
        </h3>
        <p style={{ fontSize: '48px', fontFamily: 'var(--font-heading)', color: 'var(--saffron)', marginBottom: '10px' }}>
          {currentHighestBid}
        </p>
        <p style={{ fontSize: '16px', color: 'var(--muted)', marginBottom: '20px' }}>
          {highestBidder?.nickname || 'Kimse'}
        </p>

        {amIHighestBidder ? (
          <p style={{ padding: '15px', background: 'var(--turquoise)', color: 'var(--dark)', borderRadius: '12px', fontWeight: 600 }}>
            En yüksek teklif senin!
          </p>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '15px' }}>
              Altının: {myMaxBid} • En fazla {myMaxBid} verebilirsin
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button className="secondary-button" onClick={() => setBidAmount(minBid)}>+1</button>
              <button className="secondary-button" onClick={() => setBidAmount(minBid + 1)}>+2</button>
              <button className="secondary-button" onClick={() => setBidAmount(minBid + 4)}>+5</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button className="secondary-button" onClick={() => setBidAmount(Math.max(minBid, bidAmount - 1))}>-1</button>
              <input
                type="number"
                value={bidAmount || ''}
                onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                min={minBid}
                max={myMaxBid}
                style={{ flex: 1, textAlign: 'center' }}
              />
              <button className="secondary-button" onClick={() => setBidAmount(Math.min(myMaxBid || 0, bidAmount + 1))}>+1</button>
            </div>
            <button 
              className="primary-button" 
              onClick={handlePlaceBid}
              disabled={!canBid}
              style={{ width: '100%' }}
            >
              Teklif Ver
            </button>
          </>
        )}
      </div>
    );
  }

  return null;
}
