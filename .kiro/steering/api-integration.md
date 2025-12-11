---
inclusion: always
---

# API Integration - MANDATORY

## Core Principle: Real Data with 24-Hour Caching

**CRITICAL: Never use fake fee data. Use null placeholders for missing data.**

## Data Sources

### Current APIs (Reference Only)

**CoinMarketCap API** (currently used)
- Endpoint: `https://pro-api.coinmarketcap.com`
- Rate Limits: 333 calls/day (free tier)
- Used for: Exchange rankings, volumes, metadata
- Issue: Fee data is unreliable

**CoinGecko API** (currently used)
- Endpoint: `https://api.coingecko.com/api/v3`
- Rate Limits: 50 calls/minute (free tier)
- Used for: Trust scores, additional metadata

### Finding Better APIs

**Always research alternatives when:**
- Current APIs lack needed data
- Rate limits are too restrictive
- Data quality is poor
- Better free/paid options exist

**Research process:**
1. Search for official exchange APIs
2. Check crypto data aggregators
3. Evaluate data quality and completeness
4. Compare rate limits and pricing
5. Test endpoints before recommending

## Required Patterns

### API Route Structure

```typescript
// 24-hour cache pattern for all API routes
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json({ data: cache.data, cached: true });
  }
  
  try {
    const data = await fetchData();
    cache = { data, timestamp: Date.now() };
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    return res.status(200).json({ data, cached: false });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
```

### SWR Hook Pattern

```typescript
// Client-side caching with SWR
export function useExchangeFees() {
  const { data, error, isLoading } = useSWR('/api/cex-fees', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
  });
  return { fees: data?.data, isLoading, isError: error };
}
```

### Data Normalization

```typescript
// Always use null for missing fee data
export function normalizeExchangeData(rawData: any): CEXFees {
  return {
    exchangeId: rawData.slug || rawData.id?.toString(),
    exchangeName: rawData.name,
    logo: rawData.logo || `/logos/${rawData.slug}.png`,
    makerFee: null, // Never fake this
    takerFee: null, // Never fake this
    trustScore: rawData.trust_score || 0,
    volume24h: rawData.volume_24h || 0,
    lastUpdated: new Date().toISOString(),
  };
}
```

## Required Interfaces

### CEX Fees Interface

```typescript
interface CEXFees {
  exchangeId: string;
  exchangeName: string;
  logo: string;
  makerFee: number | null;    // null = data not available
  takerFee: number | null;    // null = data not available
  trustScore: number;         // 1-10 scale
  volume24h: number;          // USD
  country: string;
  url: string;
  lastUpdated: string;        // ISO timestamp
}
```

### DEX Fees Interface

```typescript
interface DEXFees {
  dexId: string;
  dexName: string;
  protocol: 'AMM' | 'Order Book' | 'Aggregator';
  blockchain: string[];
  swapFee: number | null;     // null = data not available
  liquidityUSD: number;
  volume24h: number;
  lastUpdated: string;
}
```

## Environment Variables

### Required Setup

```bash
# .env.local
COINMARKETCAP_API_KEY=your_key_here
```

Get free key at: <https://pro.coinmarketcap.com/signup>

## API Research Requirements

### Before Any Implementation

1. **Research available APIs**: Don't limit to current sources
2. **Test endpoints manually**: Use curl or Postman first
3. **Verify official documentation**: Use only official API docs
4. **Document response structure**: Capture real API responses
5. **Validate all parameters**: Test required vs optional
6. **Check rate limits**: Ensure caching strategy fits
7. **Compare alternatives**: Evaluate if better APIs exist

### Research Checklist

- [ ] Endpoint URL verified from official documentation
- [ ] Response structure captured from real API call
- [ ] Required/optional parameters tested
- [ ] Error responses documented
- [ ] Rate limits confirmed

## Critical Rules

### ✅ ALWAYS DO

- Research endpoints before implementing (never assume they exist)
- Test API calls manually with curl first
- Use 24-hour caching for all API routes
- Use null for missing fee data (never fake values)
- Include error handling with proper HTTP status codes
- Set cache headers on API responses
- Normalize all API responses to consistent interfaces
- Use environment variables for API keys

### ❌ NEVER DO

- Make up API endpoints or parameters
- Limit research to only current APIs
- Use unreliable data sources without exploring alternatives
- Create fake/hardcoded fee data
- Make API calls without caching
- Skip error handling in API routes
- Expose API keys in client-side code
- Commit API keys to Git

### Error Handling Pattern

```typescript
// Always include try-catch with proper error responses
try {
  const data = await fetchData();
  return res.status(200).json({ data });
} catch (error) {
  console.error('API Error:', error);
  return res.status(500).json({ error: 'Failed to fetch data' });
}
```

**Remember: 24-hour caching is essential to stay within free tier rate limits.**
