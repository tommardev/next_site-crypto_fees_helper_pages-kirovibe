---
inclusion: always
---

# API Integration Guidelines

## API Data Sources (Priority Order)

### 1. CoinMarketCap API (PRIMARY - API KEY REQUIRED) ⭐
**Endpoint**: `https://pro-api.coinmarketcap.com`

**Rate Limits**: 
- Basic (Free): 333 calls/day, 10,000 calls/month
- Hobbyist: $29/month - 10,000 calls/day
- Startup: $79/month - 30,000 calls/day

**Why CoinMarketCap**: Provides REAL fee data (maker/taker fees) unlike CoinGecko

**Useful Endpoints**:
```typescript
// Get exchange ID map (for top exchanges)
GET /v1/exchange/map?start=1&limit=100&sort=volume_24h
// Returns: id, name, slug, is_active

// Get exchange details with REAL FEES
GET /v1/exchange/info?id=270,294,311
// Returns: maker_fee, taker_fee, spot_volume_usd, etc.
```

**Implementation Example**:
```typescript
// lib/api/coinmarketcap.ts
const BASE_URL = 'https://pro-api.coinmarketcap.com';
const API_KEY = process.env.COINMARKETCAP_API_KEY;

export async function fetchTopExchanges(limit = 100) {
  const response = await fetch(
    `${BASE_URL}/v1/exchange/map?start=1&limit=${limit}&sort=volume_24h`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
      },
    }
  );
  return response.json();
}

export async function fetchExchangeInfo(ids: number[]) {
  const response = await fetch(
    `${BASE_URL}/v1/exchange/info?id=${ids.join(',')}`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
      },
    }
  );
  return response.json();
}
```

### 2. CoinGecko API (SUPPLEMENTARY - NO API KEY REQUIRED)
**Endpoint**: `https://api.coingecko.com/api/v3`

**Rate Limits**: 10-50 calls/minute (free tier)

**Use For**: Trust scores, additional metadata, backup data

**Useful Endpoints**:
```typescript
// Get list of exchanges with trust scores
GET /exchanges
// Returns: id, name, trust_score, trade_volume_24h_btc
```

### 2. Binance Public API (NO API KEY REQUIRED)
**Endpoint**: `https://api.binance.com/api/v3`

**Rate Limits**: 1200 requests/minute

**Useful Endpoints**:
```typescript
// Get trading fees (requires API key for user-specific, but general info available)
GET /exchangeInfo
// Returns: trading rules, fees structure

// Get 24hr ticker price change statistics
GET /ticker/24hr
```

### 3. Kraken Public API (NO API KEY REQUIRED)
**Endpoint**: `https://api.kraken.com/0/public`

**Useful Endpoints**:
```typescript
// Get asset pairs with fee info
GET /AssetPairs
// Returns: fees, fee_volume_currency

// Get ticker information
GET /Ticker
```

### 4. Coinbase Public API (NO API KEY REQUIRED)
**Endpoint**: `https://api.coinbase.com/v2`

**Useful Endpoints**:
```typescript
// Get exchange rates
GET /exchange-rates

// Get spot prices
GET /prices/{currency_pair}/spot
```

### 5. DEX Data Sources

#### Uniswap Subgraph (FREE)
**Endpoint**: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3`

```graphql
query {
  pools(first: 20, orderBy: volumeUSD, orderDirection: desc) {
    id
    feeTier
    volumeUSD
    token0 { symbol }
    token1 { symbol }
  }
}
```

#### 1inch API (FREE with limits)
**Endpoint**: `https://api.1inch.dev/swap/v5.2/1`

```typescript
// Get liquidity sources
GET /liquidity-sources
```

#### PancakeSwap Subgraph (FREE)
**Endpoint**: `https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2`

## Data Aggregation Strategy

### CEX Fee Structure
```typescript
interface CEXFees {
  exchangeId: string;
  exchangeName: string;
  logo: string;
  makerFee: number;        // Percentage (e.g., 0.1 for 0.1%)
  takerFee: number;        // Percentage
  withdrawalFees: {
    [coin: string]: number; // Absolute amount
  };
  depositFees: {
    [coin: string]: number;
  };
  trustScore: number;      // 1-10 scale
  volume24h: number;       // USD
  yearEstablished: number;
  country: string;
  url: string;
  lastUpdated: string;     // ISO timestamp
}
```

### DEX Fee Structure
```typescript
interface DEXFees {
  dexId: string;
  dexName: string;
  logo: string;
  protocol: 'AMM' | 'Order Book' | 'Aggregator';
  blockchain: string[];    // ['Ethereum', 'BSC', 'Polygon']
  swapFee: number;         // Percentage
  gasFeeEstimate: {
    [blockchain: string]: {
      low: number;         // USD
      average: number;
      high: number;
    };
  };
  liquidityUSD: number;
  volume24h: number;
  url: string;
  lastUpdated: string;
}
```

## Caching Implementation

### API Route with Built-in Cache
```typescript
// pages/api/cex-fees.ts
import { NextApiRequest, NextApiResponse } from 'next';

// In-memory cache (for development)
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json({
      data: cache.data,
      cached: true,
      cachedAt: new Date(cache.timestamp).toISOString(),
    });
  }

  try {
    // Fetch fresh data
    const data = await fetchAllExchangeFees();
    
    // Update cache
    cache = {
      data,
      timestamp: Date.now(),
    };

    // Set cache headers
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=172800'
    );

    return res.status(200).json({
      data,
      cached: false,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exchange fees' });
  }
}
```

### Client-Side Caching with SWR
```typescript
// lib/hooks/useExchangeFees.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

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

## Error Handling

### API Error Wrapper
```typescript
// lib/api/error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public source: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Rate Limiting Strategy

### Simple Rate Limiter
```typescript
// lib/api/rate-limiter.ts
class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }
    
    this.requests.push(now);
  }
}

// Usage
const coinGeckoLimiter = new RateLimiter(50, 60000); // 50 req/min

export async function fetchWithRateLimit(url: string) {
  await coinGeckoLimiter.throttle();
  return fetch(url);
}
```

## Data Transformation

### Normalize Exchange Data
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
    depositFees: {},
    trustScore: rawData.trust_score || 0,
    volume24h: rawData.trade_volume_24h_btc || 0,
    yearEstablished: rawData.year_established || 0,
    country: rawData.country || 'Unknown',
    url: rawData.url || '',
    lastUpdated: new Date().toISOString(),
  };
}
```

## Environment Setup

### Required Environment Variables
```bash
# .env.local

# REQUIRED: CoinMarketCap API Key for real fee data
COINMARKETCAP_API_KEY=your_api_key_here

# Get your free API key at: https://pro.coinmarketcap.com/signup

# Optional: For higher rate limits on CoinGecko
NEXT_PUBLIC_COINGECKO_API_KEY=your_key_here

# Optional: For persistent caching
REDIS_URL=your_redis_url
VERCEL_KV_URL=your_vercel_kv_url
```

### Getting CoinMarketCap API Key

1. Go to https://pro.coinmarketcap.com/signup
2. Sign up for a free account (Basic Plan)
3. Verify your email
4. Go to API Keys section
5. Copy your API key
6. Add to `.env.local` file

**Free Tier Limits**:
- 333 calls per day
- 10,000 calls per month
- Perfect for this use case with 24-hour caching

### Netlify Environment Variables

To add the API key to Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - **Key**: `COINMARKETCAP_API_KEY`
   - **Value**: Your API key
   - **Scopes**: Select all (Production, Deploy Previews, Branch deploys)
6. Click **Save**
7. Redeploy your site for changes to take effect

**Important**: Never commit API keys to Git. Always use environment variables.

## Testing API Integration

### Test API Endpoints
```typescript
// lib/api/__tests__/coingecko.test.ts
describe('CoinGecko API', () => {
  it('should fetch exchanges list', async () => {
    const exchanges = await fetchExchanges();
    expect(Array.isArray(exchanges)).toBe(true);
    expect(exchanges.length).toBeGreaterThan(0);
  });
  
  it('should handle rate limiting', async () => {
    // Test rate limiter behavior
  });
  
  it('should use cached data when available', async () => {
    // Test caching mechanism
  });
});
```
