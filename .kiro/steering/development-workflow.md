---
inclusion: always
---

# Development Workflow - MANDATORY

## Core Principle: Types-First Development

**Always define TypeScript types before implementing features.**

### Required Dependencies
```bash
npm install swr axios
npm install -D @types/node
```

## Development Order (STRICT)

### Phase 1: Foundation
1. `lib/types/exchange.ts` - Define all interfaces first
2. `config/constants.ts` - App constants
3. `lib/api/error-handler.ts` - Error handling utilities

### Phase 2: API Layer
4. `lib/api/coinmarketcap.ts` - Primary data source
5. `lib/utils/normalize.ts` - Data transformation
6. `pages/api/cex-fees.ts` - API routes with caching
7. Test API endpoints before UI components

### Phase 3: Hooks & Components
8. `lib/hooks/useExchangeFees.ts` - Data fetching hooks
9. `components/exchange/ExchangeSkeleton.tsx` - Loading states
10. `components/exchange/ExchangeCard.tsx` - Core components
11. `components/layout/Layout.tsx` - Layout structure

### Phase 4: Pages & Integration
12. `pages/index.tsx` - Main CEX fees page
13. `pages/dex.tsx` - DEX fees page
14. Integration testing and optimization

## Critical Rules

### ✅ ALWAYS DO:
- Define TypeScript interfaces before implementation
- Test API routes directly before building UI
- Use real data, never mock data
- Implement error handling and loading states
- Use `useColorModeValue` for dark mode compatibility
- Add ARIA labels for accessibility

### ❌ NEVER DO:
- Skip TypeScript type definitions
- Use `any` types
- Commit console.log statements
- Build UI without working API layer
- Use hardcoded localhost URLs in production

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
- [ ] Cache headers set (24-hour cache)
- [ ] Rate limiting implemented
- [ ] Type-safe responses

## Essential Patterns

### Data Fetching Hook Pattern:
```typescript
export function useExchangeFees() {
  const { data, error, isLoading } = useSWR('/api/cex-fees', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
  });
  return { fees: data?.data, isLoading, isError: error };
}
```

### API Route Pattern:
```typescript
// Always include cache, error handling, and proper headers
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check cache first
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

## Deployment Checklist

### Pre-deployment (MANDATORY):
- [ ] Update `next.config.js` for static export
- [ ] Test production build locally
- [ ] Verify all API routes work
- [ ] Test on mobile devices
- [ ] Verify dark mode functionality
- [ ] Check no hardcoded localhost URLs
- [ ] Environment variables configured

### Static Export Config:
```javascript
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
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
