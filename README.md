# 🛡️ Rug Sentinel — Onchain Risk Intelligence

> AI-powered rug pull detection for Solana tokens. Six Birdeye endpoints analyzed in parallel. AI-written analyst report in under 5 seconds.

**Built for the Birdeye Data BIP Competition — Sprint 3 (May 2–9, 2026)**

---

## 🔗 Live Demo

[Deploy your own → see setup below]

---

## What It Does

Paste any Solana token address. Rug Sentinel runs a full 6-layer risk analysis using Birdeye's API, then generates a natural-language analyst report via Gemini AI.

**The pipeline:**

1. **Identity Check** — Token age, verification status, market cap via `/defi/token_overview`
2. **Security Scan** — Mint authority, freeze authority, LP lock status via `/defi/token_security`
3. **Holder X-Ray** — Top holder concentration, wallet clustering via `/defi/v3/token/holder`
4. **Price Forensics** — Volume spikes, price manipulation patterns via `/defi/ohlcv`
5. **Transaction Analysis** — Wash trading detection, buy/sell ratios via `/defi/txs/token`
6. **Trending Context** — Is it trending organically? via `/defi/token_trending`

**Then a hardcoded Rules Engine** scores each signal as CRITICAL / HIGH / MEDIUM and calculates a Rug Score from 0–10. No hallucinations — the score is always deterministic.

**Then Gemini AI** receives only the structured output (not raw data) and writes a punchy analyst report explaining the risks in plain English.

---

## Architecture

```
User Input (token address)
        │
        ▼
┌─────────────────────────────────┐
│   Birdeye API (6 endpoints)     │  ← Parallel fetch via Promise.allSettled
│   token_overview                │
│   token_security                │
│   token/holder                  │
│   ohlcv                         │
│   txs/token                     │
│   token_trending                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Hardcoded Rules Engine        │  ← Deterministic. Always accurate.
│   CRITICAL × 3pts               │
│   HIGH × 2pts                   │
│   MEDIUM × 1pt                  │
│   Rug Score 0–10                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Structured Payload Builder    │  ← Clean JSON, ~300 tokens
│   {rugScore, verdict, signals,  │
│    greenFlags, keyMetrics}      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Gemini 1.5 Flash              │  ← Only writes, doesn't decide
│   Analyst-style risk report     │
│   Plain English, punchy         │
└─────────────────────────────────┘
             │
             ▼
        Rug Report UI
```

---

## Birdeye Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /defi/token_overview` | Token identity, price, market cap, liquidity |
| `GET /defi/token_security` | Mint/freeze authority, LP lock, ownership % |
| `GET /defi/v3/token/holder` | Top holder distribution, wallet clustering |
| `GET /defi/ohlcv` | Price/volume history, pump detection |
| `GET /defi/txs/token` | Transaction forensics, wash trading |
| `GET /defi/token_trending` | Trending context, organic vs artificial |

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, CSS (no UI library)
- **Backend:** Next.js API Routes
- **Data:** Birdeye Data API (Solana)
- **AI:** Google Gemini 1.5 Flash
- **Deploy:** Vercel (one click)

---

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/rug-sentinel
cd rug-sentinel
npm install
```

### 2. Get API Keys
- **Birdeye:** Free account at [bds.birdeye.so](https://bds.birdeye.so)
- **Gemini:** Free key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 3. Configure
```bash
cp .env.example .env.local
# Edit .env.local and add your keys
```

### 4. Run
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel
```bash
npx vercel
# Add environment variables in Vercel dashboard
```

---

## Why This Approach Is Different

Most rug detection tools just show data. Rug Sentinel **reasons** about it.

The key insight: let the Rules Engine (which is deterministic and can't hallucinate) calculate the risk score, and let the LLM (which is good at language) explain it to humans. Never ask the LLM to decide — only to communicate.

This means:
- The **score is always accurate** — hardcoded logic, not AI guesswork
- The **report is always readable** — natural language, not raw data dumps
- The **cost is minimal** — we send ~300 tokens to Gemini, not entire API responses

---

## Competition Info

Built for **Birdeye Data BIP Competition Sprint 3** (May 2–9, 2026)

- 🐦 Follow: [@birdeye_data](https://x.com/birdeye_data)
- #️⃣ Hashtag: `#BirdeyeAPI`
- 📊 Data: [bds.birdeye.so](https://bds.birdeye.so)

---

## Disclaimer

Not financial advice. This tool is for educational and research purposes only. Always do your own research before investing in any token.
