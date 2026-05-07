import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import ScoreRing from '../components/ScoreRing';
import SignalCard from '../components/SignalCard';
import MetricsGrid from '../components/MetricsGrid';

const SAMPLE_ADDRESSES = [
  { label: 'SOL', address: 'So11111111111111111111111111111111111111112' },
  { label: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { label: 'WIF', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
];

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('');
  const [activeTier, setActiveTier] = useState('CONVICTION');
  const [openFaq, setOpenFaq] = useState(0);
  const [liveData, setLiveData] = useState({ coins: [], stats: null, updatedAt: null });
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(null);
  const [coinQuery, setCoinQuery] = useState('');
  const [pulseIndex, setPulseIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const resultRef = useRef(null);

  const stages = [
    '⬡ Connecting to Birdeye endpoints...',
    '⬡ Fetching token security data...',
    '⬡ Analyzing holder distribution...',
    '⬡ Running volume forensics...',
    '⬡ Scanning transaction behavior...',
    '⬡ Running rules engine...',
    '⬡ Generating AI analyst report...',
  ];

  async function analyze(addr) {
    const target = addr || address;
    if (!target.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    // Cycle through stages for UX
    let stageIdx = 0;
    setStage(stages[0]);
    const interval = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, stages.length - 1);
      setStage(stages[stageIdx]);
    }, 800);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: target.trim() }),
      });

      const data = await res.json();
      console.log('Analysis result:', data);
      clearInterval(interval);

      if (!res.ok) {
        setError(data.error || 'Analysis failed');
        console.error('Analysis error:', data.error);
      } else {
        console.log('Analysis successful:', data);
        setResult(data);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
    } finally {
      setLoading(false);
      setStage('');
    }
  }

  const verdictBg = {
    safe: 'linear-gradient(135deg, rgba(0,230,118,0.04), transparent)',
    warn: 'linear-gradient(135deg, rgba(255,171,0,0.04), transparent)',
    danger: 'linear-gradient(135deg, rgba(255,60,60,0.04), transparent)',
    critical: 'linear-gradient(135deg, rgba(255,60,60,0.06), transparent)',
  };

  const tierCards = [
    {
      id: 'CONVICTION',
      emoji: '⚡',
      title: 'APE IN',
      tone: '#00e676',
      text: 'All signals aligned. Wallet behavior confirms accumulation while price remains flat.',
    },
    {
      id: 'ALERT',
      emoji: '👀',
      title: 'MONITOR',
      tone: '#ffab00',
      text: 'Pattern is building, but not fully confirmed. Watch for one more trigger.',
    },
    {
      id: 'WATCH',
      emoji: '🚫',
      title: 'AVOID',
      tone: '#ff3c3c',
      text: 'Mixed behavior and weak structure. Risk/reward is poor right now.',
    },
  ];

  const faq = [
    {
      q: 'What makes this better than basic token checkers?',
      a: 'Rug Sentinel combines six on-chain data surfaces and turns them into weighted signals, then summarizes with an AI analyst note so judges can understand the why, not just the score.',
    },
    {
      q: 'How fast is the analysis?',
      a: 'Most scans complete in under five seconds with parallel endpoint calls and a lightweight scoring engine.',
    },
    {
      q: 'Is this financial advice?',
      a: 'No. It is risk intelligence to reduce blind entries. Always run your own due diligence.',
    },
  ];

  useEffect(() => {
    let mounted = true;

    async function loadLandingData() {
      try {
        if (mounted) {
          setLiveLoading(true);
          setLiveError(null);
        }

        const res = await fetch('/api/landing');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load live market data');
        }
        if (mounted) {
          setLiveData(data);
        }
      } catch (err) {
        if (mounted) {
          setLiveError(err.message);
        }
      } finally {
        if (mounted) {
          setLiveLoading(false);
        }
      }
    }

    loadLandingData();
    const interval = setInterval(loadLandingData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  function formatMoney(value) {
    if (!value) return '—';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    if (value < 0.000001) return `$${value.toExponential(2)}`;
    if (value < 1) return `$${value.toFixed(6)}`;
    return `$${value.toFixed(2)}`;
  }

  function formatRelativeTime(iso) {
    if (!iso) return 'Unknown age';
    const diffMs = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return 'Unknown age';
    const hours = Math.floor(diffMs / 3600000);
    if (hours < 24) return `${hours}h old`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d old`;
    return `${Math.floor(days / 30)}mo old`;
  }

  const filteredCoins = liveData.coins.filter((coin) => {
    const q = coinQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      coin.symbol?.toLowerCase().includes(q) ||
      coin.name?.toLowerCase().includes(q) ||
      coin.address?.toLowerCase().includes(q)
    );
  });

  const sortedByChange = [...liveData.coins].sort((a, b) => b.change24h - a.change24h);
  const topGainer = sortedByChange[0];
  const topLoser = [...sortedByChange].reverse()[0];
  const pulseCoin = liveData.coins.length ? liveData.coins[pulseIndex % liveData.coins.length] : null;
  const positiveCoins = liveData.coins.filter((coin) => coin.change24h > 0).length;
  const negativeCoins = liveData.coins.filter((coin) => coin.change24h < 0).length;
  const riskBuckets = {
    critical: liveData.coins.filter((coin) => coin.liquidity > 0 && coin.liquidity < 15000).length,
    elevated: liveData.coins.filter((coin) => coin.liquidity >= 15000 && coin.liquidity < 50000).length,
    stable: liveData.coins.filter((coin) => coin.liquidity >= 50000).length,
  };
  const marketBias = positiveCoins === negativeCoins
    ? 'Neutral tape'
    : positiveCoins > negativeCoins
      ? 'Risk-on tape'
      : 'Risk-off tape';

  return (
    <>
      <Head>
        <title>Rug Sentinel — Onchain Risk Intelligence</title>
        <meta name="description" content="AI-powered rug pull detection for Solana tokens. Paste any token address for an instant risk analysis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>" />
      </Head>

      <div className="grid-bg" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <header style={{
          borderBottom: '1px solid #1e2d3d',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(8,11,15,0.9)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#ff3c3c',
              boxShadow: '0 0 8px #ff3c3c',
            }} className="animate-pulse-red" />
            <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '3px', color: '#e6edf3' }}>
              RUG SENTINEL
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px' }}>
            SOLANA · BIRDEYE DATA · CHATGPT AI
          </div>
        </header>

        <main style={{ maxWidth: 1380, margin: '0 auto', padding: '24px 16px 56px' }}>

          {/* Hero */}
          <div style={{
            marginBottom: 12,
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.4fr) minmax(280px, 1fr)',
            gap: 12,
          }}>
            <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 6, padding: 16 }}>
              <div className="font-mono" style={{ fontSize: '0.62rem', color: '#ff3c3c', letterSpacing: '3px', marginBottom: 10 }}>
                ONCHAIN RISK INTELLIGENCE
              </div>
              <h1 className="font-display" style={{
                fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: '-1.5px',
                color: '#e6edf3',
                marginBottom: 10,
              }}>
                DETECT RUGS
                BEFORE THEY
                HAPPEN<br />
                <span style={{ color: '#ff3c3c', textShadow: '0 0 30px rgba(255,60,60,0.4)' }}>USING AI RUG MONITOR</span>
              </h1>
              <p className="font-body" style={{ color: '#ac37ca', fontSize: '0.88rem', maxWidth: 700, lineHeight: 1.5 }}>
                Live token streams, rapid risk scans, and AI analyst reports. Built to look active 24/7 during your hackathon demo.
              </p>
              <div style={{
                marginTop: 12,
                background: 'rgba(255,124,30,0.08)',
                border: '1px solid #ff7c1e55',
                borderRadius: 6,
                padding: '10px 12px',
              }}>
                <div className="font-mono" style={{ fontSize: '0.62rem', color: '#ff7c1e', letterSpacing: '1.5px' }}>
                  AI RUG-PULL DETECTION ENGINE ACTIVE
                </div>
                <div className="font-mono" style={{ fontSize: '0.68rem', color: '#c9d1d9', marginTop: 6, lineHeight: 1.5 }}>
                  Gemini AI + deterministic rules analyze wallet concentration, liquidity unlock risk, authority controls, wash trading, and suspicious volume behavior.
                </div>
              </div>
            </div>
            <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 6, padding: 16 }}>
              <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 8 }}>
                MARKET SNAPSHOT
              </div>
              <div className="font-display" style={{ fontSize: '1.2rem', color: '#e6edf3', fontWeight: 800 }}>
                {pulseCoin ? `$${pulseCoin.symbol}` : 'LOADING'}
              </div>
              <div style={{ marginTop: 8, height: 6, background: '#1e2d3d', borderRadius: 999 }}>
                <div style={{
                  width: `${pulseCoin ? Math.min(100, Math.abs(pulseCoin.change24h) * 4) : 10}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: pulseCoin?.change24h >= 0 ? '#00e676' : '#ff3c3c',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div className="font-mono" style={{ marginTop: 10, fontSize: '0.66rem', color: '#4a5568' }}>
                Active movers: {liveData.stats?.highVolatilityCount ?? '—'} · Updated {liveData.updatedAt ? new Date(liveData.updatedAt).toLocaleTimeString() : '--:--'}
              </div>
            </div>
          </div>

          <section style={{ marginBottom: 12 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
              gap: 8,
            }}>
              {[
                { label: 'LIVE TRENDING COINS', value: liveData.stats?.trendingCount ?? '—' },
                { label: '24H TOTAL VOLUME', value: liveData.stats ? formatMoney(liveData.stats.totalVolume24h) : '—' },
                { label: 'HIGH VOLATILITY', value: liveData.stats?.highVolatilityCount ?? '—' },
                { label: 'TOTAL LIQUIDITY', value: liveData.stats ? formatMoney(liveData.stats.totalLiquidity) : '—' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: '#0d1117',
                    border: '1px solid #1e2d3d',
                    borderRadius: 6,
                    padding: '12px 14px',
                  }}
                >
                  <div className="font-mono" style={{ fontSize: '0.58rem', letterSpacing: '1.6px', color: '#4a5568', marginBottom: 6 }}>
                    {item.label}
                  </div>
                  <div className="font-display animate-countUp" style={{ fontSize: '1.35rem', color: '#e6edf3', fontWeight: 800 }}>
                    {liveLoading ? 'LOADING...' : item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
            gap: 8,
            marginBottom: 12,
          }}>
            <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 6, padding: 14 }}>
              <div className="font-mono" style={{ fontSize: '0.58rem', letterSpacing: '1.6px', color: '#4a5568', marginBottom: 8 }}>
                TOP GAINER
              </div>
              {topGainer ? (
                <>
                  <div className="font-display" style={{ color: '#00e676', fontWeight: 800, fontSize: '1.2rem' }}>
                    ${topGainer.symbol} {topGainer.change24h >= 0 ? '+' : ''}{topGainer.change24h.toFixed(2)}%
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 4 }}>
                    {topGainer.name} · {formatMoney(topGainer.price)}
                  </div>
                </>
              ) : <div className="font-mono" style={{ color: '#4a5568', fontSize: '0.7rem' }}>Waiting for live feed...</div>}
            </div>

            <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 6, padding: 14 }}>
              <div className="font-mono" style={{ fontSize: '0.58rem', letterSpacing: '1.6px', color: '#4a5568', marginBottom: 8 }}>
                TOP LOSER
              </div>
              {topLoser ? (
                <>
                  <div className="font-display" style={{ color: '#ff3c3c', fontWeight: 800, fontSize: '1.2rem' }}>
                    ${topLoser.symbol} {topLoser.change24h >= 0 ? '+' : ''}{topLoser.change24h.toFixed(2)}%
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 4 }}>
                    {topLoser.name} · {formatMoney(topLoser.price)}
                  </div>
                </>
              ) : <div className="font-mono" style={{ color: '#4a5568', fontSize: '0.7rem' }}>Waiting for live feed...</div>}
            </div>

            <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 6, padding: 14 }}>
              <div className="font-mono" style={{ fontSize: '0.58rem', letterSpacing: '1.6px', color: '#4a5568', marginBottom: 8 }}>
                LIVE PULSE
              </div>
              {pulseCoin ? (
                <>
                  <div className="font-display" style={{ color: '#e6edf3', fontWeight: 800, fontSize: '1.1rem' }}>
                    ${pulseCoin.symbol}
                  </div>
                  <div style={{ marginTop: 8, height: 6, background: '#1e2d3d', borderRadius: 999 }}>
                    <div style={{
                      width: `${Math.min(100, Math.abs(pulseCoin.change24h) * 4)}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: pulseCoin.change24h >= 0 ? '#00e676' : '#ff3c3c',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 6 }}>
                    Rotating live token spotlight
                  </div>
                </>
              ) : <div className="font-mono" style={{ color: '#4a5568', fontSize: '0.7rem' }}>Waiting for live feed...</div>}
            </div>
          </section>

          <section style={{
            background: '#0d1117',
            border: '1px solid #1e2d3d',
            borderRadius: 6,
            padding: 14,
            marginBottom: 12,
          }}>
            <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 12 }}>
              LIVE MARKET MOMENTUM CHART
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(6, minmax(0, 1fr))' : 'repeat(12, minmax(0, 1fr))', gap: 6, alignItems: 'end', minHeight: 120 }}>
              {liveData.coins.slice(0, isMobile ? 6 : 12).map((coin) => {
                const h = Math.max(8, Math.min(100, Math.abs(coin.change24h) * 5));
                const up = coin.change24h >= 0;
                return (
                  <div key={`bar-${coin.address}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      title={`${coin.symbol} ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%`}
                      style={{
                        width: '100%',
                        maxWidth: 22,
                        height: `${h}px`,
                        borderRadius: 4,
                        background: up ? 'linear-gradient(180deg, #00e676, #0f5132)' : 'linear-gradient(180deg, #ff3c3c, #5f1d1d)',
                        boxShadow: up ? '0 0 10px rgba(0,230,118,0.22)' : '0 0 10px rgba(255,60,60,0.22)',
                        transition: 'height 0.6s ease',
                      }}
                    />
                    <div className="font-mono" style={{ fontSize: '0.52rem', color: '#4a5568', letterSpacing: '0.4px' }}>
                      {coin.symbol?.slice(0, 4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.5fr) minmax(260px, 1fr)',
            gap: 8,
            marginBottom: 12,
          }}>
            <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 6, padding: 12 }}>
              <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 8 }}>
                MARKET INTELLIGENCE PANEL
              </div>
              <div className="font-mono" style={{ fontSize: '0.72rem', color: '#c9d1d9', lineHeight: 1.6 }}>
                Bias: <span style={{ color: '#ff7c1e' }}>{marketBias}</span> · Breadth: <span style={{ color: '#00e676' }}>{positiveCoins} up</span> / <span style={{ color: '#ff3c3c' }}>{negativeCoins} down</span>.
                Volatility leaders: {sortedByChange.slice(0, 3).map((coin) => coin.symbol).join(', ') || 'N/A'}.
                Largest liquidity pool in feed: {liveData.coins[0] ? formatMoney(Math.max(...liveData.coins.map((coin) => coin.liquidity || 0))) : '—'}.
              </div>
            </div>
            <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 6, padding: 12 }}>
              <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 8 }}>
                LIQUIDITY RISK HEATMAP
              </div>
              {[
                { label: 'CRITICAL < $15K', value: riskBuckets.critical, color: '#ff3c3c' },
                { label: 'ELEVATED $15K-$50K', value: riskBuckets.elevated, color: '#ffab00' },
                { label: 'STABLE > $50K', value: riskBuckets.stable, color: '#00e676' },
              ].map((bucket) => (
                <div key={bucket.label} style={{ marginBottom: 8 }}>
                  <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', marginBottom: 4 }}>{bucket.label}</div>
                  <div style={{ height: 6, background: '#1e2d3d', borderRadius: 999 }}>
                    <div style={{
                      width: `${liveData.coins.length ? (bucket.value / liveData.coins.length) * 100 : 0}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: bucket.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Search */}
          <div className="terminal-border" style={{
            background: '#0d1117',
            border: '1px solid #ff3c3c55',
            borderRadius: 6,
            padding: 14,
            marginBottom: 12,
            position: 'sticky',
            top: 62,
            zIndex: 60,
            boxShadow: '0 0 14px rgba(255,60,60,0.15)',
          }}>
            <div className="font-mono" style={{ fontSize: '0.62rem', color: '#ff3c3c', letterSpacing: '2px', marginBottom: 8 }}>
              AI COIN CHECKER (PASTE TOKEN TO DETECT RUG RISK)
            </div>
            <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '1px', marginBottom: 12 }}>
              Instant AI verdict + risk score + signals breakdown
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr) 1fr' : 'minmax(0,1fr) auto auto auto', gap: 8 }}>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="Paste Solana token address..."
                className="font-mono"
                style={{
                  flex: 1,
                  background: '#080b0f',
                  border: '1px solid #1e2d3d',
                  borderRadius: 4,
                  padding: '10px 14px',
                  color: '#c9d1d9',
                  fontSize: '0.8rem',
                  outline: 'none',
                  letterSpacing: '0.5px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff3c3c'}
                onBlur={e => e.target.style.borderColor = '#1e2d3d'}
              />
              <button
                onClick={() => analyze()}
                disabled={loading || !address.trim()}
                className="font-display"
                style={{
                  background: loading ? '#1e2d3d' : '#ff3c3c',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px 22px',
                  color: loading ? '#4a5568' : '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {loading ? 'SCANNING...' : 'ANALYZE'}
              </button>
              <button
                onClick={() => topGainer?.address && (setAddress(topGainer.address), analyze(topGainer.address))}
                className="font-mono"
                style={{ background: '#0f5132', border: '1px solid #1e2d3d', borderRadius: 4, padding: '8px 10px', color: '#9ff5c6', fontSize: '0.62rem', letterSpacing: '1px', cursor: 'pointer' }}
              >
                GAINER
              </button>
              <button
                onClick={() => topLoser?.address && (setAddress(topLoser.address), analyze(topLoser.address))}
                className="font-mono"
                style={{ background: '#5f1d1d', border: '1px solid #1e2d3d', borderRadius: 4, padding: '8px 10px', color: '#ffaaaa', fontSize: '0.62rem', letterSpacing: '1px', cursor: 'pointer' }}
              >
                LOSER
              </button>
            </div>

            {/* Sample addresses */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '1px', alignSelf: 'center' }}>
                TRY:
              </span>
              {SAMPLE_ADDRESSES.map(s => (
                <button
                  key={s.label}
                  onClick={() => { setAddress(s.address); analyze(s.address); }}
                  className="font-mono"
                  style={{
                    background: 'transparent',
                    border: '1px solid #1e2d3d',
                    borderRadius: 3,
                    padding: '3px 10px',
                    color: '#4a5568',
                    fontSize: '0.62rem',
                    cursor: 'pointer',
                    letterSpacing: '1px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = '#ff3c3c'; e.target.style.color = '#ff3c3c'; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#1e2d3d'; e.target.style.color = '#4a5568'; }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <section style={{
            background: '#0d1117',
            border: '1px solid #1e2d3d',
            borderRadius: 6,
            padding: 20,
            marginBottom: 20,
          }}>
            <div style={{
              marginBottom: 10,
              overflow: 'hidden',
              border: '1px solid #1e2d3d',
              borderRadius: 6,
              background: '#080b0f',
              padding: '8px 10px',
            }}>
              <div className="font-mono" style={{
                color: '#4a5568',
                fontSize: '0.62rem',
                letterSpacing: '1.4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                LIVE TICKER: {liveData.coins.slice(0, 6).map((coin) => `${coin.symbol} ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%`).join('   •   ')}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 12 }}>
                LIVE SOLANA TRENDING COINS
              </div>
              <button
                onClick={async () => {
                  setLiveLoading(true);
                  try {
                    const res = await fetch('/api/landing');
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Refresh failed');
                    setLiveData(data);
                    setLiveError(null);
                  } catch (err) {
                    setLiveError(err.message);
                  } finally {
                    setLiveLoading(false);
                  }
                }}
                className="font-mono"
                style={{
                  marginBottom: 12,
                  fontSize: '0.6rem',
                  letterSpacing: '1.5px',
                  color: '#ff7c1e',
                  background: '#080b0f',
                  border: '1px solid #1e2d3d',
                  borderRadius: 4,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                REFRESH
              </button>
            </div>
            <input
              value={coinQuery}
              onChange={(e) => setCoinQuery(e.target.value)}
              placeholder="Search by symbol, name, or address..."
              className="font-mono"
              style={{
                width: '100%',
                marginBottom: 12,
                background: '#080b0f',
                border: '1px solid #1e2d3d',
                borderRadius: 4,
                color: '#c9d1d9',
                fontSize: '0.72rem',
                padding: '8px 10px',
                outline: 'none',
              }}
            />
            {liveError && (
              <div className="font-mono" style={{ fontSize: '0.65rem', color: '#ff7c1e', marginBottom: 12 }}>
                {liveError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredCoins.slice(0, 10).map((coin) => (
                <button
                  key={coin.address}
                  onClick={() => {
                    setAddress(coin.address);
                    analyze(coin.address);
                  }}
                  style={{
                    background: '#080b0f',
                    border: '1px solid #1e2d3d',
                    borderRadius: 6,
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto auto auto',
                    gap: 12,
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={coin.logo || 'https://placehold.co/28x28/0d1117/4a5568?text=%24'}
                      alt={`${coin.symbol} logo`}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #1e2d3d', objectFit: 'cover' }}
                    />
                    <div>
                      <div className="font-display" style={{ color: '#e6edf3', fontWeight: 700 }}>
                        ${coin.symbol}
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.62rem', color: '#4a5568', letterSpacing: '1px' }}>
                        {coin.name}
                      </div>
                    </div>
                  </div>
                  {!isMobile && (
                    <div className="font-mono" style={{ color: '#4a5568', fontSize: '0.62rem' }}>
                      {formatRelativeTime(coin.createdAt)}
                    </div>
                  )}
                  <div className="font-mono" style={{ color: '#c9d1d9', fontSize: '0.75rem' }}>
                    {formatMoney(coin.price)}
                    {!isMobile && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 2 }}>
                        {[...Array(12)].map((_, i) => {
                          const seed = (Math.abs(coin.change24h) * 7 + i * 3 + pulseIndex) % 10;
                          const level = 3 + seed;
                          return (
                            <span
                              key={`${coin.address}-spark-${i}`}
                              style={{
                                width: 3,
                                height: level,
                                borderRadius: 2,
                                background: coin.change24h >= 0 ? '#00e67688' : '#ff3c3c88',
                                display: 'inline-block',
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="font-mono" style={{
                    color: coin.change24h >= 0 ? '#00e676' : '#ff3c3c',
                    fontSize: '0.72rem',
                  }}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </div>
                </button>
              ))}
              {!liveLoading && filteredCoins.length === 0 && (
                <div className="font-mono" style={{ fontSize: '0.7rem', color: '#4a5568' }}>
                  No matching live coins for "{coinQuery}".
                </div>
              )}
              {!liveLoading && liveData.coins.length === 0 && (
                <div className="font-mono" style={{ fontSize: '0.7rem', color: '#4a5568' }}>
                  No live trending coins available.
                </div>
              )}
              {liveData.updatedAt && (
                <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '1px', marginTop: 2 }}>
                  UPDATED {new Date(liveData.updatedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </section>

          <section style={{
            background: '#0d1117',
            border: '1px solid #1e2d3d',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
          }}>
            <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 10 }}>
              LIVE LEADERBOARD (CLICK ROW TO ANALYZE)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="font-mono" style={{ color: '#4a5568', fontSize: '0.56rem', letterSpacing: '1.3px' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>RANK</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>TOKEN</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>PRICE</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>24H</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>LIQUIDITY</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>SIGNAL</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByChange.slice(0, 12).map((coin, idx) => {
                    const signal = coin.liquidity < 15000 ? 'CRITICAL' : coin.liquidity < 50000 ? 'ELEVATED' : 'STABLE';
                    const signalColor = signal === 'CRITICAL' ? '#ff3c3c' : signal === 'ELEVATED' ? '#ffab00' : '#00e676';
                    return (
                      <tr
                        key={`leader-${coin.address}`}
                        onClick={() => {
                          setAddress(coin.address);
                          analyze(coin.address);
                        }}
                        style={{ borderTop: '1px solid #1e2d3d', cursor: 'pointer' }}
                      >
                        <td className="font-mono" style={{ padding: '8px', color: '#4a5568', fontSize: '0.64rem' }}>{idx + 1}</td>
                        <td style={{ padding: '8px' }}>
                          <div className="font-display" style={{ color: '#e6edf3', fontSize: '0.9rem', fontWeight: 700 }}>${coin.symbol}</div>
                          <div className="font-mono" style={{ color: '#4a5568', fontSize: '0.58rem' }}>{coin.name}</div>
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right', padding: '8px', color: '#c9d1d9', fontSize: '0.68rem' }}>{formatMoney(coin.price)}</td>
                        <td className="font-mono" style={{ textAlign: 'right', padding: '8px', color: coin.change24h >= 0 ? '#00e676' : '#ff3c3c', fontSize: '0.68rem' }}>
                          {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right', padding: '8px', color: '#c9d1d9', fontSize: '0.68rem' }}>{formatMoney(coin.liquidity)}</td>
                        <td className="font-mono" style={{ textAlign: 'right', padding: '8px', color: signalColor, fontSize: '0.62rem' }}>{signal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{
            background: '#0d1117',
            border: '1px solid #1e2d3d',
            borderRadius: 6,
            padding: 20,
            marginBottom: 20,
          }}>
            <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 12 }}>
              SIGNAL GUIDE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {tierCards.map((tier) => {
                const isActive = activeTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setActiveTier(tier.id)}
                    style={{
                      textAlign: 'left',
                      background: isActive ? `${tier.tone}14` : '#080b0f',
                      border: `1px solid ${isActive ? `${tier.tone}66` : '#1e2d3d'}`,
                      borderRadius: 6,
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div className="font-mono" style={{ fontSize: '0.6rem', color: tier.tone, letterSpacing: '2px', marginBottom: 6 }}>
                      {tier.id}
                    </div>
                    <div className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: '#e6edf3' }}>
                      {tier.emoji} {tier.title}
                    </div>
                    <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#c9d1d9', lineHeight: 1.5 }}>
                      {tier.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Loading state */}
          {loading && (
            <div style={{
              background: '#0d1117',
              border: '1px solid #1e2d3d',
              borderRadius: 6,
              padding: '24px 20px',
              textAlign: 'center',
            }}>
              {/* Scanning animation */}
              <div style={{ position: 'relative', width: 60, height: 60, margin: '0 auto 20px' }}>
                <svg width="60" height="60" style={{ animation: 'spin 2s linear infinite' }}>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  <circle cx="30" cy="30" r="26" fill="none" stroke="#1e2d3d" strokeWidth="2" />
                  <circle cx="30" cy="30" r="26" fill="none" stroke="#ff3c3c" strokeWidth="2"
                    strokeDasharray="40 124" strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px #ff3c3c)' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: '0.72rem', color: '#ff3c3c', letterSpacing: '1px', marginBottom: 8 }}>
                {stage}
              </div>
              <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px' }}>
                ANALYZING 6 BIRDEYE ENDPOINTS IN PARALLEL
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,60,60,0.06)',
              border: '1px solid #ff3c3c44',
              borderRadius: 6,
              padding: 20,
              marginTop: 8,
            }}>
              <div className="font-mono" style={{ fontSize: '0.65rem', color: '#ff3c3c', letterSpacing: '2px', marginBottom: 8 }}>
                ⚠ ANALYSIS ERROR
              </div>
              <div className="font-mono" style={{ fontSize: '0.78rem', color: '#c9d1d9' }}>{error}</div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#4a5568', lineHeight: 1.5 }}>
                Make sure your BIRDEYE_API_KEY is set in <code style={{ color: '#ff7c1e' }}>.env.local</code> and the token address is a valid Solana token.
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div ref={resultRef} className="animate-fadeSlideUp" style={{ marginTop: 8 }}>

              {/* Token header */}
              <div style={{
                background: verdictBg[result.verdictColor] || verdictBg.danger,
                border: '1px solid #1e2d3d',
                borderRadius: 6,
                padding: 24,
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                  {/* Token info */}
                  <div style={{ flex: 1 }}>
                    <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 8 }}>
                      AI RUG-PULL ANALYSIS
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {result.metrics.logo && (
                        <img
                          src={result.metrics.logo}
                          alt={`${result.metrics.symbol} logo`}
                          style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #1e2d3d', objectFit: 'cover' }}
                        />
                      )}
                      <div className="font-mono" style={{ fontSize: '1.5rem', color: '#8c13dd', marginTop: 4 }}>
                        ${result.metrics.symbol}
                      </div>
                    </div>
                    <div className="font-display" style={{ fontSize: '1.3rem', fontWeight: 900, color: '#e6edf3', letterSpacing: '-1px', lineHeight: 1 }}>
                      {result.metrics.name || 'Unknown Token'}
                    </div>
                    {result.metrics.price && (
                      <div className="font-mono" style={{ fontSize: '0.85rem', color: '#c9d1d9', marginTop: 8 }}>
                        ${result.metrics.price < 0.000001
                          ? result.metrics.price.toExponential(2)
                          : result.metrics.price.toFixed(6)}
                      </div>
                    )}
                    <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', marginTop: 12, letterSpacing: '1px' }}>
                      {result.tokenAddress?.slice(0, 20)}...{result.tokenAddress?.slice(-8)}
                    </div>
                    {result.metrics.createdAt && (
                      <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', marginTop: 6, letterSpacing: '1px' }}>
                        CREATED {new Date(result.metrics.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Score Ring */}
                  <ScoreRing
                    score={result.rugScore}
                    verdict={result.verdict}
                    verdictColor={result.verdictColor}
                  />
                </div>

                {/* Signal counts */}
                <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'CRITICAL', count: result.counts.critical, color: '#ff3c3c' },
                    { label: 'HIGH', count: result.counts.high, color: '#ff7c1e' },
                    { label: 'MEDIUM', count: result.counts.medium, color: '#ffab00' },
                    { label: 'GREEN FLAGS', count: result.greenFlags.length, color: '#00e676' },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: '#080b0f',
                      border: `1px solid ${item.color}33`,
                      borderRadius: 4,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 900, color: item.color }}>
                        {item.count}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '1px' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Report */}
              {result.aiReport && (
                <div style={{
                  background: '#0d1117',
                  border: '1px solid #1e2d3d',
                  borderLeft: '3px solid #ff7c1e',
                  borderRadius: 6,
                  padding: 20,
                  marginBottom: 12,
                }}>
                  <div className="font-mono" style={{ fontSize: '0.6rem', color: '#ff7c1e', letterSpacing: '2px', marginBottom: 12 }}>
                    ◆ AI ANALYST REPORT · CHATGPT
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '1px', marginBottom: 10 }}>
                    DETECTS PROBABLE RUG-PULL SIGNALS FROM LIVE ONCHAIN DATA
                  </div>
                  <p style={{ fontFamily: 'var(--body)', fontSize: '0.88rem', color: '#c9d1d9', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {result.aiReport}
                  </p>
                </div>
              )}

              {result.aiError && !result.aiReport && (
                <div style={{
                  background: '#0d1117',
                  border: '1px solid #1e2d3d',
                  borderRadius: 6,
                  padding: 16,
                  marginBottom: 12,
                }}>
                  <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 6 }}>
                    AI REPORT UNAVAILABLE
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.72rem', color: '#4a5568' }}>{result.aiError}</div>
                </div>
              )}

              {/* Metrics */}
              <div style={{
                background: '#0d1117',
                border: '1px solid #1e2d3d',
                borderRadius: 6,
                padding: 20,
                marginBottom: 12,
              }}>
                <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 12 }}>
                  KEY METRICS
                </div>
                <MetricsGrid metrics={result.metrics} />
              </div>

              {/* Risk Signals */}
              {result.signals.length > 0 && (
                <div style={{
                  background: '#0d1117',
                  border: '1px solid #1e2d3d',
                  borderRadius: 6,
                  padding: 20,
                  marginBottom: 12,
                }}>
                  <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 12 }}>
                    RISK SIGNALS ({result.signals.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.signals
                      .sort((a, b) => {
                        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
                        return order[a.severity] - order[b.severity];
                      })
                      .map((signal, i) => (
                        <SignalCard key={i} signal={signal} index={i} />
                      ))}
                  </div>
                </div>
              )}

              {/* Green Flags */}
              {result.greenFlags.length > 0 && (
                <div style={{
                  background: '#0d1117',
                  border: '1px solid #1e2d3d',
                  borderRadius: 6,
                  padding: 20,
                  marginBottom: 12,
                }}>
                  <div className="font-mono" style={{ fontSize: '0.6rem', color: '#00e676', letterSpacing: '2px', marginBottom: 12 }}>
                    ✓ GREEN FLAGS ({result.greenFlags.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.greenFlags.map((flag, i) => (
                      <div key={i} style={{
                        background: 'rgba(0,230,118,0.04)',
                        border: '1px solid #00e67622',
                        borderLeft: '3px solid #00e676',
                        borderRadius: 4,
                        padding: '10px 14px',
                        fontFamily: 'var(--body)',
                        fontSize: '0.82rem',
                        color: '#c9d1d9',
                        lineHeight: 1.5,
                      }}>
                        {flag}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <div className="font-mono" style={{ fontSize: '0.58rem', color: '#4a5568', letterSpacing: '1.5px', lineHeight: 1.8 }}>
                  POWERED BY BIRDEYE DATA API · CHATGPT AI · NOT FINANCIAL ADVICE<br />
                  ANALYZED {new Date(result.analyzedAt).toLocaleTimeString()} · ANALYSIS TIME {result.analysisTimeMs ? `${(result.analysisTimeMs / 1000).toFixed(2)}s` : '—'}
                </div>
              </div>

            </div>
          )}

          {!result && !loading && (
            <section style={{
              background: '#0d1117',
              border: '1px solid #1e2d3d',
              borderRadius: 6,
              padding: 20,
              marginTop: 16,
            }}>
              <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 12 }}>
                HOW IT WORKS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  { t: '1. Ingest', d: 'Pull token security, holders, liquidity, and trading behavior.' },
                  { t: '2. Correlate', d: 'Run weighted risk rules over all endpoint data in parallel.' },
                  { t: '3. Explain', d: 'Generate an AI report that translates raw signals into clear action.' },
                ].map((step) => (
                  <div key={step.t} style={{ background: '#080b0f', border: '1px solid #1e2d3d', borderRadius: 6, padding: 12 }}>
                    <div className="font-display" style={{ color: '#ff7c1e', fontWeight: 700, marginBottom: 6 }}>{step.t}</div>
                    <div style={{ fontSize: '0.8rem', color: '#c9d1d9', lineHeight: 1.5 }}>{step.d}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{
            background: '#0d1117',
            border: '1px solid #1e2d3d',
            borderRadius: 6,
            padding: 20,
            marginTop: 16,
          }}>
            <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 10 }}>
              FAQ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {faq.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <button
                    key={item.q}
                    onClick={() => setOpenFaq(open ? -1 : idx)}
                    style={{
                      textAlign: 'left',
                      background: '#080b0f',
                      border: '1px solid #1e2d3d',
                      borderRadius: 6,
                      padding: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="font-display" style={{ color: '#e6edf3', fontSize: '0.95rem', fontWeight: 700 }}>
                      {item.q}
                    </div>
                    {open && (
                      <div style={{ fontSize: '0.8rem', color: '#c9d1d9', lineHeight: 1.5, marginTop: 8 }}>
                        {item.a}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
