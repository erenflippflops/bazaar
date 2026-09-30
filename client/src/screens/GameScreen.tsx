import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import WheelDisplay from '../components/WheelDisplay';
import PlayerList from '../components/PlayerList';
import AuctionPanel from '../components/AuctionPanel';
import ItemCard from '../components/ItemCard';
import JudgeWaiting from '../components/JudgeWaiting';

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

  if (!gameState) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.token === localStorage.getItem('playerToken'));
  const currentOpener = gameState.players[gameState.currentOpenerIndex];
  const isMyTurn = currentOpener?.id === myPlayer?.id;
  const isHost = gameState.hostId === myPlayer?.id;

  const handleSpinWheel = () => {
    if (!socket) return;
    socket.emit('spin_wheel', {}, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Çark çevrilemedi');
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>ODA: {gameState.roomCode}</p>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>MEZAT: {gameState.auctionNumber || 1}/6</p>
        </div>
        {myPlayer && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: 'var(--saffron)' }}>
              🪙 {myPlayer.gold}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
              Slot: {myPlayer.slots.filter(s => s !== null).length}/3
            </p>
          </div>
        )}
      </div>

      {/* My slots */}
      {myPlayer && (
        <div style={{ marginBottom: '20px' }}>
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

      {/* Wheel */}
      <WheelDisplay itemCount={gameState.wheel.length} />

      {/* Current item */}
      {gameState.revealedItem && gameState.phase !== 'playing' && (
        <ItemCard item={gameState.revealedItem} />
      )}

      {/* Turn/Auction status */}
      <div style={{ marginTop: '30px', marginBottom: '30px' }}>
        {gameState.phase === 'playing' && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--white)' }}>
              {isMyTurn ? 'Senin sıran!' : `${currentOpener?.nickname} çarkı çeviriyor...`}
            </h3>
            {isMyTurn && (
              <button 
                className="primary-button" 
                onClick={handleSpinWheel}
                style={{ width: '100%', fontSize: '24px', padding: '20px' }}
              >
                ÇARKI ÇEVİR
              </button>
            )}
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
          />
        )}

        {(gameState.phase === 'judging' || gameState.phase === 'judge_failed') && (
          <JudgeWaiting socket={socket} gameState={gameState} isHost={isHost} />
        )}
      </div>

      {/* Player list */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--muted)' }}>Oyuncular</h3>
        <PlayerList 
          players={gameState.players} 
          currentPlayerId={gameState.phase === 'playing' ? currentOpener?.id : undefined}
        />
      </div>
    </div>
  );
}
