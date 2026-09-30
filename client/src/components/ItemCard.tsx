interface Item {
  name: string;
  description: string;
}

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <div 
      style={{
        background: 'var(--saffron)',
        color: 'var(--dark)',
        padding: '20px',
        borderRadius: '20px 20px 0 0',
        border: '3px solid var(--dark)',
        boxShadow: '0 6px 0 var(--dark)',
        textAlign: 'center',
        position: 'relative',
        marginTop: '20px',
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
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', marginBottom: '10px', color: 'var(--dark)' }}>
        {item.name.toUpperCase()}!
      </h3>
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dark)' }}>
        {item.description}
      </p>
    </div>
  );
}
