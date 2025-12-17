---
inclusion: always
---

# API Integration - MANDATORY

## Core Principle: Real Data with AI Enhancement + Configurable Caching

**CRITICAL: Never use fake fee data. Use AI to collect real fee data, null placeholders for missing data.**

## Data Sources

### Current Multi-Source Strategy

**CoinMarketCap API** (exchange metadata)
- Endpoint: `https://pro-api.coinmarketcap.com`
- Rate Limits: 333 calls/day (free tier)
- Used for: Exchange rankings, volumes, basic metadata
- Note: Fee data excluded (unreliable)

**CoinGecko API** (supplementary data)
- Endpoint: `https://api.coingecko.com/api/v3`
- Rate Limits: 50 calls/minute (free tier)
- Used for: Trust scores, additional metadata

**DeFiLlama API** (DEX data)
- Endpoint: `https://api.llama.fi`
- Rate Limits: No key required
- Used for: Real DEX volumes, liquidity, protocols

**Google Gemini AI** (fee data collection)
- Model: Gemini 2.5 Flash
- Used for: Real trading fees via AI-powered research
- Batch processing with circuit breaker protection

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
// Global cache with AI enhancement and configurable duration
declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var cexAIProcessing: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { batch = '1', batchSize = '10' } = req.query;
  
  // Check configurable cache (72 hours default)
  if (global.cexCompleteCache && isCacheValid(global.cexCompleteCache.timestamp, CEX_CACHE_DURATION)) {
    const batchData = global.cexCompleteCache.data.slice(startIndex, endIndex);
    return res.status(200).json({ data: batchData, cached: true });
  }
  
  // Fetch metadata from multiple sources
  const rawData = await fetchCombinedExchangeData(50);
  const normalizedData = rawData.map(normalizeCombinedExchangeData);
  
  // Start AI enhancement in background (non-blocking)
  if (process.env.GEMINI_API_KEY && !global.cexAIProcessing) {
    global.cexAIProcessing = true;
    enhanceWithAI(normalizedData).finally(() => {
      global.cexAIProcessing = false;
    });
  }
  
  // Return immediate response with placeholder data
  return res.status(200).json({ 
    data: batchData, 
    cached: false,
    backgroundProcessing: !!process.env.GEMINI_API_KEY 
  });
}
```

### SWR Hook Pattern

```typescript
// Client-side caching with batch loading and real-time updates
export function useExchangeFees() {
  const { data, error, isLoading } = useSWR('/api/cex-fees?batch=1&batchSize=20', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 72 * 60 * 60 * 1000, // 72 hours (configurable)
  });
  
  // Load additional batches as needed
  const loadMoreBatches = useCallback(async (totalBatches: number) => {
    for (let batch = 2; batch <= totalBatches; batch++) {
      await fetcher(`/api/cex-fees?batch=${batch}&batchSize=20`);
    }
  }, []);
  
  return { 
    fees: data?.data || [], 
    isLoading, 
    isError: error,
    backgroundProcessing: data?.backgroundProcessing,
    loadMoreBatches 
  };
}
```

### Data Normalization

```typescript
// Normalize combined data from multiple sources
export function normalizeCombinedExchangeData(rawData: any): CEXFees {
  return {
    exchangeId: rawData.slug || rawData.id?.toString(),
    exchangeName: rawData.name,
    logo: rawData.logo || rawData.image || `/logos/default.svg`,
    makerFee: null, // Will be filled by AI enhancement
    takerFee: null, // Will be filled by AI enhancement
    withdrawalFees: {}, // Will be filled by AI enhancement
    depositFees: {}, // Will be filled by AI enhancement
    trustScore: rawData.trust_score || 0,
    volume24h: rawData.trade_volume_24h_btc || rawData.volume_24h || 0,
    yearEstablished: rawData.year_established || null,
    country: rawData.country || rawData.countries?.[0] || '',
    url: rawData.url || rawData.urls?.website?.[0] || '',
    lastUpdated: new Date().toISOString(),
  };
}

// AI enhancement merging
export function mergeCEXFeeData(exchanges: CEXFees[], aiData: CEXFeeData[]): CEXFees[] {
  const feeMap = new Map(aiData.map(fee => [fee.exchangeId, fee]));
  
  return exchanges.map(exchange => {
    const aiFeesData = feeMap.get(exchange.exchangeId);
    return aiFeesData ? { ...exchange, ...aiFeesData, lastUpdated: new Date().toISOString() } : exchange;
  });
}
```

## Required Interfaces

### CEX Fees Interface

```typescript
interface CEXFees {
  exchangeId: string;
  exchangeName: string;
  logo: string;
  makerFee: number | null;        // Percentage - null until AI enhanced
  takerFee: number | null;        // Percentage - null until AI enhanced
  withdrawalFees: {               // Absolute amounts by coin
    [coin: string]: number;
  };
  depositFees: {                  // Absolute amounts by coin
    [coin: string]: number;
  };
  trustScore: number;             // 1-10 scale from CoinGecko
  volume24h: number;              // BTC from CoinMarketCap
  yearEstablished: number | null;
  country: string;
  url: string;
  lastUpdated: string;            // ISO timestamp
}
```

### DEX Fees Interface

```typescript
interface DEXFees {
  dexId: string;
  dexName: string;
  logo: string;
  protocol: 'AMM' | 'Order Book' | 'Aggregator';
  blockchain: string[];           // Multiple chains supported
  swapFee: number | null;         // Percentage - null until AI enhanced
  gasFeeEstimate: {               // USD estimates by blockchain
    [blockchain: string]: {
      low: number;
      average: number;
      high: number;
    };
  };
  liquidityUSD: number;           // From DeFiLlama
  volume24h: number;              // From DeFiLlama
  url: string;
  lastUpdated: string;
}
```

## Environment Variables

### Required Setup

```bash
# .env.local
# REQUIRED: CoinMarketCap API Key
COINMARKETCAP_API_KEY=your_key_here

# REQUIRED: Google Gemini API Key for AI fee collection
GEMINI_API_KEY=your_gemini_key_here

# Optional: CoinGecko API Key (higher rate limits)
COINGECKO_API_KEY=your_coingecko_key_here

# Cache Configuration (hours)
CEX_CACHE_HOURS=72
DEX_CACHE_HOURS=72
```

**Get API Keys:**
- CoinMarketCap: <https://pro.coinmarketcap.com/signup>
- Google Gemini: <https://aistudio.google.com/app/apikey>
- CoinGecko: <https://www.coingecko.com/en/api>

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
- Use configurable caching (72 hours default) for all API routes
- Use null for missing fee data until AI enhancement completes
- Implement background AI processing with circuit breaker protection
- Include error handling with proper HTTP status codes
- Set optimized cache headers for CDN
- Normalize all API responses to consistent interfaces
- Use environment variables for all API keys
- Implement batch processing for large datasets

### ❌ NEVER DO

- Make up API endpoints or parameters
- Limit research to only current APIs
- Use unreliable data sources without exploring alternatives
- Create fake/hardcoded fee data (use AI to collect real data)
- Make API calls without caching
- Skip error handling in API routes
- Expose API keys in client-side code
- Commit API keys to Git
- Block main API response waiting for AI enhancement
- Skip circuit breaker protection for AI calls

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

**Remember: 72-hour configurable caching + AI enhancement provides real fee data while respecting rate limits.**
