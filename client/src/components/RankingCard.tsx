import { t } from '../i18n';

interface Item {
  name: string;
  description: string;
}

interface RankingCardProps {
  position: number;
  nickname: string;
  items: (Item | null)[];
  commentary: string;
}

export default function RankingCard({ position, nickname, items, commentary }: RankingCardProps) {
  const isFirst = position === 1;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 14px',
      background: 'var(--dark)',
      border: isFirst ? '3px solid var(--saffron)' : '2px solid rgba(46, 196, 182, 0.55)',
      borderRadius: '14px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: 800,
        }}>
          {nickname}
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '20px',
          color: 'var(--saffron)',
        }}>
          {position}.
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
      }}>
        {items.map((item, idx) => (
          <span
            key={idx}
            style={{
              flex: '0 0 auto',
              minWidth: 0,
              padding: '4px 8px',
              borderRadius: '8px',
              background: 'rgba(255, 201, 60, 0.16)',
              border: '1.5px solid var(--saffron)',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item?.name || t('results.emptySlot')}
          </span>
        ))}
      </div>

      <span style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#C9CBFF',
      }}>
        {commentary}
      </span>
    </div>
  );
}
