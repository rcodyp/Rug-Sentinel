export default function SignalCard({ signal, index }) {
  const config = {
    CRITICAL: { color: '#ff3c3c', bg: 'rgba(255,60,60,0.06)', label: 'CRITICAL', dot: '#ff3c3c' },
    HIGH: { color: '#ff7c1e', bg: 'rgba(255,124,30,0.06)', label: 'HIGH', dot: '#ff7c1e' },
    MEDIUM: { color: '#ffab00', bg: 'rgba(255,171,0,0.06)', label: 'MEDIUM', dot: '#ffab00' },
  };

  const c = config[signal.severity] || config.MEDIUM;

  return (
    <div
      className="animate-fadeSlideUp"
      style={{
        animationDelay: `${index * 0.08}s`,
        opacity: 0,
        background: c.bg,
        border: `1px solid ${c.color}22`,
        borderLeft: `3px solid ${c.color}`,
        borderRadius: '4px',
        padding: '10px 14px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
      }}
    >
      <div style={{
        minWidth: 64,
        fontFamily: 'var(--mono)',
        fontSize: '0.6rem',
        color: c.color,
        letterSpacing: '1.5px',
        marginTop: '2px',
        fontWeight: 600,
      }}>
        {c.label}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: '#4a5568', letterSpacing: '1px', marginBottom: '3px' }}>
          {signal.category}
        </div>
        <div style={{ fontFamily: 'var(--body)', fontSize: '0.82rem', color: '#c9d1d9', lineHeight: 1.5 }}>
          {signal.finding}
        </div>
      </div>
    </div>
  );
}
