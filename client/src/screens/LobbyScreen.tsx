import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';

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
}

interface LobbyScreenProps {
  socket: Socket | null;
  gameState: GameState | null;
}

export default function LobbyScreen({ socket, gameState }: LobbyScreenProps) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState?.phase === 'playing' || gameState?.phase === 'opening' || gameState?.phase === 'bidding') {
      navigate('/game');
    }
  }, [gameState?.phase, navigate]);

  const handleCreateRoom = () => {
    if (!socket) {
      return;
    }
    if (nickname.length < 1 || nickname.length > 16) {
      setError('İsim 1-16 karakter olmalı');
      return;
    }

    socket.emit('create_room', { nickname }, (response: any) => {
      if (response?.success === false) {
        setError(response.error || 'Oda oluşturulamadı');
      } else if (response?.roomCode && response?.token) {
        localStorage.setItem('roomCode', response.roomCode);
        localStorage.setItem('playerToken', response.token);
        setMode('create');
        setError('');
      }
    });
  };

  const handleJoinRoom = () => {
    if (!socket) return;
    if (roomCode.length < 4 || roomCode.length > 6) {
      setError('Oda kodu 4-6 karakter olmalı');
      return;
    }
    if (nickname.length < 1 || nickname.length > 16) {
      setError('İsim 1-16 karakter olmalı');
      return;
    }

    socket.emit('join_room', { roomCode: roomCode.toUpperCase(), nickname }, (response: any) => {
      if (response?.success === false) {
        setError(response.error || 'Odaya katılınamadı');
      } else if (response?.token) {
        localStorage.setItem('roomCode', roomCode.toUpperCase());
        localStorage.setItem('playerToken', response.token);
        setMode('join');
        setError('');
      }
    });
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start_game', {}, (response: any) => {
      if (response?.success === false) {
        setError(response.error || 'Oyun başlatılamadı');
      }
    });
  };

  const isHost = gameState?.hostId === socket?.id;
  const playerCount = gameState?.players?.length || 0;
  const canStart = isHost && playerCount >= 2;

  if (mode === 'home') {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '60px' }}>BAZAAR</h1>
        
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Oda Kur</h2>
          <input
            type="text"
            placeholder="İsmin"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={16}
            style={{ width: '100%', marginBottom: '15px' }}
          />
          <button className="primary-button" onClick={handleCreateRoom} style={{ width: '100%' }}>
            Oda Kur
          </button>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Odaya Katıl</h2>
          <input
            type="text"
            placeholder="Oda Kodu"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ width: '100%', marginBottom: '15px', textTransform: 'uppercase' }}
          />
          <input
            type="text"
            placeholder="İsmin"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={16}
            style={{ width: '100%', marginBottom: '15px' }}
          />
          <button className="primary-button" onClick={handleJoinRoom} style={{ width: '100%' }}>
            Katıl
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'var(--pomegranate)', borderRadius: '12px', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px' }}>BAZAAR</h1>
      
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
