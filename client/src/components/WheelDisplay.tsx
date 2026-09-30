interface WheelDisplayProps {
  itemCount: number;
}

export default function WheelDisplay({ itemCount }: WheelDisplayProps) {
  const colors = ['#FFC93C', '#2EC4B6', '#F0386B', '#7B5CFF', '#FF8A3D'];
  const showQuestionMarks = itemCount <= 12;

  // Responsive sizing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const radius = isMobile ? 104 : 200;
  const size = radius * 2;
  const rimWidth = 10;
  const hubRadius = 17;
  const lightRadius = 2.8;
  const lightCount = 16;

  // Generate SVG path for each segment
  const segments = Array.from({ length: itemCount }, (_, i) => {
    const anglePerSegment = 360 / itemCount;
    const startAngle = i * anglePerSegment;
    const endAngle = (i + 1) * anglePerSegment;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const innerRadius = radius - rimWidth;
    const x1 = radius + innerRadius * Math.cos(startRad);
    const y1 = radius + innerRadius * Math.sin(startRad);
    const x2 = radius + innerRadius * Math.cos(endRad);
    const y2 = radius + innerRadius * Math.sin(endRad);

    const largeArcFlag = anglePerSegment > 180 ? 1 : 0;

    const path = `M${radius},${radius} L${x1},${y1} A${innerRadius},${innerRadius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

    return {
      path,
      color: colors[i % colors.length],
      midAngle: startAngle + anglePerSegment / 2,
    };
  });

  // Generate lights around the rim
  const lights = Array.from({ length: lightCount }, (_, i) => {
    const angle = (i * 360) / lightCount;
    const rad = (angle - 90) * (Math.PI / 180);
    const lightDistance = radius - rimWidth / 2;
    const x = radius + lightDistance * Math.cos(rad);
    const y = radius + lightDistance * Math.sin(rad);
    const color = i % 2 === 0 ? '#FFC93C' : '#FFF1C2';

    return { x, y, color };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 0' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Çark: ${itemCount} güç kaldı`}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      >
        {/* Outer white rim */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - rimWidth / 2}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={rimWidth}
        />

        {/* Segments */}
        {segments.map((segment, i) => (
          <g key={i}>
            <path
              d={segment.path}
              fill={segment.color}
              stroke="#0B0C3F"
              strokeWidth="2"
            />
            {showQuestionMarks && (
              <text
                x={radius + (radius - rimWidth - 30) * Math.cos((segment.midAngle - 90) * Math.PI / 180)}
                y={radius + (radius - rimWidth - 30) * Math.sin((segment.midAngle - 90) * Math.PI / 180)}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#0B0C3F"
                style={{
                  fontFamily: 'Bungee, Impact, sans-serif',
                  fontSize: Math.min(28, radius / 4),
                }}
              >
                ?
              </text>
            )}
          </g>
        ))}

        {/* Lights around the rim */}
        {lights.map((light, i) => (
          <circle
            key={i}
            cx={light.x}
            cy={light.y}
            r={lightRadius}
            fill={light.color}
          />
        ))}

        {/* Center hub */}
        <circle
          cx={radius}
          cy={radius}
          r={hubRadius}
          fill="#FFC93C"
          stroke="#0B0C3F"
          strokeWidth="3"
        />

        {/* Pointer at top */}
        <path
          d={`M${radius - 14},2 L${radius + 14},2 L${radius},${hubRadius + 5} Z`}
          fill="#FFC93C"
          stroke="#0B0C3F"
          strokeWidth="2"
        />
      </svg>

      <p
        style={{
          marginTop: '12px',
          fontSize: '14px',
          fontWeight: 700,
          color: '#C9CBFF',
          fontFamily: 'Rubik, sans-serif',
        }}
      >
        Çarkta {itemCount} güç kaldı
      </p>
    </div>
  );
}
