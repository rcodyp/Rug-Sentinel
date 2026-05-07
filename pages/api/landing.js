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

function toCoin(item) {
  const createdAtRaw = item.createdAt || item.created_at || item.unixTime || null;
  const createdAtMs = createdAtRaw
    ? (createdAtRaw > 1000000000 ? createdAtRaw * 1000 : createdAtRaw)
    : null;

  return {
    address: item.address || item.mint || item.tokenAddress || '',
    symbol: item.symbol || item.tokenSymbol || 'UNKNOWN',
    name: item.name || item.tokenName || 'Unknown Token',
    price: toNumber(item.price || item.priceUsd || item.value),
    change24h: toNumber(
      item.priceChange24h ||
      item.price_change_24h ||
      item.priceChangePercent24h ||
      item.price_change_percent_24h
    ),
    volume24h: toNumber(item.v24hUSD || item.volume24h || item.volume_24h_usd),
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
        const createdAtRaw = data.createdAt || data.created_at || null;
        const createdAtMs = createdAtRaw
          ? (createdAtRaw > 1000000000 ? createdAtRaw * 1000 : createdAtRaw)
          : null;
        return {
          ...coin,
          name: data.name || coin.name,
          symbol: data.symbol || coin.symbol,
          price: toNumber(data.price, coin.price),
          volume24h: toNumber(data.v24hUSD || data.volume24h, coin.volume24h),
          liquidity: toNumber(data.liquidity, coin.liquidity),
          marketCap: toNumber(data.mc || data.marketCap, coin.marketCap),
          change24h: toNumber(data.v24hChangePercent || data.priceChange24h, coin.change24h),
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
