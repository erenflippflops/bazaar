import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import ResultsScreen from './screens/ResultsScreen';
import './App.css';

function App() {
  const { socket, gameState, connected } = useSocket();

  if (!connected) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <h2>Bağlanıyor...</h2>
        <p style={{ color: 'var(--muted)' }}>Sunucuya bağlantı kuruluyor</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyScreen socket={socket} gameState={gameState} />} />
        <Route path="/game" element={<GameScreen socket={socket} gameState={gameState} />} />
        <Route path="/results" element={<ResultsScreen socket={socket} gameState={gameState} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
