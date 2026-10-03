import { useEffect, useRef } from 'react';

interface WheelProps {
  itemsLeft: number;
  state: 'your-turn' | 'not-your-turn' | 'spinning';
  onSpin?: () => void;
  spinKey?: number;
}

export default function Wheel({ itemsLeft, state, onSpin, spinKey }: WheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rotationRef = useRef(0);

  const n = state === 'spinning' ? itemsLeft + 1 : itemsLeft;
  const centerX = 216;
  const centerY = 216;
  const radius = 200;
  const rimRadius = 208;
  const rimWidth = 16;
  const hubRadius = 34;
  const lightRadius = 4.5;
  const lightCount = 16;

  // Generate slices
  const slices = [];
  for (let i = 0; i < n; i++) {
    const anglePerSegment = 360 / n;
    const startAngle = i * anglePerSegment - 90;
    const endAngle = (i + 1) * anglePerSegment - 90;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
    const path = `M${centerX} ${centerY} L${x1.toFixed(1)} ${y1.toFixed(1)} A${radius} ${radius} 0 ${largeArcFlag} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;

    // Slice 0 is white (under the pointer at top)
    const isWhite = i === 0;
    const fill = isWhite ? '#FFFFFF' : i % 2 === 1 ? '#2EC4B6' : '#1FA89B';

    slices.push({ path, fill, isWhite });
  }

  // Generate rim lights
  const lights = [];
  for (let i = 0; i < lightCount; i++) {
    const angle = (i * 360) / lightCount - 90;
    const rad = (angle * Math.PI) / 180;
    const x = centerX + rimRadius * Math.cos(rad);
    const y = centerY + rimRadius * Math.sin(rad);
    const color = i % 2 === 0 ? '#FFC93C' : '#FFF1C2';
    lights.push({ x, y, color });
  }

  // Spin animation
  useEffect(() => {
    if (state === 'spinning' && spinKey !== undefined) {
      const svg = svgRef.current;
      if (!svg) return;

      const slicesGroup = svg.querySelector('#wheel-slices') as SVGGElement;
      if (!slicesGroup) return;

      // Animate rotation to land on white slice (slice 0)
      const duration = 3200;
      const startTime = performance.now();
      const startRotation = rotationRef.current;
      const targetRotation = startRotation + 360 * 4; // 4 full rotations

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // ease-out

        const currentRotation = startRotation + (targetRotation - startRotation) * eased;
        rotationRef.current = currentRotation;

        slicesGroup.style.transform = `rotate(${currentRotation}deg)`;
        slicesGroup.style.transformOrigin = '50% 50%';

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [spinKey, state]);

  const handleClick = () => {
    if (state === 'your-turn' && onSpin) {
      onSpin();
    }
  };

  const clickable = state === 'your-turn';
  const dimmed = state === 'not-your-turn';

  return (
    <svg
      ref={svgRef}
      width="432"
      height="432"
      viewBox="0 0 432 432"
      role="img"
      aria-label={`Çark: ${itemsLeft} kapalı güç`}
      style={{
        filter: clickable
          ? 'drop-shadow(0 0 22px rgba(255,201,60,0.95))'
          : dimmed
          ? 'saturate(0.5)'
          : 'none',
        opacity: dimmed ? 0.55 : 1,
        cursor: clickable ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      {/* White rim */}
      <circle
        cx={centerX}
        cy={centerY}
        r={rimRadius}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={rimWidth}
      />

      {/* Slices */}
      <g id="wheel-slices" style={{ transformOrigin: '50% 50%' }}>
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.fill}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1"
          />
        ))}

        {/* Pink star on white slice */}
        <text
          x={centerX}
          y={44}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#F0386B"
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '20px',
          }}
        >
          ★
        </text>
      </g>

      {/* Rim lights */}
      {lights.map((light, i) => (
        <circle key={i} cx={light.x} cy={light.y} r={lightRadius} fill={light.color} />
      ))}

      {/* Hub */}
      <circle
        cx={centerX}
        cy={centerY}
        r={hubRadius}
        fill="#FFC93C"
        stroke="#0B0C3F"
        strokeWidth="3"
      />

      {/* Pointer at top */}
      <path d="M202 2 L230 2 L216 40 Z" fill="#FFC93C" stroke="#0B0C3F" strokeWidth="2" />

      {/* "ÇEVİR!" text on hub */}
      {clickable && (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0B0C3F"
          style={{
            fontFamily: "'Bungee', 'Impact', sans-serif",
            fontSize: '15px',
          }}
        >
          ÇEVİR!
        </text>
      )}
    </svg>
  );
}
