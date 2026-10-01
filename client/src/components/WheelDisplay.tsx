import { useEffect, useRef, useState } from 'react';

// Canvas wheel with hidden slices ("?"), spin animation and a clickable hub.
// The server picks the item; the wheel animates to a slice and shows its name.
interface WheelDisplayProps {
  itemCount: number;          // items left on the wheel (from server, count only)
  isAuctionActive?: boolean;  // an item is revealed and being auctioned
  canSpin?: boolean;          // it is my turn and the wheel can be spun
  onSpin?: () => void;        // asks the server to spin
  revealedName?: string | null;
  spinKey?: string | null;    // changes once per server spin -> plays the animation
  onLanded?: (key: string) => void; // called when the animation for spinKey has finished
}

const TAU = Math.PI * 2;
const POINTER = -Math.PI / 2;
const COLORS = ['#FFC93C', '#2EC4B6', '#F0386B', '#7B5CFF', '#FF8A3D'];
const mod = (a: number, m: number) => ((a % m) + m) % m;

export default function WheelDisplay({ itemCount, isAuctionActive = false, canSpin = false, onSpin, revealedName = null, spinKey = null, onLanded }: WheelDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [slices, setSlices] = useState(Math.max(1, itemCount));
  const lastKey = useRef<string | null>(spinKey);
  const [requested, setRequested] = useState(false);

  // Joining or reconnecting during an auction: no animation, show the item at once.
  useEffect(() => { if (spinKey) onLanded?.(spinKey); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Number of slices: during a spin/auction the revealed item is still drawn on the wheel.
  useEffect(() => {
    if (!spinning && !isAuctionActive) { setSlices(Math.max(1, itemCount)); setLanded(null); }
  }, [itemCount, isAuctionActive, spinning]);

  const draw = () => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const size = cvs.clientWidth || 360, d = window.devicePixelRatio || 1;
    if (cvs.width !== Math.round(size * d)) { cvs.width = Math.round(size * d); cvs.height = Math.round(size * d); }
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const c = size / 2, R = c - 3, rimW = Math.max(10, size * 0.045), r = R - rimW;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); ctx.arc(c, c, R, 0, TAU); ctx.fillStyle = '#0B0C3F'; ctx.fill();
    // rim lights
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      ctx.beginPath(); ctx.arc(c + Math.cos(a) * (R - rimW / 2), c + Math.sin(a) * (R - rimW / 2), Math.max(2, size * 0.008), 0, TAU);
      ctx.fillStyle = i % 2 ? '#FFE9A8' : '#FFC93C'; ctx.fill();
    }
    const n = slices, seg = TAU / n, rot = rotRef.current;
    for (let i = 0; i < n; i++) {
      const a0 = rot + i * seg;
      ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a0 + seg); ctx.closePath();
      ctx.fillStyle = i === landed ? '#FFFFFF' : COLORS[i % COLORS.length]; ctx.fill();
      ctx.strokeStyle = 'rgba(11,12,63,.45)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + seg / 2); ctx.textBaseline = 'middle';
      if (i === landed && revealedName) {
        ctx.textAlign = 'right'; ctx.fillStyle = '#0B0C3F';
        let fs = Math.min(seg * r * 0.5, size * 0.055);
        ctx.font = `700 ${fs}px Rubik, sans-serif`;
        const w = ctx.measureText(revealedName).width, maxW = r * 0.7;
        if (w > maxW) { fs *= maxW / w; ctx.font = `700 ${fs}px Rubik, sans-serif`; }
        ctx.fillText(revealedName, r - size * 0.03, 1);
      } else if (n <= 48) {
        ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(11,12,63,.75)';
        ctx.font = `800 ${Math.min(seg * r * 0.45, size * 0.06)}px Bungee, Rubik, sans-serif`;
        ctx.translate(r * 0.75, 0); ctx.rotate(Math.PI / 2); ctx.fillText('?', 0, 0);
      }
      ctx.restore();
    }
  };

  useEffect(() => { draw(); });
  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ro = new ResizeObserver(() => draw()); ro.observe(cvs);
    return () => ro.disconnect();
  });

  // Play the spin animation when the server reports a new spin.
  useEffect(() => {
    if (!spinKey || spinKey === lastKey.current) return;
    lastKey.current = spinKey;
    setRequested(false);
    const n = itemCount + 1; // the revealed item was on the wheel before the spin
    setSlices(n); setLanded(null); setSpinning(true);
    const seg = TAU / n, target = Math.floor(Math.random() * n), offset = (0.2 + Math.random() * 0.6) * seg;
    const start = rotRef.current;
    const delta = mod(POINTER - target * seg - offset - start, TAU) + TAU * 4;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 600 : 3200, t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      rotRef.current = start + delta * e; draw();
      if (p < 1) raf = requestAnimationFrame(frame);
      else { setLanded(target); setSpinning(false); onLanded?.(spinKey); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [spinKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const clickable = canSpin && !spinning && !requested && !isAuctionActive;
  const doSpin = () => { if (clickable && onSpin) { setRequested(true); onSpin(); setTimeout(() => setRequested(false), 4000); } };

  return (
    <div className="wheel-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      <div style={{ position: 'relative', width: 'min(100%, 46vh, 460px)', aspectRatio: '1 / 1' }}>
        <canvas
          ref={canvasRef}
          data-testid="wheel-canvas"
          data-slices={slices}
          aria-label={`Çark: ${itemCount} güç kaldı`}
          onClick={doSpin}
          style={{ width: '100%', height: '100%', display: 'block', cursor: clickable ? 'pointer' : 'default', borderRadius: '50%',
            boxShadow: clickable ? '0 0 0 6px rgba(255,201,60,.35), 0 0 40px rgba(255,201,60,.55)' : '0 10px 30px rgba(0,0,0,.35)',
            animation: clickable ? 'wheelPulse 1.4s ease-in-out infinite' : undefined }}
        />
        {/* pointer */}
        <svg width="40" height="48" viewBox="0 0 40 48" style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.4))', pointerEvents: 'none' }}>
          <path d="M20 46 L4 6 Q20 -2 36 6 Z" fill="#FFC93C" stroke="#0B0C3F" strokeWidth="3" />
        </svg>
        {/* hub */}
        <button
          type="button"
          onClick={doSpin}
          disabled={!clickable}
          aria-label="Çarkı çevir"
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '24%', aspectRatio: '1 / 1', borderRadius: '50%',
            border: '5px solid #0B0C3F', background: clickable ? '#FFC93C' : '#F5F1E6', color: '#0B0C3F', fontFamily: 'Bungee, Rubik, sans-serif',
            fontSize: 'clamp(12px, 2.2vh, 20px)', cursor: clickable ? 'pointer' : 'default', boxShadow: '0 4px 0 rgba(0,0,0,.35)' }}
        >
          {spinning ? '...' : clickable ? 'ÇEVİR!' : '?'}
        </button>
      </div>
      {canSpin && !isAuctionActive && (
        <button className="primary-button" onClick={doSpin} disabled={!clickable} style={{ width: 'min(100%, 360px)', fontSize: 22, padding: '14px' }}>
          {spinning || requested ? 'Çark dönüyor...' : 'ÇARKI ÇEVİR'}
        </button>
      )}
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Çarkta {itemCount} güç kaldı</p>
      <style>{`@keyframes wheelPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.015); } }`}</style>
    </div>
  );
}
