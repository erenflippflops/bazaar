import { useEffect, useState } from 'react';

interface TimerProps {
  endsAt: number | undefined;
  label?: string;
}

export default function Timer({ endsAt, label }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setSeconds(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSeconds(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [endsAt]);

  const shouldPulse = seconds > 0 && seconds <= 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {label && (
        <span style={{
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: 'var(--muted)',
          textTransform: 'uppercase'
        }}>
          {label}
        </span>
      )}
      <div
        className={shouldPulse ? 'timer pulse' : 'timer'}
        style={{
          background: 'var(--pomegranate)',
          border: '3px solid var(--white)',
          borderRadius: '50%',
          width: '86px',
          height: '86px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-heading)',
          fontSize: '38px',
          color: 'var(--white)',
          boxShadow: '0 0 18px rgba(240, 56, 107, 0.6)',
        }}
      >
        {seconds}
      </div>
    </div>
  );
}
