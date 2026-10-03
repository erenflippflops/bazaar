interface StatusBoxProps {
  label: string;
  bigText: string;
  subText: string;
  countdown?: number;
  urgent?: boolean;
  plusThreeSeconds?: boolean;
  gold: number;
}

export default function StatusBox({
  label,
  bigText,
  subText,
  countdown,
  urgent,
  plusThreeSeconds,
  gold,
}: StatusBoxProps) {
  return (
    <div
      style={{
        padding: '16px 18px',
        background: urgent ? '#F0386B' : '#0B0C3F',
        border: urgent ? '2px solid #FFFFFF' : '2px solid rgba(46,196,182,0.55)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {plusThreeSeconds && (
        <span
          style={{
            position: 'absolute',
            top: '-12px',
            right: '16px',
            background: '#2EC4B6',
            color: '#0B0C3F',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          +3 SN
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: urgent ? '#FFFFFF' : '#C9CBFF',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '44px',
            lineHeight: 1,
            color: '#FFFFFF',
          }}
        >
          {bigText}
        </span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: urgent ? '#FFFFFF' : '#2EC4B6',
          }}
        >
          {subText}
        </span>
      </div>
      <span
        style={{
          width: '86px',
          height: '86px',
          flexShrink: 0,
          borderRadius: '50%',
          background: urgent ? '#FFFFFF' : '#F0386B',
          border: urgent ? '3px solid #F0386B' : '3px solid #FFFFFF',
          boxShadow: urgent ? '0 0 18px rgba(255,255,255,0.6)' : '0 0 18px rgba(240,56,107,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Bungee', 'Impact', sans-serif",
          fontSize: '38px',
          color: urgent ? '#F0386B' : '#FFFFFF',
        }}
      >
        {countdown !== undefined ? countdown : gold}
      </span>
    </div>
  );
}
