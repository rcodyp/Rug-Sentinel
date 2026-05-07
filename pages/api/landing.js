const BIRDEYE_BASE = 'https://public-api.birdeye.so';
const CHAIN = 'solana';

async function fetchBirdeye(path, apiKey) {
  const res = await fetch(`${BIRDEYE_BASE}${path}`, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': CHAIN,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Birdeye landing fetch failed: ${res.status} ${text}`);
  }

  return res.json();
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeTimestamp(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      const ms = numeric < 1e12 ? numeric * 1000 : numeric;
      return Number.isFinite(ms) ? ms : null;
    }
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function resolveCreatedAtMs(source) {
  const candidates = [
    source?.createdAt,
    source?.created_at,
    source?.createAt,
    source?.mintTime,
    source?.firstTradeUnixTime,
    source?.launchTime,
    source?.genesisTimestamp,
    source?.unixTime,
  ];
  for (const candidate of candidates) {
    const ms = normalizeTimestamp(candidate);
    if (ms && ms > 946684800000 && ms <= Date.now()) {
      return ms;
    }
  }
  return null;
}

function pickFirstNumber(obj, keys, fallback = 0) {
  for (const key of keys) {
    const value = obj?.[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getPriceChange24h(item, fallback = 0) {
  return pickFirstNumber(item, [
    'priceChange24hPercent',
    'price_change_24h_percent',
    'priceChangePercent24h',
    'price_change_percent_24h',
    'priceChange24h',
    'price_change_24h',
  ], fallback);
}

function toCoin(item) {
  const createdAtMs = resolveCreatedAtMs(item);

  return {
    address: item.address || item.mint || item.tokenAddress || '',
    symbol: item.symbol || item.tokenSymbol || 'UNKNOWN',
    name: item.name || item.tokenName || 'Unknown Token',
    price: toNumber(item.price || item.priceUsd || item.value),
    change24h: getPriceChange24h(item, 0),
    volume24h: toNumber(item.v24hUSD || item.volume24h || item.volume_24h_usd),
    volume24hChange: pickFirstNumber(item, ['v24hChangePercent', 'volumeChange24hPercent', 'volume_change_24h_percent'], 0),
    change30m: pickFirstNumber(item, ['priceChange30mPercent', 'priceChange30m', 'price_change_30m'], 0),
    change1h: pickFirstNumber(item, ['priceChange1hPercent', 'priceChange1h', 'price_change_1h'], 0),
    change4h: pickFirstNumber(item, ['priceChange4hPercent', 'priceChange4h', 'price_change_4h'], 0),
    marketCap: toNumber(item.mc || item.marketCap || item.market_cap),
    liquidity: toNumber(item.liquidity || item.liquidityUsd || item.liquidity_usd),
    logo: item.logoURI || item.logo_uri || null,
    createdAt: createdAtMs ? new Date(createdAtMs).toISOString() : null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'BIRDEYE_API_KEY not configured' });
  }

  try {
    const response = await fetchBirdeye('/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=12', apiKey);
    const list = Array.isArray(response?.data?.tokens)
      ? response.data.tokens
      : Array.isArray(response?.data)
      ? response.data
      : [];

    const baseCoins = list.map(toCoin).filter((coin) => coin.address);

    const enriched = await Promise.allSettled(
      baseCoins.slice(0, 10).map(async (coin) => {
        const overview = await fetchBirdeye(`/defi/token_overview?address=${coin.address}`, apiKey);
        const data = overview?.data || {};
        const createdAtMs = resolveCreatedAtMs(data);
        return {
          ...coin,
          name: data.name || coin.name,
          symbol: data.symbol || coin.symbol,
          price: toNumber(data.price, coin.price),
          volume24h: toNumber(data.v24hUSD || data.volume24h, coin.volume24h),
          liquidity: toNumber(data.liquidity, coin.liquidity),
          marketCap: toNumber(data.mc || data.marketCap, coin.marketCap),
          change24h: getPriceChange24h(data, coin.change24h),
          volume24hChange: pickFirstNumber(data, ['v24hChangePercent', 'volumeChange24hPercent', 'volume_change_24h_percent'], coin.volume24hChange),
          change30m: pickFirstNumber(data, ['priceChange30mPercent', 'priceChange30m', 'price_change_30m'], coin.change30m),
          change1h: pickFirstNumber(data, ['priceChange1hPercent', 'priceChange1h', 'price_change_1h'], coin.change1h),
          change4h: pickFirstNumber(data, ['priceChange4hPercent', 'priceChange4h', 'price_change_4h'], coin.change4h),
          logo: data.logoURI || data.logo_uri || data.logo || coin.logo,
          createdAt: createdAtMs ? new Date(createdAtMs).toISOString() : coin.createdAt,
        };
      })
    );

    const merged = baseCoins.map((coin) => {
      const found = enriched.find(
        (r) => r.status === 'fulfilled' && r.value.address === coin.address
      );
      return found?.status === 'fulfilled' ? found.value : coin;
    });
    const coins = merged;

    const totalVolume = coins.reduce((sum, coin) => sum + coin.volume24h, 0);
    const totalLiquidity = coins.reduce((sum, coin) => sum + coin.liquidity, 0);
    const movers = coins.filter((coin) => Math.abs(coin.change24h) >= 8).length;

    return res.status(200).json({
      coins,
      stats: {
        trendingCount: coins.length,
        totalVolume24h: totalVolume,
        totalLiquidity,
        highVolatilityCount: movers,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch landing data' });
  }
}
