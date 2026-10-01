import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Timer from './Timer';

interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: any[];
}

interface Item {
  name: string;
  description: string;
}

interface AuctionPanelProps {
  socket: Socket | null;
  phase: string;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  players: Player[];
  myPlayerId?: string;
  myMaxBid?: number;
  auctionEndsAt?: number;
  openingEndsAt?: number;
  currentOpenerIndex: number;
  revealedItem?: Item;
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
  revealedItem,
}: AuctionPanelProps) {
  const [pendingBid, setPendingBid] = useState<number | null>(null);
  const [bidResult, setBidResult] = useState<{ success: boolean; message: string } | null>(null);

  const currentOpener = players[currentOpenerIndex];
  const isMyTurn = currentOpener?.id === myPlayerId;
  const highestBidder = players.find(p => p.id === currentHighestBidderId);
  const amIHighestBidder = currentHighestBidderId === myPlayerId;

  const myPlayer = players.find(p => p.id === myPlayerId);
  const myGold = myPlayer?.gold || 0;
  const myFilledSlots = myPlayer?.slots.filter(s => s !== null).length || 0;
  const hasFullSlots = myFilledSlots >= 3;

  // Clear bid result after 3 seconds
  useEffect(() => {
    if (bidResult) {
      const timer = setTimeout(() => setBidResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [bidResult]);

  const handlePlaceBid = (amount: number) => {
    if (!socket) {
      alert('Bağlantı koptu, lütfen sayfayı yenileyin');
      return;
    }
    if (!socket.connected) {
      alert('Sunucuya bağlanılamıyor, lütfen bekleyin');
      return;
    }

    setPendingBid(amount);
    setBidResult(null);

    console.log('[Client] Sending place_bid event, amount:', amount);
    socket.emit('place_bid', { amount }, (response: any) => {
      console.log('[Client] place_bid response:', response);
      setPendingBid(null);

      if (response?.success === false) {
        setBidResult({ success: false, message: response.error || 'Teklif verilemedi' });
      } else {
        setBidResult({ success: true, message: 'Teklifin alındı' });
      }
    });
  };

  // Helper to check if a bid button should be disabled
  const isBidDisabled = (amount: number) => {
    if (pendingBid !== null) return true;
    return amount > (myMaxBid || 0);
  };

  // Compact item display for opening and bidding phases
  const CompactItemDisplay = () => {
    if (!revealedItem) return null;

    return (
      <div style={{
        background: 'var(--saffron)',
        color: 'var(--dark)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid var(--dark)',
        marginBottom: '14px',
        textAlign: 'center',
      }}>
        <h4 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '18px',
          marginBottom: '4px',
          color: 'var(--dark)',
          lineHeight: 1.2,
        }}>
          {revealedItem.name.toUpperCase()}
        </h4>
        <p style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--dark)',
          lineHeight: 1.3,
        }}>
          {revealedItem.description}
        </p>
      </div>
    );
  };

  // Opening phase
  if (phase === 'opening') {
    if (!isMyTurn) {
      return (
        <div className="card" style={{ textAlign: 'center' }}>
          <CompactItemDisplay />
          <Timer endsAt={openingEndsAt} />
          <h3 style={{ fontSize: '20px', marginTop: '20px', color: 'var(--white)' }}>
            {currentOpener?.nickname} açılış teklifi veriyor...
          </h3>
        </div>
      );
    }

    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <CompactItemDisplay />
        <Timer endsAt={openingEndsAt} label="AÇILIŞ" />

        <h3 style={{ fontSize: '20px', margin: '20px 0 10px', color: 'var(--white)' }}>
          Açılış teklifi ver
        </h3>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--muted)',
          marginBottom: '10px',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span>Altının <b style={{ color: 'var(--white)' }}>{myGold}</b></span>
          <span style={{ color: 'var(--saffron)', fontWeight: 800 }}>En fazla <b style={{ color: 'var(--saffron)' }}>{myMaxBid}</b> altın verebilirsin</span>
          <span>Slot <b style={{ color: 'var(--white)' }}>{myFilledSlots}/3</b></span>
        </div>

        <button
          className="primary-button"
          onClick={() => handlePlaceBid(1)}
          disabled={isBidDisabled(1)}
          style={{
            width: '100%',
            height: '64px',
            fontSize: '24px',
            marginBottom: '10px',
            ...(isBidDisabled(1) && {
              background: '#666',
              color: '#999',
              cursor: 'not-allowed',
            }),
          }}
        >
          {pendingBid === 1 ? 'BEKLENİYOR...' : 'AÇILIŞ: 1 ALTIN'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            className="secondary-button"
            onClick={() => handlePlaceBid(1)}
            disabled={isBidDisabled(1)}
            style={{
              height: '50px',
              fontSize: '20px',
            }}
          >
            {pendingBid === 1 ? '...' : '+1'}
          </button>
          <button
            className="secondary-button"
            onClick={() => handlePlaceBid(2)}
            disabled={isBidDisabled(2)}
            style={{
              height: '50px',
              fontSize: '20px',
            }}
          >
            {pendingBid === 2 ? '...' : '+2'}
          </button>
          <button
            className="secondary-button"
            onClick={() => handlePlaceBid(5)}
            disabled={isBidDisabled(5)}
            style={{
              height: '50px',
              fontSize: '20px',
            }}
          >
            {pendingBid === 5 ? '...' : '+5'}
          </button>
        </div>

        {bidResult && (
          <p style={{
            marginTop: '10px',
            fontSize: '15px',
            fontWeight: 700,
            color: bidResult.success ? 'var(--turquoise)' : 'var(--pomegranate)'
          }}>
            {bidResult.message}
          </p>
        )}
      </div>
    );
  }

  // Bidding phase
  if (phase === 'bidding') {
    return (
      <div className="card">
        <CompactItemDisplay />
        <div style={{
          padding: '16px 18px',
          background: 'var(--dark)',
          border: '2px solid rgba(46, 196, 182, 0.55)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'var(--muted)'
            }}>
              EN YÜKSEK TEKLİF
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '44px',
              lineHeight: 1,
              color: 'var(--white)'
            }}>
              {currentHighestBid} ALTIN
            </span>
            <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--turquoise)'
            }}>
              {highestBidder?.nickname || 'Kimse'} önde
            </span>
          </div>
          <Timer endsAt={auctionEndsAt} />
        </div>

        {hasFullSlots ? (
          <div style={{
            padding: '20px',
            background: 'var(--dark)',
            border: '2px solid rgba(46, 196, 182, 0.55)',
            borderRadius: '14px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--muted)' }}>
              Slotların dolu, izliyorsun
            </p>
          </div>
        ) : amIHighestBidder ? (
          <div style={{
            padding: '20px',
            background: 'var(--turquoise)',
            border: '2px solid var(--turquoise)',
            borderRadius: '14px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dark)' }}>
              En yüksek teklif senin!
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--muted)',
              marginBottom: '10px',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span>Altının <b style={{ color: 'var(--white)' }}>{myGold}</b></span>
              <span style={{ color: 'var(--saffron)', fontWeight: 800 }}>En fazla <b style={{ color: 'var(--saffron)' }}>{myMaxBid}</b> altın verebilirsin</span>
              <span>Slot <b style={{ color: 'var(--white)' }}>{myFilledSlots}/3</b></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                className="secondary-button"
                onClick={() => handlePlaceBid(currentHighestBid + 1)}
                disabled={isBidDisabled(currentHighestBid + 1)}
                style={{
                  height: '50px',
                  fontSize: '20px',
                }}
              >
                {pendingBid === currentHighestBid + 1 ? '...' : '+1'}
              </button>
              <button
                className="secondary-button"
                onClick={() => handlePlaceBid(currentHighestBid + 2)}
                disabled={isBidDisabled(currentHighestBid + 2)}
                style={{
                  height: '50px',
                  fontSize: '20px',
                }}
              >
                {pendingBid === currentHighestBid + 2 ? '...' : '+2'}
              </button>
              <button
                className="secondary-button"
                onClick={() => handlePlaceBid(currentHighestBid + 5)}
                disabled={isBidDisabled(currentHighestBid + 5)}
                style={{
                  height: '50px',
                  fontSize: '20px',
                }}
              >
                {pendingBid === currentHighestBid + 5 ? '...' : '+5'}
              </button>
            </div>

            {bidResult && (
              <p style={{
                marginTop: '10px',
                fontSize: '15px',
                fontWeight: 700,
                color: bidResult.success ? 'var(--turquoise)' : 'var(--pomegranate)',
                textAlign: 'center'
              }}>
                {bidResult.message}
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
