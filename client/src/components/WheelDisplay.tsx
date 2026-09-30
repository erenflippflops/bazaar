interface WheelDisplayProps {
  itemCount: number;
}

export default function WheelDisplay({ itemCount }: WheelDisplayProps) {
  const segments = itemCount;
  const colors = ['var(--saffron)', 'var(--turquoise)', 'var(--pomegranate)', 'var(--violet)', 'var(--orange)'];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div 
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '8px solid var(--white)',
          background: 'conic-gradient(' + 
            Array.from({ length: segments }, (_, i) => {
              const percent = (i / segments) * 100;
              const nextPercent = ((i + 1) / segments) * 100;
              const color = colors[i % colors.length];
              return `${color} ${percent}% ${nextPercent}%`;
            }).join(', ') + ')',
          position: 'relative',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--saffron)',
            border: '4px solid var(--white)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '25px solid var(--saffron)',
          }}
        />
      </div>
      <p style={{ marginTop: '15px', fontSize: '18px', fontWeight: 600, color: 'var(--muted)' }}>
        Çarkta {itemCount} güç kaldı
      </p>
    </div>
  );
}
