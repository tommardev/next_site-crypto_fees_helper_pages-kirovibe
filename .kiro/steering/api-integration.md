---
inclusion: always
---

# API Integration - MANDATORY

## Core Principle: Combined Data Sources, 24-Hour Caching

**CRITICAL: CoinMarketCap fee data is unreliable. Use CMC/CoinGecko only for reliable data with placeholders for fees.**

## Primary Data Sources (REQUIRED)

### CoinMarketCap API ⭐
**Endpoint**: `https://pro-api.coinmarketcap.com`
**Rate Limits**: 333 calls/day, 10,000 calls/month (free tier)
**Use For**: Exchange rankings, volumes, basic metadata ONLY (fee data is unreliable)

### CoinGecko API 
**Endpoint**: `https://api.coingecko.com/api/v3`
**Rate Limits**: 10-50 calls/minute (free tier)
**Use For**: Trust scores, additional metadata, supplementary data

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

### CEX Fee Interface (Updated for Placeholder Strategy):
```typescript
interface CEXFees {
  exchangeId: string;
  exchangeName: string;
  logo: string;
  makerFee: number | null;        // null = placeholder for missing fee data
  takerFee: number | null;        // null = placeholder for missing fee data
  withdrawalFees: { [coin: string]: number };  // Placeholder object
  depositFees: { [coin: string]: number };     // Placeholder object
  trustScore: number;      // 1-10 scale (from CoinGecko)
  volume24h: number;       // BTC (from CMC)
  country: string;
  url: string;
  lastUpdated: string;     // ISO timestamp
}
```

### DEX Fee Interface (Updated for Real API Data):
```typescript
interface DEXFees {
  dexId: string;
  dexName: string;
  logo: string;
  protocol: 'AMM' | 'Order Book' | 'Aggregator';
  blockchain: string[];    // ['Ethereum', 'BSC', 'Polygon']
  swapFee: number | null;  // null = placeholder for missing fee data
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

### Normalize Function (Updated for Placeholder Strategy):
```typescript
// lib/utils/normalize.ts
export function normalizeCombinedExchangeData(rawData: any): CEXFees {
  return {
    exchangeId: rawData.slug || rawData.id?.toString() || rawData.name?.toLowerCase().replace(/\s+/g, '-'),
    exchangeName: rawData.name,
    logo: rawData.logo || rawData.image || `/logos/${rawData.slug || rawData.id}.png`,
    // Use null placeholders for fee data (CMC fees are unreliable)
    makerFee: null, // Placeholder: Fee data not available
    takerFee: null, // Placeholder: Fee data not available
    withdrawalFees: {}, // Placeholder: Will be populated from dedicated sources
    depositFees: {}, // Placeholder: Will be populated from dedicated sources
    trustScore: rawData.trust_score || 0, // From CoinGecko
    volume24h: rawData.volume_24h || rawData.spot_volume_usd || rawData.trade_volume_24h_btc || 0,
    country: rawData.countries?.[0] || rawData.country || 'Unknown',
    url: rawData.urls?.website?.[0] || rawData.url || '',
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

# Recommended for better rate limits and DEX data
COINGECKO_API_KEY=your_key_here
# Get free key at: https://www.coingecko.com/en/api

# Optional
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
- Use CMC for exchange rankings and volumes only
- Use CoinGecko for trust scores and metadata
- Use null placeholders for missing fee data (never fake data)
- Implement 24-hour caching to stay within rate limits
- Include error handling with retry logic
- Normalize all API responses to consistent interfaces
- Set proper cache headers on API routes
- Never commit API keys to Git

### ❌ NEVER DO:
- Use CMC fee data (it's unreliable)
- Use fake/hardcoded fee data
- Make API calls without caching
- Skip error handling in API routes
- Hardcode API endpoints
- Expose API keys in client-side code

**Remember: Aggressive caching is essential to stay within free tier limits while providing real-time-feeling data.**
