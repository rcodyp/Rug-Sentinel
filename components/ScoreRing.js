export default function ScoreRing({ score, verdict, verdictColor }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;

  const colorMap = {
    safe: { stroke: '#00e676', text: '#00e676', bg: 'rgba(0,230,118,0.08)' },
    warn: { stroke: '#ffab00', text: '#ffab00', bg: 'rgba(255,171,0,0.08)' },
    danger: { stroke: '#ff3c3c', text: '#ff3c3c', bg: 'rgba(255,60,60,0.08)' },
    critical: { stroke: '#ff3c3c', text: '#ff3c3c', bg: 'rgba(255,60,60,0.08)' },
  };

  const colors = colorMap[verdictColor] || colorMap.danger;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 140, height: 140 }}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full" style={{
          background: colors.bg,
          filter: 'blur(15px)',
          transform: 'scale(1.2)',
        }} />
        
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="#1e2d3d"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: `drop-shadow(0 0 8px ${colors.stroke})`,
            }}
          />
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2 }}>
          <span className="font-display" style={{
            fontSize: '2.8rem',
            fontWeight: 900,
            color: colors.text,
            lineHeight: 1,
            letterSpacing: '-2px',
          }}>
            {score}
          </span>
          <span className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px' }}>
            /10
          </span>
        </div>
      </div>

      {/* Verdict badge */}
      <div className="text-center">
        <div className="font-display" style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: colors.text,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textShadow: `0 0 20px ${colors.text}`,
        }}>
          {verdict}
        </div>
        <div className="font-mono" style={{ fontSize: '0.65rem', color: '#4a5568', marginTop: '4px', letterSpacing: '2px' }}>
          RUG SCORE
        </div>
      </div>
    </div>
  );
}
