import { CSSProperties } from 'react';

const BackgroundDecorations = () => {
  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: -1,
  };

  const raysStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255, 255, 255, 0.06) 0deg, rgba(255, 255, 255, 0) 5deg, rgba(255, 255, 255, 0) 10deg)',
  };

  const starPatternStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='44' height='44' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 2 L24 20 L42 22 L24 24 L22 42 L20 24 L2 22 L20 20 Z' fill='none' stroke='%23FFC93C' stroke-width='0.5' opacity='0.13'/%3E%3C/svg%3E")`,
    backgroundSize: '44px 44px',
    backgroundRepeat: 'repeat',
  };

  return (
    <div style={containerStyle}>
      <div style={raysStyle} />
      <div style={starPatternStyle} />
    </div>
  );
};

export default BackgroundDecorations;
