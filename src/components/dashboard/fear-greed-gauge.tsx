"use client";

interface FearGreedGaugeProps {
  score: number;
  rating: string;
  updatedAt: string;
}

function fngColouring(score: number): string {
  if (score >= 75) return "#8FD6C4";
  if (score >= 55) return "#B9EDE9";
  if (score >= 45) return "#E6E6E6";
  if (score >= 25) return "#FFDCD0";
  return "#FFC0B7";
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function FearGreedGauge({ score, rating, updatedAt }: FearGreedGaugeProps) {
  const centerX = 60;
  const centerY = 72;
  const radius = 45;
  const numDots = 100;

  // 그라데이션 반원 점들
  const arcDots = Array.from({ length: numDots }, (_, i) => {
    const t = i / (numDots - 1);
    const angle = Math.PI + t * Math.PI;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const interpolatedValue = Math.round(10 + t * 90);
    return { x, y, color: fngColouring(interpolatedValue) };
  });

  // 바늘 각도
  const needleAngle = (score / 100) * Math.PI + Math.PI;
  const needleLength = radius - 3;
  const needleEndX = centerX + Math.cos(needleAngle) * needleLength;
  const needleEndY = centerY + Math.sin(needleAngle) * needleLength;

  // 수치 라벨 위치
  const labelDistance = radius + 12;
  const labelX = centerX + Math.cos(needleAngle) * labelDistance;
  const labelY = centerY + Math.sin(needleAngle) * labelDistance;

  const ratingColor = fngColouring(score);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 80" className="w-[120px] h-[80px]">
        {/* 그라데이션 반원 */}
        {arcDots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={2} fill={dot.color} />
        ))}

        {/* 바늘 */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleEndX}
          y2={needleEndY}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={centerX} cy={centerY} r={3.5} fill="currentColor" />

        {/* 수치 라벨 */}
        <text
          x={labelX}
          y={labelY}
          fill="currentColor"
          fontSize={10}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {score}
        </text>
      </svg>

      <p className="mt-1 text-sm font-semibold" style={{ color: ratingColor }}>
        {capitalizeFirstLetter(rating)}
      </p>

      <div className="mt-1 text-center">
        <p className="text-[10px] text-muted-foreground">Last updated:</p>
        <p className="text-[9px] font-mono text-muted-foreground">{updatedAt}</p>
      </div>
    </div>
  );
}
