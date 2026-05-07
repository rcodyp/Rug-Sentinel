/**
 * RUG SENTINEL — Rules Engine
 * 
 * Deterministic, hardcoded risk analysis.
 * No LLM here. Pure logic. Score is always accurate.
 * LLM is only used to write the report in human language.
 */

export function runRulesEngine(data) {
  const { overview, security, holders, ohlcv, txs, trending } = data;
  const signals = [];
  const greenFlags = [];
  const metrics = {};

  // ─── LAYER 1: TOKEN IDENTITY ────────────────────────────────────────────────
  if (overview) {
    const createdAt = overview.createdAt || overview.created_at;
    if (createdAt) {
      const createdMs = createdAt > 1000000000 ? createdAt * 1000 : createdAt;
      const ageHours = (Date.now() - new Date(createdMs).getTime()) / 3600000;
      metrics.tokenAgeHours = Math.round(ageHours);
      metrics.createdAt = new Date(createdMs).toISOString();
      if (ageHours < 24) {
        signals.push({ severity: 'HIGH', category: 'Age', finding: `Token is only ${Math.round(ageHours)} hours old — extremely new, no track record` });
      } else if (ageHours < 72) {
        signals.push({ severity: 'MEDIUM', category: 'Age', finding: `Token is ${Math.round(ageHours)} hours old — still very new` });
      }
    }

    metrics.symbol = overview.symbol || 'UNKNOWN';
    metrics.name = overview.name || 'Unknown Token';
    metrics.logo = overview.logoURI || overview.logo_uri || overview.logo || null;
    metrics.price = overview.price;
    metrics.marketCap = overview.mc || overview.marketCap;
    metrics.liquidity = overview.liquidity;
    metrics.volume24h = overview.v24hUSD || overview.volume24h;
    metrics.priceChange24h = overview.v24hChangePercent || overview.priceChange24h;

    if (metrics.liquidity && metrics.liquidity < 10000) {
      signals.push({ severity: 'HIGH', category: 'Liquidity', finding: `Liquidity is critically low ($${Math.round(metrics.liquidity).toLocaleString()}) — easy to manipulate price` });
    } else if (metrics.liquidity && metrics.liquidity > 100000) {
      greenFlags.push(`Solid liquidity pool of $${Math.round(metrics.liquidity).toLocaleString()}`);
    }
  }

  // ─── LAYER 2: SECURITY SCAN ─────────────────────────────────────────────────
  if (security) {
    metrics.mintAuthorityEnabled = security.mintAuthorityAddress && security.mintAuthorityAddress !== 'null';
    metrics.freezeAuthorityEnabled = security.freezeAuthorityAddress && security.freezeAuthorityAddress !== 'null';
    metrics.ownerPercentage = security.ownerPercentage;
    metrics.top10HolderPercent = security.top10HolderPercent;
    metrics.lpLocked = security.lpLockedPct > 0;
    metrics.lpBurned = security.isTrueToken;
    metrics.isToken2022 = security.isToken2022;

    if (metrics.mintAuthorityEnabled) {
      signals.push({ severity: 'CRITICAL', category: 'Security', finding: 'Mint authority is still active — developer can print unlimited tokens and dilute holders to zero' });
    } else {
      greenFlags.push('Mint authority is disabled — no infinite token printing possible');
    }

    if (metrics.freezeAuthorityEnabled) {
      signals.push({ severity: 'CRITICAL', category: 'Security', finding: 'Freeze authority enabled — developer can freeze any wallet and trap your funds' });
    } else {
      greenFlags.push('Freeze authority disabled — your wallet cannot be frozen');
    }

    if (security.ownerPercentage && security.ownerPercentage > 20) {
      signals.push({ severity: 'CRITICAL', category: 'Ownership', finding: `Owner wallet controls ${security.ownerPercentage.toFixed(1)}% of supply — extreme concentration risk` });
    }

    if (security.top10HolderPercent && security.top10HolderPercent > 80) {
      signals.push({ severity: 'HIGH', category: 'Ownership', finding: `Top 10 holders control ${security.top10HolderPercent.toFixed(1)}% of supply — heavily concentrated` });
    } else if (security.top10HolderPercent && security.top10HolderPercent < 40) {
      greenFlags.push(`Relatively distributed — top 10 hold only ${security.top10HolderPercent.toFixed(1)}%`);
    }

    if (!metrics.lpLocked && !metrics.lpBurned) {
      signals.push({ severity: 'HIGH', category: 'Liquidity', finding: 'Liquidity pool is not locked or burned — developer can remove liquidity and disappear instantly' });
    } else {
      greenFlags.push('Liquidity pool appears locked or burned');
    }
  }

  // ─── LAYER 3: HOLDER X-RAY ──────────────────────────────────────────────────
  if (holders && holders.items) {
    const holderList = holders.items;
    metrics.totalHolders = holders.total || holderList.length;

    // Check top 3 holder concentration
    const top3 = holderList.slice(0, 3);
    const top3Percent = top3.reduce((sum, h) => sum + (h.percentage || 0), 0);
    metrics.top3HolderPercent = top3Percent;

    if (top3Percent > 60) {
      signals.push({ severity: 'CRITICAL', category: 'Holders', finding: `Top 3 wallets hold ${top3Percent.toFixed(1)}% of supply — catastrophic exit risk` });
    } else if (top3Percent > 40) {
      signals.push({ severity: 'HIGH', category: 'Holders', finding: `Top 3 wallets hold ${top3Percent.toFixed(1)}% combined — high dump risk` });
    }

    if (metrics.totalHolders < 100) {
      signals.push({ severity: 'HIGH', category: 'Holders', finding: `Only ${metrics.totalHolders} holders — token has almost no organic adoption` });
    } else if (metrics.totalHolders > 1000) {
      greenFlags.push(`${metrics.totalHolders.toLocaleString()} holders showing organic distribution`);
    }

    // Check for wallet clustering (same-funded wallets)
    // In real data, we'd check funding sources — approximated by checking wallets with exact same percentage
    const percentages = holderList.map(h => h.percentage?.toFixed(4));
    const duplicatePercents = percentages.filter((p, i) => p && percentages.indexOf(p) !== i && p > '0.5000');
    if (duplicatePercents.length >= 2) {
      signals.push({ severity: 'HIGH', category: 'Holders', finding: `${duplicatePercents.length + 1} wallets hold identical percentages — possible coordinated team wallets disguised as organic holders` });
    }
  }

  // ─── LAYER 4: PRICE & VOLUME FORENSICS ──────────────────────────────────────
  if (ohlcv && ohlcv.items && ohlcv.items.length > 0) {
    const candles = ohlcv.items;
    const recentCandles = candles.slice(-6); // last 6 hours
    const olderCandles = candles.slice(0, Math.max(1, candles.length - 6));

    const recentVolume = recentCandles.reduce((s, c) => s + (c.vUSD || c.v || 0), 0);
    const olderAvgVolume = olderCandles.length > 0
      ? olderCandles.reduce((s, c) => s + (c.vUSD || c.v || 0), 0) / olderCandles.length
      : 0;

    metrics.volumeSpikeFactor = olderAvgVolume > 0 ? (recentVolume / olderAvgVolume / recentCandles.length) : null;

    if (metrics.volumeSpikeFactor && metrics.volumeSpikeFactor > 5) {
      signals.push({ severity: 'HIGH', category: 'Volume', finding: `Volume spiked ${Math.round(metrics.volumeSpikeFactor)}x above average in recent hours — possible artificial pump or coordinated buying` });
    }

    // Check price action
    const firstClose = candles[0]?.c || candles[0]?.close;
    const lastClose = candles[candles.length - 1]?.c || candles[candles.length - 1]?.close;
    if (firstClose && lastClose) {
      const priceChange = ((lastClose - firstClose) / firstClose) * 100;
      metrics.price24hChange = priceChange;

      if (priceChange > 500) {
        signals.push({ severity: 'MEDIUM', category: 'Price', finding: `Price up ${Math.round(priceChange)}% in 24h — extreme pump, likely to retrace hard` });
      } else if (priceChange > 100) {
        signals.push({ severity: 'MEDIUM', category: 'Price', finding: `Price up ${Math.round(priceChange)}% in 24h — significant pump, watch for dumps` });
      }
    }
  }

  // ─── LAYER 5: TRANSACTION BEHAVIOR ──────────────────────────────────────────
  if (txs && txs.items) {
    const transactions = txs.items;
    metrics.totalTxsChecked = transactions.length;

    // Check for wash trading - same wallets buying and selling
    const buyWallets = new Set();
    const sellWallets = new Set();
    let totalBuyVolume = 0;
    let totalSellVolume = 0;

    transactions.forEach(tx => {
      if (tx.side === 'buy' || tx.type === 'buy') {
        buyWallets.add(tx.owner || tx.source);
        totalBuyVolume += tx.volumeUSD || tx.amount || 0;
      } else {
        sellWallets.add(tx.owner || tx.source);
        totalSellVolume += tx.volumeUSD || tx.amount || 0;
      }
    });

    // Overlap between buyers and sellers = wash trading
    const overlap = [...buyWallets].filter(w => w && sellWallets.has(w));
    metrics.washTradingWallets = overlap.length;
    if (overlap.length >= 3) {
      signals.push({ severity: 'HIGH', category: 'Trading', finding: `${overlap.length} wallets are both buying and selling — strong wash trading signal to create fake volume` });
    }

    // Check if one wallet dominates buy volume
    const buyVolByWallet = {};
    transactions.filter(tx => tx.side === 'buy' || tx.type === 'buy').forEach(tx => {
      const w = tx.owner || tx.source;
      if (w) buyVolByWallet[w] = (buyVolByWallet[w] || 0) + (tx.volumeUSD || 0);
    });

    const maxBuyer = Object.values(buyVolByWallet).sort((a, b) => b - a)[0] || 0;
    if (totalBuyVolume > 0 && maxBuyer / totalBuyVolume > 0.35) {
      signals.push({ severity: 'HIGH', category: 'Trading', finding: `Single wallet responsible for ${Math.round(maxBuyer/totalBuyVolume*100)}% of all buy volume — artificial price pumping` });
    }

    metrics.buySellRatio = totalSellVolume > 0 ? (totalBuyVolume / totalSellVolume).toFixed(2) : null;
    if (metrics.buySellRatio && metrics.buySellRatio < 0.5) {
      signals.push({ severity: 'HIGH', category: 'Trading', finding: `Sell volume is ${Math.round(1/metrics.buySellRatio)}x buy volume — smart money is getting out` });
    } else if (metrics.buySellRatio && metrics.buySellRatio > 2) {
      greenFlags.push(`Buy/sell ratio of ${metrics.buySellRatio} — more buying than selling pressure`);
    }
  }

  // ─── LAYER 6: TRENDING CHECK ────────────────────────────────────────────────
  if (trending && trending.tokens) {
    const trendingAddresses = trending.tokens.map(t => t.address);
    // We don't have the address directly here, but we pass metrics.isTrending based on overview data
    metrics.isTrending = false; // Will be set in API route if we have the address
  }

  // ─── SCORE CALCULATION ───────────────────────────────────────────────────────
  const criticalCount = signals.filter(s => s.severity === 'CRITICAL').length;
  const highCount = signals.filter(s => s.severity === 'HIGH').length;
  const mediumCount = signals.filter(s => s.severity === 'MEDIUM').length;

  const rawScore = (criticalCount * 3) + (highCount * 2) + (mediumCount * 1);
  const rugScore = Math.min(10, rawScore);

  let verdict;
  let verdictColor;
  if (rugScore <= 2) {
    verdict = 'Relatively Safe';
    verdictColor = 'safe';
  } else if (rugScore <= 4) {
    verdict = 'Proceed with Caution';
    verdictColor = 'warn';
  } else if (rugScore <= 7) {
    verdict = 'High Rug Risk';
    verdictColor = 'danger';
  } else {
    verdict = 'Almost Certain Rug';
    verdictColor = 'critical';
  }

  return {
    rugScore,
    verdict,
    verdictColor,
    signals,
    greenFlags,
    metrics,
    counts: { critical: criticalCount, high: highCount, medium: mediumCount },
  };
}
