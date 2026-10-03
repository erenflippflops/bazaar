import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Background } from '../components/Background';
import { Lanterns } from '../components/Lanterns';
import Footer from '../components/Footer';
import HomeScreen from '../screens/HomeScreen';
import LobbyScreen from '../screens/LobbyScreen';
import BriefingScreen from '../screens/BriefingScreen';
import GameScreen from '../screens/GameScreen';
import ResultsScreen from '../screens/ResultsScreen';
import { mockData } from './mockData';
import '../App.css';

// Mock socket for harness
const mockSocket = {
  emit: () => {},
  on: () => {},
  off: () => {},
} as any;

export default function DesignHarness() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Wait for fonts to load before rendering
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });

    // Disable animations for stable screenshots
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!fontsLoaded) {
    return <div>Loading fonts...</div>;
  }

  const params = new URLSearchParams(window.location.search);
  const screenId = params.get('mock') || 'connecting';
  const stage = params.get('stage') || 'desktop';

  const mockState = mockData[screenId];
  if (!mockState) {
    return <div>Unknown screen: {screenId}</div>;
  }

  // Set viewport size based on stage
  const width = stage === 'phone' ? '390px' : '1440px';
  const height = stage === 'phone' ? '844px' : '900px';

  // Render appropriate screen based on mock data
  const renderScreen = () => {
    switch (screenId) {
      case 'connecting':
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

      case 'login':
        return <HomeScreen socket={mockSocket} />;

      case 'lobby-host':
      case 'lobby-guest':
        return <LobbyScreen socket={mockSocket} gameState={mockState} />;

      case 'briefing':
        return <BriefingScreen socket={mockSocket} gameState={mockState} />;

      case 'your-turn':
      case 'not-your-turn':
      case 'spinning':
      case 'opening-you':
      case 'opening-other':
      case 'bidding':
      case 'last-seconds':
      case 'top-bidder':
      case 'passed':
      case 'out':
      case 'sold':
      case 'judge-thinking':
      case 'judge-error':
        return <GameScreen socket={mockSocket} gameState={mockState} />;

      case 'results':
        return <ResultsScreen socket={mockSocket} gameState={mockState} />;

      case 'disconnected':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <h2>Bağlantı Koptu</h2>
            <p style={{ color: 'var(--muted)' }}>Sunucu bağlantısı kesildi</p>
          </div>
        );

      case 'halisaha':
        return <LobbyScreen socket={mockSocket} gameState={mockState} />;

      default:
        return <div>Unknown screen: {screenId}</div>;
    }
  };

  return (
    <div style={{ width, height, overflow: 'hidden' }}>
      <Background />
      <Lanterns stage={stage as 'desktop' | 'phone'} />
      <BrowserRouter>
        {renderScreen()}
      </BrowserRouter>
      <Footer />
    </div>
  );
}
