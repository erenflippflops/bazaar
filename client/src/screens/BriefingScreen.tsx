import { Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface BriefingScreenProps {
  socket: Socket;
  gameState: any;
}

function BriefingScreen({ socket, gameState }: BriefingScreenProps) {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState?.phase === 'playing' || gameState?.phase === 'opening' || gameState?.phase === 'bidding') {
      navigate('/game');
    }
  }, [gameState?.phase, navigate]);

  const handleReady = () => {
    socket.emit('ready_briefing', {}, (response: any) => {
      if (response?.success) {
        setIsReady(true);
      }
    });
  };

  const myPlayer = gameState?.players?.find((p: any) => p.isMe);
  const readyCount = gameState?.briefingReadyPlayers?.length || 0;
  const totalPlayers = gameState?.players?.length || 0;

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Nasıl Oynanır?</h1>

      <div style={{
        background: 'var(--card-bg)',
        border: '2px solid var(--border)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          <div>
            <strong style={{ color: 'var(--primary)' }}>1. Çark Çevir</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              Sıra sende mi? ÇARK ÇEVİR butonuna tıkla ve rastgele bir süper güç çıkar.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>2. Açılış Teklifi</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              Çarkı sen çevirdin mi? İlk teklifi sen verirsin (1-18 altın arası).
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>3. Artır veya Pas</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              +1, +2 veya +5 ile teklifi artır. İstemiyorsan PAS de. Herkes pas derse en yüksek teklif kazanır.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>4. Altın Limiti</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              Boş slotların için altın ayır. 2 boş slot = en fazla 18 altın teklif edebilirsin.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>5. Hakem</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              Herkes 3 güç topladı mı? Yapay zeka hakem sıralar ve kazananı açıklar.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        color: 'var(--muted)',
        fontSize: '14px'
      }}>
        {readyCount} / {totalPlayers} oyuncu hazır
      </div>

      <button
        onClick={handleReady}
        disabled={isReady}
        style={{
          padding: '15px 40px',
          fontSize: '20px',
          fontWeight: 'bold',
          background: isReady ? 'var(--muted)' : 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isReady ? 'not-allowed' : 'pointer',
          opacity: isReady ? 0.6 : 1,
          margin: '0 auto',
          display: 'block'
        }}
      >
        {isReady ? 'Hazırsın ✓' : 'Hazırım!'}
      </button>
    </div>
  );
}

export default BriefingScreen;
