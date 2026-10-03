import { Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';

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
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>{t('briefing.title')}</h1>

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
            <strong style={{ color: 'var(--primary)' }}>{t('briefing.step1.title')}</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              {t('briefing.step1.text')}
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>{t('briefing.step2.title')}</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              {t('briefing.step2.text')}
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>{t('briefing.step3.title')}</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              {t('briefing.step3.text')}
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>{t('briefing.step4.title')}</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              {t('briefing.step4.text')}
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--primary)' }}>{t('briefing.step5.title')}</strong>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text)' }}>
              {t('briefing.step5.text')}
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
        {t('briefing.readyCount', { ready: readyCount, total: totalPlayers })}
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
        {isReady ? t('briefing.readyButtonDone') : t('briefing.readyButton')}
      </button>
    </div>
  );
}

export default BriefingScreen;
