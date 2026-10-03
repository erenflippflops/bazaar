import { ReactNode } from 'react';

interface MessageBoxProps {
  type: 'turquoise' | 'pink' | 'navy';
  children: ReactNode;
}

export default function MessageBox({ type, children }: MessageBoxProps) {
  const colors = {
    turquoise: '#2EC4B6',
    pink: '#F0386B',
    navy: '#0B0C3F',
  };

  const textColors = {
    turquoise: '#0B0C3F',
    pink: '#FFFFFF',
    navy: '#FFFFFF',
  };

  return (
    <div
      style={{
        padding: '18px 16px',
        borderRadius: '16px',
        background: colors[type],
        color: textColors[type],
        border: `3px solid ${colors[type]}`,
        boxShadow: '0 6px 0 #0B0C3F',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {children}
    </div>
  );
}
