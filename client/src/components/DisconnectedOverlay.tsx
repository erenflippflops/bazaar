interface DisconnectedOverlayProps {
  onReconnect: () => void;
}

export default function DisconnectedOverlay({ onReconnect }: DisconnectedOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11,12,63,0.92)',
        zIndex: 9999,
        fontFamily: "'Rubik', 'Helvetica Neue', sans-serif",
        color: '#FFFFFF',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '32px',
          background: '#0B0C3F',
          border: '2px solid rgba(46,196,182,0.55)',
          borderRadius: '18px',
          maxWidth: '400px',
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '32px',
            color: '#F0386B',
            marginBottom: '20px',
          }}
        >
          Bağlantı koptu
        </span>
        <button
          onClick={onReconnect}
          style={{
            height: '56px',
            border: '3px solid #0B0C3F',
            borderRadius: '14px',
            background: '#FFC93C',
            color: '#0B0C3F',
            boxShadow: '0 5px 0 #0B0C3F',
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '18px',
            padding: '0 32px',
            cursor: 'pointer',
          }}
        >
          Yeniden bağlan
        </button>
      </div>
    </div>
  );
}
