import { useEffect } from 'react';

interface SaleBannerProps {
  item: string;
  winner: string;
  amount: number;
  onComplete: () => void;
}

export default function SaleBanner({ item, winner, amount, onComplete }: SaleBannerProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--saffron)',
        border: '3px solid var(--dark)',
        borderRadius: '16px',
        padding: '16px 32px',
        boxShadow: '0 6px 0 var(--dark), 0 12px 24px rgba(0, 0, 0, 0.4)',
        animation: 'slideDown 0.3s ease-out',
        maxWidth: '90vw',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '20px',
          color: 'var(--dark)',
          textAlign: 'center',
          margin: 0,
        }}
      >
        {item} → {winner} · {amount} altın
      </p>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes slideDown {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
