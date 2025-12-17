---
inclusion: always
---

# Development Workflow - MANDATORY

## Core Principle: Types-First Development with AI Integration

**Always define TypeScript types before implementing features. Use AI for real fee data collection.**

### Required Dependencies
```bash
npm install swr @google/genai dotenv
npm install -D @types/node
```

## Development Order (STRICT)

### Phase 1: Foundation
1. `lib/types/exchange.ts` - Define all interfaces first
2. `config/constants.ts` - App constants
3. `lib/api/error-handler.ts` - Error handling utilities

### Phase 2: API Layer
4. `lib/api/coinmarketcap.ts` - Exchange metadata source
5. `lib/api/coingecko.ts` - Supplementary data source
6. `lib/api/gemini.ts` - AI fee data collection
7. `lib/utils/normalize.ts` - Multi-source data transformation
8. `lib/utils/cache-optimizer.ts` - Advanced caching utilities
9. `pages/api/cex-fees.ts` - CEX API with AI enhancement
10. `pages/api/dex-fees.ts` - DEX API with AI enhancement
11. Test API endpoints and AI integration before UI components

### Phase 3: Hooks & Components
12. `lib/hooks/useExchangeFees.ts` - Batch loading data hooks
13. `lib/hooks/useFilters.ts` - Filter and search hooks
14. `components/common/CacheMonitor.tsx` - Cache status monitoring
15. `components/common/FeeDataStatus.tsx` - AI processing status
16. `components/exchange/ExchangeSkeleton.tsx` - Loading states
17. `components/exchange/ExchangeCard.tsx` - CEX components
18. `components/exchange/DEXCard.tsx` - DEX components
19. `components/layout/Layout.tsx` - Layout structure

### Phase 4: Pages & Integration
20. `pages/index.tsx` - Main CEX fees page with batch loading
21. `pages/dex.tsx` - DEX fees page with AI enhancement
22. `pages/about.tsx` - About page
23. `pages/contact.tsx` - Contact page
24. Integration testing, AI testing, and optimization

## Critical Rules

### ✅ ALWAYS DO:
- Define TypeScript interfaces before implementation
- Test API routes and AI integration directly before building UI
- Use real data with AI enhancement, never mock data
- Implement background AI processing with circuit breaker protection
- Implement error handling and loading states for all data sources
- Use `useColorModeValue` for dark mode compatibility
- Add ARIA labels for accessibility
- Test batch processing and pagination

### ❌ NEVER DO:
- Skip TypeScript type definitions
- Use `any` types
- Commit console.log statements
- Build UI without working API layer and AI integration
- Use hardcoded localhost URLs in production
- Block main API response waiting for AI enhancement
- Skip circuit breaker protection for AI calls
- Commit API keys to Git

## Quality Gates

### Before Each Commit:
- [ ] `npm run build` passes without errors
- [ ] All imports are used
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design tested
- [ ] Dark mode works

### API Route Requirements:
- [ ] Error handling with try-catch
- [ ] Proper HTTP status codes
- [ ] Cache headers set (72-hour configurable cache)
- [ ] Rate limiting implemented
- [ ] Type-safe responses
- [ ] Background AI processing implemented
- [ ] Batch processing support
- [ ] Circuit breaker protection for AI calls
- [ ] Global cache management

## Essential Patterns

### Data Fetching Hook Pattern:
```typescript
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

### API Route Pattern:
```typescript
// Global cache with AI enhancement and batch support
declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var cexAIProcessing: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { batch = '1', batchSize = '10' } = req.query;
  
  // Check configurable cache (72 hours default)
  if (global.cexCompleteCache && isCacheValid(global.cexCompleteCache.timestamp, CEX_CACHE_DURATION)) {
    const batchData = global.cexCompleteCache.data.slice(startIndex, endIndex);
    return res.status(200).json({ data: batchData, cached: true });
  }
  
  try {
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
    
    // Set optimized cache headers
    const headers = generateCacheHeaders('cex', false);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    return res.status(200).json({ 
      data: batchData, 
      cached: false,
      backgroundProcessing: !!process.env.GEMINI_API_KEY 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
```

## Deployment Checklist

### Pre-deployment (MANDATORY):
- [ ] Configure `next.config.js` for serverless deployment
- [ ] Test production build locally
- [ ] Verify all API routes work with batch processing
- [ ] Test AI integration with real API keys
- [ ] Test cache optimization and CDN headers
- [ ] Test on mobile devices
- [ ] Verify dark mode functionality
- [ ] Check no hardcoded localhost URLs
- [ ] All environment variables configured (CMC, Gemini, CoinGecko)
- [ ] Test circuit breaker protection

### Serverless Deployment Config:
```javascript
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cryptologos.cc' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
    ],
    unoptimized: false, // Enable optimization for serverless
  },
  // For static export (alternative deployment):
  // output: 'export',
  // images: { unoptimized: true },
  // trailingSlash: true,
};
```

## Common Issues & Solutions

### API Rate Limited (429)
**Solution**: Implement proper caching and rate limiting

### Build Fails with Static Export
**Solution**: Remove dynamic API routes or use build-time data fetching

### Dark Mode Not Working
**Solution**: Use `useColorModeValue` consistently throughout components

### Images Not Loading
**Solution**: Add fallback images and check paths

**Remember: Build incrementally, test frequently, never skip type definitions.**
