import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface Theme {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

const THEMES: Theme[] = [
  {
    id: 'superpowers',
    emoji: '⚡',
    name: 'Süper Güçler',
    description: 'En güçlü ve yaratıcı güç takımı',
  },
  {
    id: 'legendary-fighters',
    emoji: '⚔️',
    name: 'Efsanevi Savaşçılar',
    description: '3\'e 3 takım savaşında kim kazanır',
  },
  {
    id: 'halisaha',
    emoji: '⚽',
    name: '4\'lü Halı Saha',
    description: 'En iyi 4\'lü futbol takımı',
  },
  {
    id: 'mythical-creatures',
    emoji: '🐉',
    name: 'Mitolojik Yaratıklar',
    description: 'En güçlü yaratık takımı',
  },
];

interface HomeScreenProps {
  socket: Socket | null;
}

export default function HomeScreen({ socket }: HomeScreenProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('superpowers');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!socket) {
      setError('Bağlantı yok');
      return;
    }
    if (nickname.length < 1 || nickname.length > 16) {
      setError('İsim 1-16 karakter olmalı');
      return;
    }

    socket.emit('create_room', { nickname, themeId: selectedTheme }, (response: any) => {
      if (response?.success === false) {
        setError(response.error || 'Oda oluşturulamadı');
      } else if (response?.roomCode && response?.token) {
        sessionStorage.setItem('roomCode', response.roomCode);
        sessionStorage.setItem('playerToken', response.token);
        sessionStorage.setItem('playerId', response.playerId);
        setError('');
        navigate('/lobby');
      }
    });
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '40px' }}>BAZAAR</h1>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>Konsept Seç</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '15px',
        }}>
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className="card"
              onClick={() => setSelectedTheme(theme.id)}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: '20px',
                border: selectedTheme === theme.id ? '3px solid var(--saffron)' : '3px solid var(--dark)',
                background: selectedTheme === theme.id ? 'var(--pomegranate)' : 'var(--burgundy)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>{theme.emoji}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{theme.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4' }}>
                {theme.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Oda Oluştur</h2>
        <input
          type="text"
          placeholder="İsmin"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={16}
          style={{ width: '100%', marginBottom: '15px' }}
        />
        <button className="primary-button" onClick={handleCreateRoom} style={{ width: '100%' }}>
          ODA OLUŞTUR
        </button>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          background: 'var(--pomegranate)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
