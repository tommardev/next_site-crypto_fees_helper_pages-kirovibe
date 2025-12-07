---
inclusion: always
---

# Development Workflow & Best Practices

## Getting Started

### Initial Setup
```bash
# Install dependencies
npm install

# Install additional required packages
npm install swr axios
npm install -D @types/node

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm start
```

### Required Dependencies to Add
```json
{
  "dependencies": {
    "swr": "^2.2.4",
    "axios": "^1.6.2"
  }
}
```

## Development Process

### 1. Start with Types
Always define TypeScript types before implementing features:

```typescript
// lib/types/exchange.ts - Define first
export interface CEXFees {
  exchangeId: string;
  exchangeName: string;
  // ... rest of interface
}

// Then implement API
// lib/api/cex-api.ts
export async function fetchCEXFees(): Promise<CEXFees[]> {
  // Implementation
}
```

### 2. Build API Layer First
Before creating UI components, ensure data fetching works:

```bash
# Test API route directly
curl http://localhost:3000/api/cex-fees

# Or use browser
http://localhost:3000/api/cex-fees
```

### 3. Create Components Incrementally
Build from smallest to largest:
1. Basic UI components (cards, skeletons)
2. Container components (grids, filters)
3. Page components
4. Layout components

### 4. Test with Real Data
Never use mock data. Always test with actual API responses:

```typescript
// ❌ Don't do this
const mockData = [{ id: 1, name: 'Binance' }];

// ✅ Do this
const { data, error } = useSWR('/api/cex-fees', fetcher);
```

## File Creation Order

### Phase 1: Foundation (Types & Config)
```
1. lib/types/exchange.ts
2. lib/types/api.ts
3. config/constants.ts
4. config/exchanges.ts
```

### Phase 2: API Layer
```
5. lib/api/error-handler.ts
6. lib/api/rate-limiter.ts
7. lib/api/coingecko.ts
8. lib/utils/normalize.ts
9. pages/api/cex-fees.ts
10. pages/api/dex-fees.ts
```

### Phase 3: Hooks & Utils
```
11. lib/hooks/useExchangeFees.ts
12. lib/hooks/useDEXFees.ts
13. lib/hooks/useFilters.ts
14. lib/utils/formatters.ts
15. lib/utils/sorting.ts
```

### Phase 4: Components
```
16. components/common/ErrorBoundary.tsx
17. components/common/ErrorAlert.tsx
18. components/exchange/ExchangeSkeleton.tsx
19. components/exchange/ExchangeCard.tsx
20. components/exchange/ExchangeGrid.tsx
21. components/exchange/ExchangeFilters.tsx
22. components/layout/Header.tsx
23. components/layout/Footer.tsx
24. components/layout/Layout.tsx
```

### Phase 5: Pages
```
25. src/pages/index.tsx (CEX fees page)
26. src/pages/dex.tsx
27. src/pages/about.tsx
28. src/pages/contact.tsx
```

### Phase 6: Configuration & Optimization
```
29. next.config.js (update for static export)
30. src/theme.tsx (enhance theme)
31. .env.local.example
32. README.md (update documentation)
```

## Code Quality Checklist

### Before Committing
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console.log statements (except intentional logging)
- [ ] All imports are used
- [ ] Components have proper TypeScript types
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Responsive design works on mobile
- [ ] Dark mode works correctly
- [ ] Accessibility attributes are present

### Component Checklist
- [ ] Proper TypeScript interface for props
- [ ] Loading skeleton implemented
- [ ] Error state handled
- [ ] Empty state handled
- [ ] Responsive breakpoints defined
- [ ] Color mode values used
- [ ] ARIA labels for interactive elements
- [ ] Memoization where appropriate

### API Route Checklist
- [ ] Error handling with try-catch
- [ ] Proper HTTP status codes
- [ ] Cache headers set
- [ ] Rate limiting implemented
- [ ] Type-safe responses
- [ ] Logging for debugging

## Common Patterns

### Fetching Data in Pages
```typescript
// pages/index.tsx
import { Layout } from '@/components/layout/Layout';
import { ExchangeGrid } from '@/components/exchange/ExchangeGrid';
import { ExchangeFilters } from '@/components/exchange/ExchangeFilters';
import { useExchangeFees } from '@/lib/hooks/useExchangeFees';
import { useState, useMemo } from 'react';

export default function HomePage() {
  const { fees, isLoading, isError } = useExchangeFees();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank');

  const filteredExchanges = useMemo(() => {
    if (!fees) return [];
    
    let filtered = fees.filter(exchange =>
      exchange.exchangeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.exchangeName.localeCompare(b.exchangeName));
        break;
      case 'makerFee':
        filtered.sort((a, b) => a.makerFee - b.makerFee);
        break;
      // ... other cases
    }

    return filtered;
  }, [fees, searchQuery, sortBy]);

  return (
    <Layout>
      <ExchangeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={() => {
          setSearchQuery('');
          setSortBy('rank');
        }}
      />
      <ExchangeGrid
        exchanges={filteredExchanges}
        isLoading={isLoading}
      />
    </Layout>
  );
}
```

### Creating API Routes
```typescript
// pages/api/cex-fees.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchExchanges } from '@/lib/api/coingecko';
import { normalizeCEXData } from '@/lib/utils/normalize';

let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return res.status(200).json({
        data: cache.data,
        cached: true,
        cachedAt: new Date(cache.timestamp).toISOString(),
      });
    }

    // Fetch fresh data
    const rawData = await fetchExchanges();
    const normalizedData = rawData.map(normalizeCEXData);

    // Update cache
    cache = { data: normalizedData, timestamp: Date.now() };

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');
    
    return res.status(200).json({
      data: normalizedData,
      cached: false,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch exchange fees',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

## Debugging Tips

### Check API Responses
```typescript
// Add logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Response:', data);
}
```

### Inspect Cache
```typescript
// Add cache inspection endpoint
// pages/api/cache-status.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    hasCachedData: cache !== null,
    cacheAge: cache ? Date.now() - cache.timestamp : null,
    cacheExpiry: cache ? CACHE_DURATION - (Date.now() - cache.timestamp) : null,
  });
}
```

### Test Rate Limiting
```typescript
// Test with multiple rapid requests
for (let i = 0; i < 10; i++) {
  fetch('/api/cex-fees').then(r => console.log(`Request ${i}:`, r.status));
}
```

## Performance Monitoring

### Measure Component Render Time
```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="ExchangeGrid" onRender={onRenderCallback}>
  <ExchangeGrid exchanges={exchanges} />
</Profiler>
```

### Check Bundle Size
```bash
# Analyze bundle
npm run build
# Check .next/static/chunks for large files
```

## Deployment Preparation

### Pre-deployment Checklist
- [ ] Update `next.config.js` for static export
- [ ] Test production build locally (`npm run build && npm start`)
- [ ] Verify all API routes work
- [ ] Check cache is working
- [ ] Test on mobile devices
- [ ] Verify dark mode
- [ ] Check all links work
- [ ] Ensure no hardcoded localhost URLs
- [ ] Add proper meta tags for SEO
- [ ] Test with slow network (throttling)

### Environment Variables
```bash
# Create .env.local.example for documentation
NEXT_PUBLIC_COINGECKO_API_KEY=optional_key_here
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

### Static Export Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Disable API routes for static export
  // Move API logic to build time or external service
};

module.exports = nextConfig;
```

## Git Workflow

### Commit Message Format
```
feat: Add CEX exchange card component
fix: Resolve caching issue in API route
style: Update dark mode colors
refactor: Simplify exchange filtering logic
docs: Update README with API documentation
```

### Branch Strategy
```bash
main          # Production-ready code
develop       # Development branch
feature/*     # New features
fix/*         # Bug fixes
```

## Troubleshooting

### Common Issues

#### Issue: API returns 429 (Rate Limited)
**Solution**: Implement rate limiting and caching properly

#### Issue: Images not loading
**Solution**: Check image paths and add fallback images

#### Issue: Dark mode not working
**Solution**: Ensure `useColorModeValue` is used consistently

#### Issue: Build fails with static export
**Solution**: Remove dynamic API routes or use build-time data fetching

#### Issue: Cache not persisting
**Solution**: Use external cache (Redis/Vercel KV) for production

## Next Steps After Setup

1. Test CoinGecko API integration
2. Implement basic CEX fees page
3. Add filtering and sorting
4. Implement DEX fees page
5. Add About and Contact pages
6. Optimize performance
7. Deploy to Vercel/Netlify
8. Monitor and iterate
