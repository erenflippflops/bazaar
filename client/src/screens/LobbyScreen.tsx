import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { Theme } from '../types';

interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: any[];
  token: string;
}

interface GameState {
  phase: string;
  hostId: string;
  players: Player[];
  roomCode?: string;
  theme?: Theme;
}

interface LobbyScreenProps {
  socket: Socket | null;
  gameState: GameState | null;
}

export default function LobbyScreen({ socket, gameState }: LobbyScreenProps) {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!gameState) {
      navigate('/');
    } else if (gameState?.phase === 'briefing') {
      navigate('/briefing');
    } else if (gameState?.phase === 'playing' || gameState?.phase === 'opening' || gameState?.phase === 'bidding') {
      navigate('/game');
    }
  }, [gameState, navigate]);

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start_game', {}, (response: any) => {
      if (response?.success === false) {
        setError(response.error || 'Oyun başlatılamadı');
      }
    });
  };

  if (!gameState) {
    return null;
  }

  const isHost = gameState?.hostId === socket?.id;
  const playerCount = gameState?.players?.length || 0;
  const canStart = isHost && playerCount >= 2;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px' }}>BAZAAR</h1>

      {gameState.theme && (
        <div className="card" style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>{gameState.theme.emoji}</div>
          <h3 style={{ fontSize: '20px', color: 'var(--saffron)' }}>{gameState.theme.name.tr}</h3>
        </div>
      )}

      <div className="card" style={{ marginBottom: '30px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', marginBottom: '10px', fontSize: '14px' }}>ODA KODU</p>
        <h2 style={{ fontSize: '64px', letterSpacing: '8px', marginBottom: '15px' }}>
          {gameState?.roomCode || '----'}
        </h2>
        <button
          className="secondary-button"
          onClick={() => {
            if (gameState?.roomCode) {
              navigator.clipboard.writeText(gameState.roomCode);
            }
          }}
        >
          Kodu Kopyala
        </button>
      </div>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--white)' }}>Oyuncular ({playerCount})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {gameState?.players?.map((player) => (
            <div key={player.id} className="player-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{player.nickname}</span>
              {player.id === gameState.hostId && (
                <span style={{ color: 'var(--saffron)', fontSize: '14px' }}>EV SAHİBİ</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <button
          className="primary-button"
          onClick={handleStartGame}
          disabled={!canStart}
          style={{ width: '100%', fontSize: '24px', padding: '16px' }}
        >
          {canStart ? 'Oyunu Başlat' : 'En az 2 oyuncu gerekli'}
        </button>
      )}

      {!isHost && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
          Ev sahibinin oyunu başlatması bekleniyor...
        </div>
      )}

      {error && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'var(--pomegranate)', borderRadius: '12px', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
}
