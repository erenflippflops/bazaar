export default function ConnectingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#16187A',
        fontFamily: "'Rubik', 'Helvetica Neue', sans-serif",
        color: '#FFFFFF',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,201,60,0.2)',
            borderTop: '4px solid #FFC93C',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '28px',
            color: '#FFC93C',
          }}
        >
          Bağlanıyor...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
