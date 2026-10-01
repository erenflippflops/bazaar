import { useEffect } from 'react';
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
  wheel: Item[];
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
  const totalAuctions = gameState.players.length * 3;

  const handleSpinWheel = () => {
    if (!socket) {
      alert('Bağlantı koptu, lütfen sayfayı yenileyin');
      return;
    }
    if (!socket.connected) {
      alert('Sunucuya bağlanılamıyor, lütfen bekleyin');
      return;
    }
    console.log('[Client] Sending spin_wheel event');
    socket.emit('spin_wheel', {}, (response: any) => {
      console.log('[Client] spin_wheel response:', response);
      if (response?.success === false) {
        alert(response.error || 'Çark çevrilemedi');
      }
    });
  };

  return (
    <div className="game-screen">
      <LanternString />

      {/* Header */}
      <header className="game-header">
        <span className="bazaar-logo">BAZAAR</span>
        <div className="room-info">
          <span className="room-code">ODA {gameState.roomCode} · SÜPER GÜÇLER</span>
          <span className="auction-number">MEZAT {gameState.auctionNumber || 1}/{totalAuctions}</span>
        </div>
      </header>

      {/* Mobile: Compact player cards */}
      <section className="mobile-players">
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`mobile-player-card ${player.id === currentOpener?.id ? 'current-turn' : ''}`}
          >
            <div className="mobile-player-header">
              <span className="player-name">{player.nickname}</span>
              {player.id === myPlayer?.id && <span className="player-label">SEN</span>}
              {player.id === currentOpener?.id && <span className="player-label">SIRA</span>}
            </div>
            <div className="mobile-player-stats">
              <span className="gold-amount">{player.gold} <span className="muted">altın</span></span>
              <span className="slot-dots">
                {player.slots.map((slot, i) => (
                  <span
                    key={i}
                    className={`slot-dot ${slot ? 'filled' : 'empty'}`}
                  />
                ))}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Main layout */}
      <div className="game-layout">
        {/* Left sidebar: Players */}
        <aside className="players-sidebar">
          <span className="sidebar-title">OYUNCULAR VE KOLEKSİYONLAR</span>
          <PlayerList
            players={gameState.players}
            currentPlayerId={gameState.phase === 'playing' ? currentOpener?.id : undefined}
          />
        </aside>

        {/* Center: Wheel + Spin button or Item card */}
        <main className="wheel-area">
          <WheelDisplay
            itemCount={gameState.wheel.length}
            isAuctionActive={gameState.phase === 'opening' || gameState.phase === 'bidding'}
          />

          {gameState.phase === 'playing' && isMyTurn && (
            <button
              className="spin-button"
              onClick={handleSpinWheel}
            >
              ÇARKI ÇEVİR
            </button>
          )}

          {gameState.revealedItem && (
            <div className="item-card-container">
              <ArchCard item={gameState.revealedItem} />
            </div>
          )}
        </main>

        {/* Right sidebar: Auction panel */}
        <aside className="auction-sidebar">
          {gameState.phase === 'playing' && !isMyTurn && (
            <div className="waiting-message">
              <h3>{currentOpener?.nickname} çarkı çeviriyor...</h3>
            </div>
          )}

          {(gameState.phase === 'opening' || gameState.phase === 'bidding') && (
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
              revealedItem={gameState.revealedItem || undefined}
            />
          )}

          {(gameState.phase === 'judging' || gameState.phase === 'judge_failed') && (
            <JudgeWaiting socket={socket} gameState={gameState} isHost={isHost} />
          )}
        </aside>
      </div>

      <style>{`
        .game-screen {
          min-height: 100vh;
          padding: 10px 16px 16px;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .game-header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0 10px;
          margin-top: -8px;
          margin-bottom: 10px;
          z-index: 2;
        }

        .bazaar-logo {
          font-family: 'Bungee', 'Impact', sans-serif;
          font-size: 28px;
          color: var(--saffron);
          text-shadow: 3px 3px 0 var(--coral);
        }

        .room-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .room-code {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--muted);
        }

        .auction-number {
          font-family: 'Bungee', 'Impact', sans-serif;
          font-size: 14px;
          color: var(--teal);
        }

        /* Mobile player cards */
        .mobile-players {
          position: relative;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          margin-bottom: 10px;
        }

        .mobile-player-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 7px 8px;
          background: var(--card-bg);
          border: 2px solid rgba(46, 196, 182, 0.55);
          border-radius: 12px;
        }

        .mobile-player-card.current-turn {
          background: var(--coral);
        }

        .mobile-player-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .player-name {
          font-size: 14px;
          font-weight: 800;
        }

        .player-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--muted);
        }

        .mobile-player-card.current-turn .player-label {
          color: var(--white);
        }

        .mobile-player-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .gold-amount {
          font-size: 13px;
          font-weight: 700;
        }

        .gold-amount .muted {
          font-weight: 600;
          color: var(--muted);
        }

        .mobile-player-card.current-turn .gold-amount .muted {
          color: var(--white);
        }

        .slot-dots {
          display: flex;
          gap: 3px;
        }

        .slot-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .slot-dot.filled {
          background: var(--saffron);
        }

        .slot-dot.empty {
          background: rgba(255, 255, 255, 0.22);
        }

        /* Layout */
        .game-layout {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .players-sidebar {
          display: none;
        }

        .wheel-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 10px 0 0;
        }

        .item-card-container {
          margin-top: -34px;
          width: 100%;
          max-width: 300px;
        }

        .spin-button {
          margin-top: 20px;
          width: 100%;
          max-width: 440px;
          height: 60px;
          border: 3px solid var(--card-bg);
          border-radius: 16px;
          background: var(--saffron);
          color: var(--card-bg);
          box-shadow: 0 6px 0 var(--card-bg);
          font-family: 'Bungee', 'Impact', sans-serif;
          font-size: 24px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .spin-button:hover {
          transform: translateY(2px);
          box-shadow: 0 4px 0 var(--card-bg);
        }

        .spin-button:active {
          transform: translateY(6px);
          box-shadow: 0 0 0 var(--card-bg);
        }

        .auction-sidebar {
          width: 100%;
        }

        .waiting-message {
          padding: 16px;
          background: var(--card-bg);
          border: 2px solid rgba(46, 196, 182, 0.55);
          border-radius: 16px;
          text-align: center;
        }

        .waiting-message h3 {
          font-size: 18px;
          color: var(--white);
        }

        .sidebar-title {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--muted);
        }

        /* Desktop layout */
        @media (min-width: 1024px) {
          .game-screen {
            padding: 10px 40px 32px;
          }

          .game-header {
            padding: 0 0 6px;
            margin-top: -18px;
            margin-bottom: 10px;
          }

          .bazaar-logo {
            font-size: 40px;
            text-shadow: 4px 4px 0 var(--coral);
          }

          .room-code {
            font-size: 14px;
          }

          .auction-number {
            font-size: 18px;
          }

          .mobile-players {
            display: none;
          }

          .game-layout {
            display: grid;
            grid-template-columns: 320px minmax(0, 1fr) 360px;
            gap: 36px;
            max-width: 1440px;
            margin: 0 auto;
          }

          .players-sidebar {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .wheel-area {
            padding-top: 4px;
          }

          .item-card-container {
            margin-top: -60px;
            max-width: 440px;
          }

          .spin-button {
            margin-top: 40px;
          }

          .auction-sidebar {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
        }

        /* Tablet and larger screens */
        @media (min-width: 768px) and (max-width: 1023px) {
          .game-screen {
            padding: 16px 24px 24px;
          }

          .mobile-players {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
          }

          .mobile-player-card {
            padding: 10px 12px;
          }

          .player-name {
            font-size: 16px;
          }

          .gold-amount {
            font-size: 15px;
          }
        }

        /* Extra small phones */
        @media (max-width: 360px) {
          .player-name {
            font-size: 12px;
          }

          .gold-amount {
            font-size: 11px;
          }
        }

        /* Large desktops */
        @media (min-width: 1440px) {
          .game-layout {
            max-width: 1440px;
          }
        }

        /* Very small screens - prevent horizontal scroll */
        @media (max-width: 360px) {
          .game-screen {
            padding: 10px 12px 16px;
          }

          .bazaar-logo {
            font-size: 24px;
          }

          .mobile-players {
            gap: 4px;
          }

          .mobile-player-card {
            padding: 5px 6px;
            gap: 3px;
          }
        }
      `}</style>
    </div>
  );
}
