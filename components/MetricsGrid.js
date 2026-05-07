function MetricBox({ label, value, alert }) {
  return (
    <div style={{
      background: '#0d1117',
      border: `1px solid ${alert ? '#ff3c3c33' : '#1e2d3d'}`,
      borderRadius: '4px',
      padding: '12px',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: '#4a5568', letterSpacing: '2px', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: '0.9rem',
        color: alert ? '#ff3c3c' : '#c9d1d9',
        fontWeight: 600,
      }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export default function MetricsGrid({ metrics }) {
  const fmt = (n) => n ? '$' + Math.round(n).toLocaleString() : null;
  const fmtAge = (h) => {
    if (!h) return null;
    if (h < 24) return `${h}h old`;
    return `${Math.round(h / 24)}d old`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
      <MetricBox label="TOKEN AGE" value={fmtAge(metrics.tokenAgeHours)} alert={metrics.tokenAgeHours && metrics.tokenAgeHours < 48} />
      <MetricBox label="HOLDERS" value={metrics.totalHolders?.toLocaleString()} alert={metrics.totalHolders && metrics.totalHolders < 200} />
      <MetricBox label="LIQUIDITY" value={fmt(metrics.liquidity)} alert={metrics.liquidity && metrics.liquidity < 10000} />
      <MetricBox label="TOP 3 HOLD %" value={metrics.top3HolderPercent ? metrics.top3HolderPercent.toFixed(1) + '%' : null} alert={metrics.top3HolderPercent > 40} />
      <MetricBox label="MINT AUTH" value={metrics.mintAuthorityEnabled === undefined ? '—' : metrics.mintAuthorityEnabled ? '⚠ ACTIVE' : '✓ DISABLED'} alert={metrics.mintAuthorityEnabled} />
      <MetricBox label="FREEZE AUTH" value={metrics.freezeAuthorityEnabled === undefined ? '—' : metrics.freezeAuthorityEnabled ? '⚠ ACTIVE' : '✓ DISABLED'} alert={metrics.freezeAuthorityEnabled} />
    </div>
  );
}
