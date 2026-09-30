import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import RankingCard from '../components/RankingCard';

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
  ranking: { player: string; rank: number; reason: string }[] | null;
  commentary: string | null;
}

interface ResultsScreenProps {
  socket: Socket | null;
  gameState: GameState | null;
}

export default function ResultsScreen({ socket, gameState }: ResultsScreenProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState?.phase === 'waiting') {
      navigate('/');
    }
  }, [gameState?.phase, navigate]);

  if (!gameState || !gameState.ranking) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const myPlayerId = socket?.id;
  const isHost = gameState.hostId === myPlayerId;

  const handleRematch = () => {
    if (!socket) return;
    socket.emit('rematch', {}, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Yeniden oyun başlatılamadı');
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
      }}>
        <h1 style={{
          fontSize: '48px',
          fontFamily: 'var(--font-heading)',
          textAlign: 'center',
          marginBottom: '40px',
          color: 'var(--saffron)',
        }}>
          BAZAAR KAPANDI!
        </h1>

        {/* Ranking cards */}
        <div style={{ marginBottom: '40px' }}>
          {gameState.ranking.map((entry) => {
            const player = gameState.players.find(p => p.nickname === entry.player);
            return (
              <RankingCard
                key={entry.rank}
                rank={entry.rank}
                player={entry.player}
                items={player?.slots || [null, null, null]}
                reason={entry.reason}
              />
            );
          })}
        </div>

        {/* Judge's commentary in arch card style */}
        {gameState.commentary && (
          <div
            style={{
              background: 'var(--saffron)',
              border: '3px solid var(--dark)',
              borderRadius: '20px 20px 0 0',
              padding: '30px 25px 25px',
              textAlign: 'center',
              position: 'relative',
              marginBottom: '40px',
              boxShadow: '0 6px 0 var(--dark)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '70px solid transparent',
                borderRight: '70px solid transparent',
                borderBottom: '35px solid var(--saffron)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-21px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '73px solid transparent',
                borderRight: '73px solid transparent',
                borderBottom: '38px solid var(--dark)',
              }}
            />
            <p style={{
              fontSize: '18px',
              fontStyle: 'italic',
              lineHeight: '1.6',
              color: 'var(--dark)',
              fontWeight: 600,
            }}>
              "{gameState.commentary}"
            </p>
          </div>
        )}

        {/* Rematch button */}
        {isHost && (
          <button
            className="primary-button"
            onClick={handleRematch}
            style={{ width: '100%', fontSize: '24px', padding: '20px' }}
          >
            Yeniden Oyna
          </button>
        )}

        {!isHost && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '16px' }}>
            Ev sahibi yeni oyun başlatabilir
          </p>
        )}
      </div>
    </div>
  );
}
