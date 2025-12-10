---
inclusion: always
---

# API Integration - MANDATORY

## Core Principle: CoinMarketCap Primary, 24-Hour Caching

**Use CoinMarketCap API as primary source with aggressive caching to stay within free tier limits.**

## Primary Data Source (REQUIRED)

### CoinMarketCap API ⭐
**Endpoint**: `https://pro-api.coinmarketcap.com`
**Rate Limits**: 333 calls/day, 10,000 calls/month (free tier)
**Why**: Provides REAL fee data (maker/taker fees) unlike CoinGecko

### Key Endpoints:
```typescript
// Get exchange ID map
GET /v1/exchange/map?start=1&limit=100&sort=volume_24h

// Get exchange details with REAL FEES
GET /v1/exchange/info?id=270,294,311
// Returns: maker_fee, taker_fee, spot_volume_usd
```

### Implementation Pattern (REQUIRED):
```typescript
// lib/api/coinmarketcap.ts
const BASE_URL = 'https://pro-api.coinmarketcap.com';
const API_KEY = process.env.COINMARKETCAP_API_KEY;

export async function fetchTopExchanges(limit = 100) {
  const response = await fetch(
    `${BASE_URL}/v1/exchange/map?start=1&limit=${limit}&sort=volume_24h`,
    { headers: { 'X-CMC_PRO_API_KEY': API_KEY } }
  );
  return response.json();
}
```

## Supplementary Sources

### CoinGecko API (Backup Data)
**Endpoint**: `https://api.coingecko.com/api/v3`
**Rate Limits**: 10-50 calls/minute (free tier)
**Use For**: Trust scores, additional metadata only

### DEX Data Sources
- **Uniswap Subgraph**: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3`
- **1inch API**: `https://api.1inch.dev/swap/v5.2/1`
- **PancakeSwap Subgraph**: For BSC DEX data

## Data Structures (MANDATORY)

### CEX Fee Interface:
```typescript
interface CEXFees {
  exchangeId: string;
  exchangeName: string;
  logo: string;
  makerFee: number;        // Percentage (e.g., 0.1 for 0.1%)
  takerFee: number;        // Percentage
  withdrawalFees: { [coin: string]: number };
  trustScore: number;      // 1-10 scale
  volume24h: number;       // USD
  country: string;
  url: string;
  lastUpdated: string;     // ISO timestamp
}
```

### DEX Fee Interface:
```typescript
interface DEXFees {
  dexId: string;
  dexName: string;
  logo: string;
  protocol: 'AMM' | 'Order Book' | 'Aggregator';
  blockchain: string[];    // ['Ethereum', 'BSC', 'Polygon']
  swapFee: number;         // Percentage
  gasFeeEstimate: { [blockchain: string]: { low: number; average: number; high: number } };
  liquidityUSD: number;
  volume24h: number;
  url: string;
  lastUpdated: string;
}
```

## Caching Strategy (CRITICAL)

### API Route Cache Pattern (REQUIRED):
```typescript
// pages/api/cex-fees.ts
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check cache first
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json({
      data: cache.data,
      cached: true,
      cachedAt: new Date(cache.timestamp).toISOString(),
    });
  }

  try {
    const data = await fetchAllExchangeFees();
    cache = { data, timestamp: Date.now() };
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');
    return res.status(200).json({ data, cached: false });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exchange fees' });
  }
}
```

### Client-Side Caching (REQUIRED):
```typescript
// lib/hooks/useExchangeFees.ts
import useSWR from 'swr';

export function useExchangeFees() {
  const { data, error, isLoading } = useSWR('/api/cex-fees', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
    dedupingInterval: 60000, // 1 minute
  });

  return {
    fees: data?.data,
    isLoading,
    isError: error,
    cachedAt: data?.cachedAt,
  };
}
```

## Error Handling (MANDATORY)

### API Error Class:
```typescript
// lib/api/error-handler.ts
export class APIError extends Error {
  constructor(message: string, public statusCode: number, public source: string) {
    super(message);
    this.name = 'APIError';
  }
}

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status, url);
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000)); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Rate Limiting (REQUIRED)

### Simple Rate Limiter:
```typescript
// lib/api/rate-limiter.ts
class RateLimiter {
  private requests: number[] = [];
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  async throttle(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.requests[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }
    
    this.requests.push(now);
  }
}

const coinGeckoLimiter = new RateLimiter(50, 60000); // 50 req/min
```

## Data Normalization (REQUIRED)

### Normalize Function:
```typescript
// lib/utils/normalize.ts
export function normalizeCEXData(rawData: any): CEXFees {
  return {
    exchangeId: rawData.id,
    exchangeName: rawData.name,
    logo: rawData.image || `/logos/${rawData.id}.png`,
    makerFee: parseFloat(rawData.maker_fee) || 0,
    takerFee: parseFloat(rawData.taker_fee) || 0,
    withdrawalFees: rawData.withdrawal_fees || {},
    trustScore: rawData.trust_score || 0,
    volume24h: rawData.trade_volume_24h_btc || 0,
    country: rawData.country || 'Unknown',
    url: rawData.url || '',
    lastUpdated: new Date().toISOString(),
  };
}
```

## Environment Setup (CRITICAL)

### Required Environment Variables:
```bash
# .env.local
COINMARKETCAP_API_KEY=your_api_key_here
# Get free key at: https://pro.coinmarketcap.com/signup

# Optional
NEXT_PUBLIC_COINGECKO_API_KEY=your_key_here
REDIS_URL=your_redis_url  # For persistent caching
```

### CoinMarketCap API Key Setup:
1. Go to https://pro.coinmarketcap.com/signup
2. Sign up for free account (Basic Plan)
3. Verify email
4. Go to API Keys section
5. Copy API key
6. Add to `.env.local`

**Free Tier**: 333 calls/day, 10,000 calls/month (perfect with 24-hour caching)

### Netlify Environment Variables:
1. Netlify dashboard → Site settings → Environment variables
2. Add variable: `COINMARKETCAP_API_KEY` = your_key
3. Select all scopes (Production, Deploy Previews, Branch deploys)
4. Save and redeploy

## Critical Rules

### ✅ ALWAYS DO:
- Use CoinMarketCap as primary data source
- Implement 24-hour caching to stay within rate limits
- Include error handling with retry logic
- Normalize all API responses to consistent interfaces
- Set proper cache headers on API routes
- Never commit API keys to Git

### ❌ NEVER DO:
- Make API calls without caching
- Use CoinGecko for fee data (unreliable)
- Skip error handling in API routes
- Hardcode API endpoints
- Expose API keys in client-side code

**Remember: Aggressive caching is essential to stay within free tier limits while providing real-time-feeling data.**
