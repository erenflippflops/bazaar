interface Item {
  name: string;
  description: string;
}

interface PodiumPlayer {
  nickname: string;
  position: number;
  items: (Item | null)[];
}

interface PodiumProps {
  players: PodiumPlayer[];
}

export default function Podium({ players }: PodiumProps) {
  // Sort players by position (1st, 2nd, 3rd)
  const topThree = players.slice(0, 3);

  const getPlayerByPosition = (pos: number) =>
    topThree.find(p => p.position === pos);

  const first = getPlayerByPosition(1);
  const second = getPlayerByPosition(2);
  const third = getPlayerByPosition(3);

  const renderPodium = (player: PodiumPlayer | undefined, height: number, bgColor: string, position: number) => {
    if (!player) return null;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: 800
        }}>
          {position === 1 ? `👑 ${player.nickname}` : player.nickname}
        </span>
        <div style={{
          width: '120px',
          height: `${height}px`,
          background: bgColor,
          border: '3px solid var(--dark)',
          borderRadius: '12px 12px 0 0',
          boxShadow: '0 6px 0 var(--dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-heading)',
          fontSize: '52px',
          color: 'var(--dark)',
        }}>
          {position}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: '14px',
    }}>
      {renderPodium(second, 110, '#2EC4B6', 2)}
      {renderPodium(first, 150, '#FFC93C', 1)}
      {renderPodium(third, 80, '#F0386B', 3)}
    </div>
  );
}
