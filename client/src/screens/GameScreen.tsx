import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import WheelDisplay from '../components/WheelDisplay';
import ArchCard from '../components/ArchCard';
import PlayerList from '../components/PlayerList';
import AuctionPanel from '../components/AuctionPanel';
import JudgeWaiting from '../components/JudgeWaiting';
import LanternString from '../components/LanternString';

interface Item {
  name: string;
  description: string;
}

interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: (Item | null)[];
  token: string;
  maxBid?: number;
}

interface GameState {
  phase: string;
  hostId: string;
  players: Player[];
  wheel: number; // server sends the COUNT only (rule 3)
  revealedItem: Item | null;
  currentOpenerIndex: number;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  auctionEndsAt?: number;
  openingEndsAt?: number;
  roomCode?: string;
  auctionNumber?: number;
}

interface GameScreenProps {
  socket: Socket | null;
  gameState: GameState | null;
}

export default function GameScreen({ socket, gameState }: GameScreenProps) {
  const [landedKey, setLandedKey] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState?.phase === 'finished') {
      navigate('/results');
    }
  }, [gameState?.phase, navigate]);

  // Expose gameState for E2E test debugging
  useEffect(() => {
    if (gameState) {
      (window as any).__gameState = gameState;
    }
  }, [gameState]);

  if (!gameState) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === localStorage.getItem('playerId'));
  const currentOpener = gameState.players[gameState.currentOpenerIndex];
  const isMyTurn = currentOpener?.id === myPlayer?.id;
  const isHost = gameState.hostId === myPlayer?.id;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const auctionActive = gameState.phase === 'opening' || gameState.phase === 'bidding';
  const completedAuctions = gameState.players.reduce((n, p) => n + p.slots.filter(s => s !== null).length, 0);
  const totalAuctions = gameState.players.length * 3;
  const currentAuction = Math.min(totalAuctions, (gameState.phase === 'playing' || auctionActive) ? completedAuctions + 1 : completedAuctions);
  const spinKey = auctionActive && gameState.revealedItem ? `${gameState.wheel}-${gameState.revealedItem.name}` : null;
  const showItem = auctionActive && landedKey === spinKey;

  const handleSpinWheel = () => {
    if (!socket) return;
    socket.emit('spin_wheel', {}, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Çark çevrilemedi');
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '10px' : '20px', position: 'relative' }}>
      <LanternString />
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: typeof window !== 'undefined' && window.innerWidth < 768 ? '10px' : '20px', position: 'relative', zIndex: 2 }}>
        <div>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>ODA: {gameState.roomCode}</p>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>MEZAT: {currentAuction}/{totalAuctions}</p>
        </div>
        {myPlayer && (
          <div style={{ textAlign: 'right' }} className="mobile-only-gold">
            <p style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: 'var(--saffron)' }}>
              {myPlayer.gold}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
              Slot: {myPlayer.slots.filter(s => s !== null).length}/3
            </p>
          </div>
        )}
      </div>

      {/* Mobile: My slots */}
      {myPlayer && (gameState.phase !== 'opening' && gameState.phase !== 'bidding') && (
        <div style={{ marginBottom: '20px' }} className="mobile-only-slots">
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {myPlayer.slots.map((slot, i) => (
              <div
                key={i}
                className="card"
                style={{
                  flex: 1,
                  maxWidth: '120px',
                  padding: '15px 10px',
                  textAlign: 'center',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                {slot ? (
                  <>
                    <p style={{ fontSize: '12px', fontWeight: 700 }}>{slot.name}</p>
                    <p style={{ fontSize: '10px', color: 'var(--muted)' }}>{slot.description}</p>
                  </>
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '14px' }}>boş</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop: 3-column layout */}
      <div className="game-layout">
        {/* Left column: Players with collections */}
        <div className="players-column">
          <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--muted)' }}>Oyuncular</h3>
          <PlayerList
            players={gameState.players}
            currentPlayerId={gameState.phase === 'playing' ? currentOpener?.id : undefined}
          />
        </div>

        {/* Center column: Wheel and arch card */}
        <div className="wheel-column" style={{
          display: auctionActive && isMobile && showItem ? 'none' : 'flex'
        }}>
          <WheelDisplay
            itemCount={gameState.wheel}
            isAuctionActive={auctionActive}
            canSpin={isMyTurn && gameState.phase === 'playing'}
            onSpin={handleSpinWheel}
            revealedName={gameState.revealedItem?.name ?? null}
            spinKey={spinKey}
            onLanded={setLandedKey}
          />
          {showItem && <ArchCard item={gameState.revealedItem} />}
        </div>

        {/* Right column: Auction panel */}
        <div className="auction-column">
          {gameState.phase === 'playing' && (
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--white)' }}>
                {isMyTurn ? 'Senin sıran!' : `${currentOpener?.nickname} çarkı çeviriyor...`}
              </h3>
              {isMyTurn && <p style={{ color: 'var(--muted)', margin: 0 }}>Çarka dokun ya da "ÇARKI ÇEVİR"e bas.</p>}
            </div>
          )}

          {auctionActive && isMobile && showItem && (
            <div style={{ marginBottom: 10 }}><ArchCard item={gameState.revealedItem} /></div>
          )}
          {auctionActive && (
            <AuctionPanel
              socket={socket}
              phase={gameState.phase}
              currentHighestBid={gameState.currentHighestBid}
              currentHighestBidderId={gameState.currentHighestBidderId}
              players={gameState.players}
              myPlayerId={myPlayer?.id}
              myMaxBid={myPlayer?.maxBid}
              auctionEndsAt={gameState.auctionEndsAt}
              openingEndsAt={gameState.openingEndsAt}
              currentOpenerIndex={gameState.currentOpenerIndex}
            />
          )}

          {(gameState.phase === 'judging' || gameState.phase === 'judge_failed') && (
            <JudgeWaiting socket={socket} gameState={gameState} isHost={isHost} />
          )}
        </div>
      </div>

      <style>{`
        /* Mobile-first: single column */
        .game-layout {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .players-column,
        .wheel-column,
        .auction-column {
          width: 100%;
        }

        .wheel-column {
          flex-shrink: 0;
        }

        .mobile-only-gold,
        .mobile-only-slots {
          display: block;
        }

        /* Compact layout on mobile during auction */
        @media (max-width: 767px) {
          .game-layout {
            gap: 10px;
          }
        }

        /* Desktop: 3-column layout */
        @media (min-width: 1024px) {
          .mobile-only-gold,
          .mobile-only-slots {
            display: none;
          }

          .game-layout {
            display: grid;
            grid-template-columns: 320px 1fr 360px;
            gap: 40px;
            max-width: 1440px;
            margin: 0 auto;
          }

          .players-column {
            position: sticky;
            top: 20px;
            align-self: start;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
          }

          .wheel-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
          }

          .auction-column {
            position: sticky;
            top: 20px;
            align-self: start;
          }
        }
      `}</style>
    </div>
  );
}
