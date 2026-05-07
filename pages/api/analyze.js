import { fetchAllTokenData } from '../../lib/birdeye';
import { runRulesEngine } from '../../lib/rulesEngine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenAddress } = req.body;
  if (!tokenAddress || tokenAddress.length < 32) {
    return res.status(400).json({ error: 'Invalid token address' });
  }

  const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!BIRDEYE_KEY) {
    return res.status(500).json({ error: 'BIRDEYE_API_KEY not configured' });
  }

  try {
    const startedAt = Date.now();
    // ── STEP 1: Fetch all Birdeye data in parallel ──────────────────────────
    console.log(`[Rug Sentinel] Fetching data for ${tokenAddress}`);
    const rawData = await fetchAllTokenData(tokenAddress, BIRDEYE_KEY);

    // ── STEP 2: Run deterministic rules engine ──────────────────────────────
    const analysis = runRulesEngine(rawData);

    // ── STEP 3: Build structured payload for LLM ────────────────────────────
    const llmPayload = {
      token: analysis.metrics.name || 'Unknown',
      symbol: analysis.metrics.symbol || '???',
      rugScore: analysis.rugScore,
      verdict: analysis.verdict,
      criticalSignals: analysis.signals.filter(s => s.severity === 'CRITICAL').map(s => s.finding),
      highSignals: analysis.signals.filter(s => s.severity === 'HIGH').map(s => s.finding),
      mediumSignals: analysis.signals.filter(s => s.severity === 'MEDIUM').map(s => s.finding),
      greenFlags: analysis.greenFlags,
      metrics: {
        createdAt: analysis.metrics.createdAt,
        tokenAgeHours: analysis.metrics.tokenAgeHours,
        totalHolders: analysis.metrics.totalHolders,
        top3HolderPercent: analysis.metrics.top3HolderPercent,
        liquidity: analysis.metrics.liquidity,
        logo: analysis.metrics.logo,
        mintAuthorityEnabled: analysis.metrics.mintAuthorityEnabled,
        freezeAuthorityEnabled: analysis.metrics.freezeAuthorityEnabled,
        washTradingWallets: analysis.metrics.washTradingWallets,
      }
    };

    // ── STEP 4: Call Gemini to write human analyst report ───────────────────
    let aiReport = null;
    let aiError = null;

    if (GEMINI_KEY) {
      try {
        const prompt = `You are a battle-hardened onchain analyst who has seen hundreds of rug pulls. You have zero patience for sugar-coating. You write short, punchy risk reports that traders actually read.

Here is the deterministic risk analysis for token ${llmPayload.symbol} (${llmPayload.token}):

RUG SCORE: ${llmPayload.rugScore}/10
VERDICT: ${llmPayload.verdict}

CRITICAL RISKS:
${llmPayload.criticalSignals.length > 0 ? llmPayload.criticalSignals.map(s => `- ${s}`).join('\n') : '- None'}

HIGH RISKS:
${llmPayload.highSignals.length > 0 ? llmPayload.highSignals.map(s => `- ${s}`).join('\n') : '- None'}

MEDIUM RISKS:
${llmPayload.mediumSignals.length > 0 ? llmPayload.mediumSignals.map(s => `- ${s}`).join('\n') : '- None'}

GREEN FLAGS:
${llmPayload.greenFlags.length > 0 ? llmPayload.greenFlags.map(s => `- ${s}`).join('\n') : '- None'}

KEY METRICS:
- Token age: ${llmPayload.metrics.tokenAgeHours ? llmPayload.metrics.tokenAgeHours + ' hours' : 'Unknown'}
- Total holders: ${llmPayload.metrics.totalHolders || 'Unknown'}
- Top 3 holders control: ${llmPayload.metrics.top3HolderPercent ? llmPayload.metrics.top3HolderPercent.toFixed(1) + '%' : 'Unknown'}
- Liquidity: ${llmPayload.metrics.liquidity ? '$' + Math.round(llmPayload.metrics.liquidity).toLocaleString() : 'Unknown'}
- Mint authority active: ${llmPayload.metrics.mintAuthorityEnabled ? 'YES (DANGEROUS)' : 'No'}
- Freeze authority active: ${llmPayload.metrics.freezeAuthorityEnabled ? 'YES (DANGEROUS)' : 'No'}
- Wash trading wallets detected: ${llmPayload.metrics.washTradingWallets || 0}

Write a Rug Report in exactly this format (keep it under 150 words total):

OPENING: One sentence verdict, brutally direct. Start with the token name.
RISKS: 2-3 sentences explaining the biggest threats in plain English, like warning a friend.
GREEN FLAGS: One sentence (or "No green flags." if none).
RECOMMENDATION: One punchy final sentence. Be specific about what to do.

Use direct, plain language. Sound like someone who has lost money before and doesn't want others to. No corporate speak, no hedging, no "it's important to note that".`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
              }
            })
          }
        );

        const geminiData = await geminiRes.json();
        console.log('Gemini response:', geminiData);
        aiReport = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (!aiReport && geminiData?.error) {
          aiError = geminiData.error.message;
        }
      } catch (err) {
        aiError = err.message;
        console.error('[Rug Sentinel] Gemini error:', err);
      }
    } else {
      aiError = 'GEMINI_API_KEY not configured — add it to .env.local to enable AI reports';
    }

    // ── STEP 5: Return full analysis ────────────────────────────────────────
    return res.status(200).json({
      tokenAddress,
      rugScore: analysis.rugScore,
      verdict: analysis.verdict,
      verdictColor: analysis.verdictColor,
      signals: analysis.signals,
      greenFlags: analysis.greenFlags,
      metrics: analysis.metrics,
      counts: analysis.counts,
      aiReport,
      aiError,
      dataErrors: rawData.errors,
      analysisTimeMs: Date.now() - startedAt,
      analyzedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Rug Sentinel] Error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}
