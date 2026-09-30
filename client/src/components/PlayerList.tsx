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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {players.map((player) => {
        const isActive = player.id === currentPlayerId;
        return (
          <div 
            key={player.id} 
            className={`player-card ${isActive ? 'active' : ''}`}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                {player.nickname}
                {isActive && <span style={{ marginLeft: '8px', fontSize: '12px' }}>SIRA</span>}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                🪙 {player.gold} altın • {player.slots.filter(s => s !== null).length}/3 slot
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
