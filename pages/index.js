import { useState, useRef } from 'react';
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
            SOLANA · BIRDEYE DATA · GEMINI AI
          </div>
        </header>

        <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="font-mono" style={{ fontSize: '0.65rem', color: '#ff3c3c', letterSpacing: '4px', marginBottom: 16 }}>
              ONCHAIN RISK INTELLIGENCE
            </div>
            <h1 className="font-display" style={{
              fontSize: 'clamp(2.4rem, 8vw, 4rem)',
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-2px',
              color: '#e6edf3',
              marginBottom: 16,
            }}>
              DETECT RUGS<br />
              <span style={{ color: '#ff3c3c', textShadow: '0 0 30px rgba(255,60,60,0.4)' }}>BEFORE THEY</span><br />
              HAPPEN
            </h1>
            <p className="font-body" style={{ color: '#ac37ca', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
              <b>Paste any Solana token address</b>. Six Birdeye endpoints analyzed in parallel. AI-written risk report in under 5 seconds.
            </p>
          </div>

          {/* Search */}
          <div className="terminal-border" style={{
            background: '#0d1117',
            borderRadius: 6,
            padding: 20,
            marginBottom: 16,
          }}>
            <div className="font-mono" style={{ fontSize: '0.6rem', color: '#4a5568', letterSpacing: '2px', marginBottom: 12 }}>
              TOKEN ADDRESS
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
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
                      TOKEN ANALYSIS
                    </div>
          
                    <div className="font-mono" style={{ fontSize: '1.5rem', color: '#8c13dd', marginTop: 4 }}>
                      ${result.metrics.symbol}
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
                    ◆ AI ANALYST REPORT · GEMINI
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
                  POWERED BY BIRDEYE DATA API · GEMINI AI · NOT FINANCIAL ADVICE<br />
                  ANALYZED {new Date(result.analyzedAt).toLocaleTimeString()}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </>
  );
}
