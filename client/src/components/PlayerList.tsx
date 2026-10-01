interface Item {
  name: string;
  description: string;
}

interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: (Item | null)[];
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
}

export default function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  const myPlayerId = localStorage.getItem('playerId');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {players.map((player) => {
        const isActive = player.id === currentPlayerId;
        const isMe = player.id === myPlayerId;
        return (
          <div
            key={player.id}
            className={`player-card ${isActive ? 'active' : ''}`}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontWeight: 800, marginBottom: '4px', fontSize: '14px' }}>
                <span>{player.nickname}</span>
                {isMe && <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', color: isActive ? 'var(--white)' : 'var(--muted)' }}>SEN</span>}
                {isActive && !isMe && <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--white)' }}>SIRA</span>}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                {player.gold} <span style={{ fontWeight: 600, color: isActive ? 'var(--white)' : 'var(--muted)' }}>altın</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
              {player.slots.map((slot, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: slot ? 'var(--saffron)' : 'rgba(255,255,255,0.22)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {slot ? slot.name : '—'}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
