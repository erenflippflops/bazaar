import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { Background } from '../components/Background';
import { Lanterns } from '../components/Lanterns';
import { Header } from '../components/Header';
import Podium from '../components/Podium';
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

  // Prepare podium players (top 3)
  const podiumPlayers = gameState.ranking.slice(0, 3).map(entry => {
    const player = gameState.players.find(p => p.nickname === entry.player);
    return {
      nickname: entry.player,
      position: entry.rank,
      items: player?.slots || [],
    };
  });

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Background />
      <Lanterns stage="desktop" />
      <Header
        roomCode={gameState.players[0]?.token || ''}
        theme={gameState.theme?.name?.tr || ''}
        auctionNumber={12}
        totalAuctions={12}
        mode="game"
      />

      <div style={{
        position: 'relative',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '22px',
        padding: '10px 40px 32px',
        overflowY: 'auto',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '44px',
          color: 'var(--saffron)',
          textShadow: '4px 4px 0 var(--pink)',
          textAlign: 'center',
        }}>
          BAZAAR KAPANDI!
        </span>

        <div style={{
          width: '1240px',
          display: 'grid',
          gridTemplateColumns: '460px minmax(0, 1fr)',
          gap: '30px',
          alignItems: 'start',
        }}>
          {/* Left column: Podium and judge's commentary */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
          }}>
            <Podium players={podiumPlayers} />

            {/* Judge's commentary */}
            {gameState.commentary && (
              <div style={{ marginTop: '12px' }}>
                <div style={{
                  position: 'relative',
                  width: '440px',
                  height: '150px',
                  filter: 'drop-shadow(0 6px 0 var(--dark))',
                }}>
                  <svg
                    aria-hidden="true"
                    height="150"
                    style={{ position: 'absolute', left: 0, top: 0 }}
                    width="440"
                  >
                    <path
                      d="M0 150 L0 44 C0 26 132 20 185 12 C207 8 220 0 220 0 C220 0 233 8 255 12 C308 20 440 26 440 44 L440 150 Z"
                      fill="var(--saffron)"
                      stroke="var(--dark)"
                      strokeWidth="3"
                    />
                    <path
                      d="M10 140 L10 48 C10 32 136 27 189 20 C207 17 220 11 220 11 C220 11 233 17 251 20 C304 27 430 32 430 48 L430 140 Z"
                      fill="none"
                      stroke="var(--pink)"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '38px',
                    bottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '0 22px',
                    textAlign: 'center',
                    color: 'var(--dark)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '32px',
                      lineHeight: 1,
                    }}>
                      HAKEMİN SON SÖZÜ
                    </span>
                    <span style={{
                      fontSize: '21px',
                      fontWeight: 700,
                    }}>
                      {gameState.commentary}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column: Ranking cards and buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
            }}>
              {gameState.ranking.map((entry) => {
                const player = gameState.players.find(p => p.nickname === entry.player);
                const slots = player?.slots || [];
                return (
                  <RankingCard
                    key={entry.rank}
                    position={entry.rank}
                    nickname={entry.player}
                    items={slots}
                    commentary={entry.reason}
                  />
                );
              })}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              width: '100%',
            }}>
              {isHost ? (
                <>
                  <button
                    onClick={handleRematch}
                    style={{
                      height: '64px',
                      border: '3px solid var(--dark)',
                      borderRadius: '16px',
                      background: 'var(--saffron)',
                      color: 'var(--dark)',
                      boxShadow: '0 6px 0 var(--dark)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    YENİDEN OYNA
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      height: '64px',
                      border: '3px solid var(--saffron)',
                      borderRadius: '16px',
                      background: 'transparent',
                      color: 'var(--saffron)',
                      boxShadow: 'none',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    ÇIK
                  </button>
                </>
              ) : (
                <span style={{
                  gridColumn: '1 / -1',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#C9CBFF',
                  textAlign: 'center',
                }}>
                  Ev sahibi yeni oyun başlatabilir
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
