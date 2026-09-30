interface Item {
  name: string;
  description: string;
}

interface RankingCardProps {
  rank: number;
  player: string;
  items: (Item | null)[];
  reason: string;
}

export default function RankingCard({ rank, player, items, reason }: RankingCardProps) {
  const isFirst = rank === 1;

  return (
    <div
      className="card"
      style={{
        background: isFirst ? 'var(--saffron)' : 'var(--dark)',
        border: '2px solid var(--turquoise)',
        borderRadius: '14px',
        padding: isFirst ? '40px 30px' : '30px',
        marginBottom: '20px',
        opacity: isFirst ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
        <span style={{
          fontSize: isFirst ? '48px' : '32px',
          fontFamily: 'var(--font-heading)',
          color: isFirst ? 'var(--dark)' : 'var(--saffron)',
        }}>
          {rank}
        </span>
        <h2 style={{
          fontSize: isFirst ? '32px' : '24px',
          fontFamily: 'var(--font-heading)',
          color: isFirst ? 'var(--dark)' : 'var(--white)',
        }}>
          {player}
        </h2>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '15px',
        flexWrap: 'wrap',
      }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '6px 12px',
              background: isFirst ? 'rgba(11, 12, 63, 0.3)' : 'rgba(255, 201, 60, 0.15)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: isFirst ? 'var(--dark)' : 'var(--saffron)',
            }}
          >
            {item?.name || 'boş'}
          </div>
        ))}
      </div>

      <p style={{
        fontSize: '16px',
        lineHeight: '1.6',
        color: isFirst ? 'var(--dark)' : 'var(--muted)',
      }}>
        {reason}
      </p>
    </div>
  );
}
