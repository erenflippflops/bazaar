import { useEffect, useState } from 'react';

interface StatusBoxProps {
  label: string;
  text: string;
  subtext: string;
  timeLeft?: number;
  totalTime?: number;
  urgent?: boolean;
  showPlusThree?: boolean;
}

export default function StatusBox({
  label,
  text,
  subtext,
  timeLeft,
  totalTime,
  urgent = false,
  showPlusThree = false,
}: StatusBoxProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (timeLeft !== undefined) {
      setSeconds(Math.max(0, Math.ceil(timeLeft / 1000)));
    }
  }, [timeLeft]);

  const progress = totalTime && timeLeft ? timeLeft / totalTime : 0;
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - progress);

  const bgColor = urgent ? '#F0386B' : '#0B0C3F';
  const borderColor = 'rgba(46,196,182,0.55)';

  return (
    <div
      style={{
        padding: '16px 18px',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#C9CBFF',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '44px',
            lineHeight: 1,
          }}
        >
          {text}
        </span>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#2EC4B6' }}>
          {subtext}
        </span>
      </div>
      {timeLeft !== undefined && totalTime !== undefined && (
        <div style={{ position: 'relative' }}>
          <span
            style={{
              width: '86px',
              height: '86px',
              flexShrink: 0,
              borderRadius: '50%',
              background: '#F0386B',
              border: '3px solid #FFFFFF',
              boxShadow: '0 0 18px rgba(240,56,107,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Bungee', 'Impact', sans-serif",
              fontSize: '38px',
              color: '#FFFFFF',
            }}
          >
            {seconds}
          </span>
          {totalTime > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '86px',
                height: '86px',
                transform: 'rotate(-90deg)',
                pointerEvents: 'none',
              }}
            >
              <circle
                cx="43"
                cy="43"
                r="38"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
              />
              <circle
                cx="43"
                cy="43"
                r="38"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transition: 'stroke-dashoffset 0.1s linear',
                }}
              />
            </svg>
          )}
          {showPlusThree && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#2EC4B6',
                color: '#0B0C3F',
                padding: '4px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                border: '2px solid #FFFFFF',
              }}
            >
              +3 SN
            </div>
          )}
        </div>
      )}
    </div>
  );
}
