import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { useStageScaling } from './hooks/useStageScaling';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import BriefingScreen from './screens/BriefingScreen';
import GameScreen from './screens/GameScreen';
import ResultsScreen from './screens/ResultsScreen';
import BackgroundDecorations from './components/BackgroundDecorations';
import Footer from './components/Footer';
import DesignHarness from './harness/DesignHarness';
import './App.css';

function App() {
  // Check if we're in design harness mode
  const params = new URLSearchParams(window.location.search);
  if (params.has('mock')) {
    return <DesignHarness />;
  }

  const { socket, gameState, connected } = useSocket();
  const { stage, scale } = useStageScaling();

  if (!connected) {
    return (
      <>
        <BackgroundDecorations />
        <div style={{
          width: stage === 'desktop' ? 1440 : 390,
          height: stage === 'desktop' ? 900 : 844,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: stage === 'desktop' ? '50%' : 0,
          left: '50%',
          marginTop: stage === 'desktop' ? -450 * scale : 0,
          marginLeft: stage === 'desktop' ? -720 * scale : -195 * scale,
        }}>
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
        </div>
      </>
    );
  }

  return (
    <>
      <BackgroundDecorations />
      <div style={{
        width: stage === 'desktop' ? 1440 : 390,
        height: stage === 'desktop' ? 900 : 844,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: stage === 'desktop' ? '50%' : 0,
        left: '50%',
        marginTop: stage === 'desktop' ? -450 * scale : 0,
        marginLeft: stage === 'desktop' ? -720 * scale : -195 * scale,
      }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeScreen socket={socket} />} />
            <Route path="/lobby" element={<LobbyScreen socket={socket} gameState={gameState} />} />
            <Route path="/briefing" element={<BriefingScreen socket={socket} gameState={gameState} />} />
            <Route path="/game" element={<GameScreen socket={socket} gameState={gameState} />} />
            <Route path="/results" element={<ResultsScreen socket={socket} gameState={gameState} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Footer />
      </div>
    </>
  );
}

export default App;
