const BIRDEYE_BASE = 'https://public-api.birdeye.so';
const CHAIN = 'solana';

async function birdeyeFetch(path, apiKey) {
  const url = `${BIRDEYE_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': CHAIN,
      'accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(text)
    throw new Error(`Birdeye ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}


export async function fetchAllTokenData(tokenAddress, apiKey) {
  // Run all fetches in parallel for speed
  const [overview, security, holders, ohlcv, txs, trending] = await Promise.allSettled([
    birdeyeFetch(`/defi/token_overview?address=${tokenAddress}`, apiKey),
    birdeyeFetch(`/defi/token_security?address=${tokenAddress}`, apiKey),
    birdeyeFetch(`/defi/v3/token/holder?address=${tokenAddress}&limit=20`, apiKey),
    birdeyeFetch(`/defi/ohlcv?address=${tokenAddress}&type=1H&time_from=${Math.floor(Date.now()/1000) - 86400}&time_to=${Math.floor(Date.now()/1000)}`, apiKey),
    birdeyeFetch(`/defi/txs/token?address=${tokenAddress}&tx_type=swap&limit=50`, apiKey),
    birdeyeFetch(`/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=20`, apiKey),
  ]);

  return {
    overview: overview.status === 'fulfilled' ? overview.value?.data : null,
    security: security.status === 'fulfilled' ? security.value?.data : null,
    holders: holders.status === 'fulfilled' ? holders.value?.data : null,
    ohlcv: ohlcv.status === 'fulfilled' ? ohlcv.value?.data : null,
    txs: txs.status === 'fulfilled' ? txs.value?.data : null,
    trending: trending.status === 'fulfilled' ? trending.value?.data : null,
    errors: {
      overview: overview.status === 'rejected' ? overview.reason?.message : null,
      security: security.status === 'rejected' ? security.reason?.message : null,
      holders: holders.status === 'rejected' ? holders.reason?.message : null,
      ohlcv: ohlcv.status === 'rejected' ? ohlcv.reason?.message : null,
      txs: txs.status === 'rejected' ? txs.reason?.message : null,
      trending: trending.status === 'rejected' ? trending.reason?.message : null,
    }
  };
}
