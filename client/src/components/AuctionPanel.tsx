import { useState } from 'react';
import { Socket } from 'socket.io-client';
import Timer from './Timer';

interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: any[];
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
  passedPlayerIds: string[];
  isAuctionSettled?: boolean;
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
  passedPlayerIds,
  isAuctionSettled,
}: AuctionPanelProps) {
  const [selectedIncrement, setSelectedIncrement] = useState(0);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [passPending, setPassPending] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);

  const currentOpener = players[currentOpenerIndex];
  const isMyTurn = currentOpener?.id === myPlayerId;
  const highestBidder = players.find(p => p.id === currentHighestBidderId);
  const amIHighestBidder = currentHighestBidderId === myPlayerId;

  const myPlayer = players.find(p => p.id === myPlayerId);
  const myGold = myPlayer?.gold || 0;
  const myFilledSlots = myPlayer?.slots.filter(s => s !== null).length || 0;
  const hasFullSlots = myFilledSlots >= 3;
  const hasEmptySlot = myFilledSlots < 3;

  const minBid = phase === 'opening' ? 1 : currentHighestBid + 1;
  const proposedBid = phase === 'opening'
    ? (selectedIncrement > 0 ? selectedIncrement : 1)
    : (selectedIncrement > 0 ? currentHighestBid + selectedIncrement : minBid);

  const canAfford = proposedBid <= (myMaxBid || 0);
  const isValidBid = proposedBid >= minBid && canAfford;

  const handlePass = () => {
    if (!socket || passPending) return;
    setPassPending(true);
    socket.emit('pass_bid', {}, (response: any) => {
      setPassPending(false);
      if (response?.success === false) {
        setFeedback({ ok: false, text: response.error || 'Pas geçilemedi' });
        setTimeout(() => setFeedback(null), 1800);
      } else {
        setHasPassed(true);
      }
    });
  };

  // One click = one bid. The server is the judge of validity.
  const placeBid = (amount: number) => {
    if (!socket || pending) return;
    setPending(true); setFeedback(null);
    socket.emit('place_bid', { amount }, (response: any) => {
      setPending(false);
      if (response?.success === false) setFeedback({ ok: false, text: response.error || 'Teklif verilemedi' });
      else setFeedback({ ok: true, text: `Teklifin alındı: ${amount} altın` });
      setTimeout(() => setFeedback(null), 1800);
    });
  };

  const handleIncrement = (amount: number) => {
    setSelectedIncrement(amount);
  };

  const handlePlaceBid = () => {
    if (!socket || !isValidBid) return;

    socket.emit('place_bid', { amount: proposedBid }, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Teklif verilemedi');
      } else {
        setSelectedIncrement(0);
      }
    });
  };

  // Helper to check if an increment button should be disabled
  const isIncrementDisabled = (increment: number) => {
    if (phase === 'opening') {
      return increment > (myMaxBid || 0);
    }
    // In bidding phase, check if currentHighestBid + increment exceeds myMaxBid
    const wouldBid = currentHighestBid + increment;
    return wouldBid > (myMaxBid || 0);
  };

  // Opening phase
  if (phase === 'opening') {
    if (!isMyTurn) {
      return (
        <div className="card" style={{ textAlign: 'center' }}>
          <Timer endsAt={openingEndsAt} />
          <h3 style={{ fontSize: '20px', marginTop: '20px', color: 'var(--white)' }}>
            {currentOpener?.nickname} açılış teklifi veriyor...
          </h3>
        </div>
      );
    }

    return (
      <div className="card" style={{ textAlign: 'center' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
          <button
            className="secondary-button"
            onClick={() => placeBid((phase === 'opening' ? 0 : currentHighestBid) + 1)}
            disabled={isIncrementDisabled(1)}
            style={{
              height: '50px',
              fontSize: '20px',
              background: 'var(--dark)',
              color: 'var(--white)',
            }}
          >
            +1
          </button>
          <button
            className="secondary-button"
            onClick={() => placeBid((phase === 'opening' ? 0 : currentHighestBid) + 2)}
            disabled={isIncrementDisabled(2)}
            style={{
              height: '50px',
              fontSize: '20px',
              background: 'var(--dark)',
              color: 'var(--white)',
            }}
          >
            +2
          </button>
          <button
            className="secondary-button"
            onClick={() => placeBid((phase === 'opening' ? 0 : currentHighestBid) + 5)}
            disabled={isIncrementDisabled(5)}
            style={{
              height: '50px',
              fontSize: '20px',
              background: 'var(--dark)',
              color: 'var(--white)',
            }}
          >
            +5
          </button>
        </div>

        <button
          className="primary-button"
          onClick={() => placeBid(minBid)}
          disabled={pending || minBid > (myMaxBid || 0)}
          style={{
            width: '100%',
            height: '64px',
            fontSize: '24px',
          }}
        >
          {minBid > (myMaxBid || 0) ? `Limit: ${myMaxBid || 0} altın` : `TEKLİF VER · ${minBid}`}
        </button>
          {feedback && (
            <p data-testid="bid-feedback" style={{ marginTop: 8, textAlign: 'center', fontWeight: 700, color: feedback.ok ? 'var(--turquoise)' : 'var(--pomegranate, #F0386B)' }}>{feedback.text}</p>
          )}

        {!canAfford && proposedBid > 0 && (
          <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--pomegranate)' }}>
            Bu teklif altın limitini aşar
          </p>
        )}
      </div>
    );
  }

  // Bidding phase
  if (phase === 'bidding') {
    // Show settled banner when everyone passed
    if (isAuctionSettled) {
      return (
        <div className="card">
          <div style={{
            padding: '20px',
            background: 'var(--saffron)',
            border: '2px solid var(--saffron)',
            borderRadius: '14px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dark)' }}>
              Herkes pas dedi – SATILDI!
            </p>
          </div>
        </div>
      );
    }

    const showPassButton = !amIHighestBidder && !passedPlayerIds.includes(myPlayerId || '') && !hasPassed && hasEmptySlot;

    return (
      <div className="card">
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
        ) : hasPassed ? (
          <div style={{
            padding: '20px',
            background: 'var(--dark)',
            border: '2px solid var(--pomegranate)',
            borderRadius: '14px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--pomegranate)' }}>
              Pas dedin
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <button
                className="secondary-button"
                onClick={() => placeBid((phase === 'opening' ? 0 : currentHighestBid) + 1)}
                disabled={currentHighestBid + 1 > (myMaxBid || 0)}
                style={{
                  height: '50px',
                  fontSize: '20px',
                  background: 'var(--dark)',
                  color: 'var(--white)',
                }}
              >
                +1
              </button>
              <button
                className="secondary-button"
                onClick={() => placeBid((phase === 'opening' ? 0 : currentHighestBid) + 2)}
                disabled={currentHighestBid + 2 > (myMaxBid || 0)}
                style={{
                  height: '50px',
                  fontSize: '20px',
                  background: 'var(--dark)',
                  color: 'var(--white)',
                }}
              >
                +2
              </button>
              <button
                className="secondary-button"
                onClick={() => placeBid((phase === 'opening' ? 0 : currentHighestBid) + 5)}
                disabled={currentHighestBid + 5 > (myMaxBid || 0)}
                style={{
                  height: '50px',
                  fontSize: '20px',
                  background: 'var(--dark)',
                  color: 'var(--white)',
                }}
              >
                +5
              </button>
            </div>

            <button
              className="primary-button"
              onClick={() => placeBid(minBid)}
              disabled={pending || minBid > (myMaxBid || 0)}
              style={{
                width: '100%',
                height: '64px',
                fontSize: '24px',
              }}
            >
              {minBid > (myMaxBid || 0) ? `Limit: ${myMaxBid || 0} altın` : `TEKLİF VER · ${minBid}`}
            </button>

            {showPassButton && (
              <button
                className="secondary-button"
                onClick={handlePass}
                disabled={passPending}
                style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '18px',
                  marginTop: '10px',
                  background: 'var(--dark)',
                  border: '2px solid var(--pomegranate)',
                  color: 'var(--pomegranate)',
                }}
              >
                PAS
              </button>
            )}

          {feedback && (
            <p data-testid="bid-feedback" style={{ marginTop: 8, textAlign: 'center', fontWeight: 700, color: feedback.ok ? 'var(--turquoise)' : 'var(--pomegranate, #F0386B)' }}>{feedback.text}</p>
          )}

            {selectedIncrement > 0 && !canAfford && (
              <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--pomegranate)', textAlign: 'center' }}>
                Bu teklif altın limitini aşar
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
