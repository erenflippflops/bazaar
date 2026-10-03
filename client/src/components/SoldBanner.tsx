import { useEffect, useState } from 'react';

interface SoldBannerProps {
  winner: string;
  amount: number;
  allPassed?: boolean;
}

export default function SoldBanner({ winner, amount, allPassed = false }: SoldBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [winner, amount]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 3,
        marginTop: '-8px',
        padding: '10px 34px',
        background: '#F0386B',
        border: '3px solid #0B0C3F',
        borderRadius: '14px',
        boxShadow: '0 6px 0 #0B0C3F',
        transform: 'rotate(-3deg)',
        textAlign: 'center',
        animation: 'slideInFromTop 0.4s ease-out',
      }}
    >
      <div
        style={{
          fontFamily: "'Bungee', 'Impact', sans-serif",
          fontSize: '44px',
          lineHeight: 1,
          color: '#FFC93C',
          textShadow: '3px 3px 0 #0B0C3F',
        }}
      >
        {allPassed ? 'HERKES PAS DEDİ – SATILDI!' : 'SATILDI!'}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 800 }}>
        {winner} · {amount} altın
      </div>
    </div>
  );
}
