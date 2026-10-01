import { Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

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
  ranking: { player: string; rank: number; reason: string }[] | null;
  commentary: string | null;
}

interface JudgeWaitingProps {
  socket: Socket | null;
  gameState: GameState;
  isHost: boolean;
}

export default function JudgeWaiting({ socket, gameState, isHost }: JudgeWaitingProps) {
  const [rotation, setRotation] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (gameState.phase === 'judging' && !prefersReducedMotion) {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [gameState.phase, prefersReducedMotion]);

  const handleRetry = () => {
    if (!socket) return;
    socket.emit('retry_judge', {}, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Hakem tekrar çalıştırılamadı');
      }
    });
  };

  if (gameState.phase === 'judging') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            border: '8px solid var(--turquoise)',
            borderTopColor: 'var(--saffron)',
            borderRadius: '50%',
            margin: '0 auto 30px',
            transform: prefersReducedMotion ? 'none' : `rotate(${rotation}deg)`,
          }}
        />
        <h3 style={{
          fontSize: '28px',
          fontFamily: 'var(--font-heading)',
          color: 'var(--white)',
          marginBottom: '15px',
        }}>
          Hakem düşünüyor...
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '16px' }}>
          Koleksiyonlar değerlendiriliyor
        </p>
      </div>
    );
  }

  if (gameState.phase === 'judge_failed') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{
          fontSize: '28px',
          fontFamily: 'var(--font-heading)',
          color: 'var(--pomegranate)',
          marginBottom: '20px',
        }}>
          Hakem Kafayı Yedi!
        </h3>
        <p style={{
          fontSize: '16px',
          color: 'var(--muted)',
          marginBottom: '30px',
          lineHeight: '1.5',
        }}>
          Sıralamada bir sorun oluştu. {isHost ? 'Hakemi tekrar çalıştırabilirsin.' : 'Ev sahibi hakemi tekrar çalıştırabilir.'}
        </p>
        {isHost && (
          <button
            className="primary-button"
            onClick={handleRetry}
            style={{ width: '100%', fontSize: '20px', padding: '16px' }}
          >
            Tekrar Dene
          </button>
        )}
      </div>
    );
  }

  return null;
}
