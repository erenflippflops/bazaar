import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface GameState {
  phase: string;
  hostId: string;
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

  if (!gameState) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const isHost = gameState.hostId === socket?.id;

  const handleRematch = () => {
    if (!socket) return;
    socket.emit('rematch', {}, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Yeniden oyun başlatılamadı');
      }
    });
  };

  const handleRetryJudge = () => {
    if (!socket) return;
    socket.emit('retry_judge', {}, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Hakem tekrar çalıştırılamadı');
      }
    });
  };

  if (gameState.phase === 'judge_failed') {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '40px', color: 'var(--pomegranate)' }}>
          Hakem Kafayı Yedi!
        </h1>
        
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Sıralamada bir sorun oluştu. Ev sahibi hakemi tekrar çalıştırabilir.
          </p>
          
          {isHost && (
            <button 
              className="primary-button" 
              onClick={handleRetryJudge}
              style={{ width: '100%', fontSize: '20px', padding: '16px' }}
            >
              Hakemi Tekrar Çalıştır
            </button>
          )}
          
          {!isHost && (
            <p style={{ color: 'var(--muted)' }}>
              Ev sahibinin hakemi tekrar çalıştırması bekleniyor...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (gameState.phase === 'finished') {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '40px' }}>
          Bazaar Kapandı!
        </h1>
        
        {/* Ranking */}
        <div style={{ marginBottom: '40px' }}>
          {gameState.ranking?.map((entry, index) => (
            <div 
              key={entry.rank}
              className="card"
              style={{ 
                marginBottom: '20px',
                background: index === 0 ? 'var(--saffron)' : 'var(--dark)',
                color: index === 0 ? 'var(--dark)' : 'var(--white)',
                padding: '30px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                {index === 0 && <span style={{ fontSize: '32px', marginRight: '10px' }}>👑</span>}
                <h2 style={{ 
                  fontSize: '32px', 
                  fontFamily: 'var(--font-heading)',
                  color: index === 0 ? 'var(--dark)' : 'var(--saffron)',
                }}>
                  {entry.rank}. {entry.player}
                </h2>
              </div>
              <p style={{ 
                fontSize: '16px',
                lineHeight: '1.6',
                color: index === 0 ? 'var(--dark)' : 'var(--muted)',
              }}>
                {entry.reason}
              </p>
            </div>
          ))}
        </div>

        {/* Commentary */}
        {gameState.commentary && (
          <div 
            style={{
              background: 'var(--saffron)',
              color: 'var(--dark)',
              padding: '30px',
              borderRadius: '20px 20px 0 0',
              border: '3px solid var(--dark)',
              boxShadow: '0 6px 0 var(--dark)',
              textAlign: 'center',
              position: 'relative',
              marginBottom: '40px',
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '60px solid transparent',
                borderRight: '60px solid transparent',
                borderBottom: '30px solid var(--saffron)',
              }}
            />
            <h3 style={{ 
              fontSize: '20px', 
              fontFamily: 'var(--font-heading)', 
              marginBottom: '15px',
              color: 'var(--dark)',
            }}>
              Hakem'in Sözü
            </h3>
            <p style={{ 
              fontSize: '18px',
              fontStyle: 'italic',
              lineHeight: '1.6',
              color: 'var(--dark)',
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
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>
            Ev sahibi yeni oyun başlatabilir
          </p>
        )}
      </div>
    );
  }

  return null;
}
