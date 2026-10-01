interface WheelDisplayProps {
  itemCount: number;
  isAuctionActive?: boolean;
}

export default function WheelDisplay({ itemCount, isAuctionActive = false }: WheelDisplayProps) {
  const colors = ['#FFC93C', '#2EC4B6', '#F0386B', '#7B5CFF', '#FF8A3D'];
  const showQuestionMarks = itemCount <= 12;

  // Responsive sizing - smaller wheel on mobile during auction
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const baseMobileRadius = isMobile && isAuctionActive ? 104 : 104;
  const baseDesktopRadius = 200;
  const radius = isMobile ? baseMobileRadius : baseDesktopRadius;
  const size = radius * 2 + 20;
  const rimWidth = isMobile ? 10 : 16;
  const hubRadius = isMobile ? 17 : 34;
  const lightRadius = isMobile ? 2.8 : 4.5;
  const lightCount = 16;

  // Generate SVG path for each segment
  const centerX = size / 2;
  const centerY = size / 2;

  const segments = Array.from({ length: itemCount }, (_, i) => {
    const anglePerSegment = 360 / itemCount;
    const startAngle = i * anglePerSegment;
    const endAngle = (i + 1) * anglePerSegment;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = anglePerSegment > 180 ? 1 : 0;

    const path = `M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

    const midAngle = startAngle + anglePerSegment / 2;
    const textDistance = radius * 0.65;
    const textX = centerX + textDistance * Math.cos((midAngle - 90) * Math.PI / 180);
    const textY = centerY + textDistance * Math.sin((midAngle - 90) * Math.PI / 180);

    return {
      path,
      color: colors[i % colors.length],
      midAngle,
      textX,
      textY,
    };
  });

  // Generate lights around the rim
  const lights = Array.from({ length: lightCount }, (_, i) => {
    const angle = (i * 360) / lightCount;
    const rad = (angle - 90) * (Math.PI / 180);
    const lightDistance = radius + rimWidth / 2;
    const x = centerX + lightDistance * Math.cos(rad);
    const y = centerY + lightDistance * Math.sin(rad);
    const color = i % 2 === 0 ? '#FFC93C' : '#FFF1C2';

    return { x, y, color };
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0 0',
      position: 'relative'
    }}>
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
          cx={size / 2}
          cy={size / 2}
          r={radius}
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
                x={segment.textX}
                y={segment.textY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#0B0C3F"
                style={{
                  fontFamily: 'Bungee, Impact, sans-serif',
                  fontSize: Math.min(isMobile ? 28 : 54, radius / 3.5),
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
          cx={size / 2}
          cy={size / 2}
          r={hubRadius}
          fill="#FFC93C"
          stroke="#0B0C3F"
          strokeWidth="3"
        />

        {/* Pointer at top */}
        <path
          d={`M${size / 2 - (isMobile ? 14 : 14)},${rimWidth / 2} L${size / 2 + (isMobile ? 14 : 14)},${rimWidth / 2} L${size / 2},${hubRadius + rimWidth + 5} Z`}
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
