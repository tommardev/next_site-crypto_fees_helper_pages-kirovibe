---
inclusion: always
---

# Crypto Exchange Fees Comparison - Project Architecture

## Core Technology Stack

Next.js 16+ (Pages Router) + TypeScript + Chakra UI + SWR + Gemini AI

- **Data Sources**: CoinMarketCap (rankings), CoinGecko (trust scores), DeFiLlama (DEX data), Gemini AI (fee data)
- **UI Framework**: Chakra UI v2+ with built-in dark mode
- **Data Fetching**: SWR with configurable 72-hour caching
- **AI Enhancement**: Google Gemini 2.5 Flash for real fee data collection
- **Deployment**: Serverless functions with CDN caching

## Project Structure (MANDATORY)

```text
src/
├── pages/
│   ├── index.tsx          # CEX fees main page
│   ├── dex.tsx            # DEX fees page
│   ├── about.tsx          # About page
│   ├── contact.tsx        # Contact page
│   ├── api/
│   │   ├── cex-fees.ts         # CEX API with AI enhancement
│   │   ├── dex-fees.ts         # DEX API with AI enhancement
│   │   ├── enhance-fees.ts     # Manual AI enhancement
│   │   ├── cex-fees-batch.ts   # Batch CEX processing
│   │   ├── dex-fees-batch.ts   # Batch DEX processing
│   │   ├── cache-status.ts     # Cache monitoring
│   │   └── ai-status.ts        # AI processing status
├── components/
│   ├── exchange/          # ExchangeCard, DEXCard, Grids, Filters
│   ├── layout/            # Header, Footer, Layout
│   └── common/            # ErrorBoundary, CacheMonitor, FeeDataStatus
├── lib/
│   ├── api/               # coinmarketcap.ts, coingecko.ts, gemini.ts
│   ├── hooks/             # useExchangeFees.ts, useFilters.ts
│   ├── types/             # exchange.ts, api.ts
│   └── utils/             # normalize.ts, cache-optimizer.ts
├── config/
│   └── constants.ts       # App constants with configurable cache
```

## Architecture Principles

### Component Rules
- **Always use TypeScript interfaces** - Never use `any` types
- **Chakra UI components only** - Use `useColorModeValue` for dark mode
- **Named exports preferred** - `export function ComponentName`
- **Single responsibility** - One concern per component

### Data Flow Pattern

1. **API Routes** fetch metadata from CMC/CoinGecko (72-hour cache)
2. **AI Enhancement** uses Gemini to collect real fee data in background
3. **Batch Processing** handles large datasets with pagination
4. **Custom Hooks** use SWR for client-side caching with batch loading
5. **Components** consume hooks with loading/error states and real-time updates

### File Naming Conventions
- **Components**: PascalCase (`ExchangeCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useExchangeFees.ts`)
- **Types**: camelCase (`exchange.ts`, `api.ts`)
- **Utils**: camelCase (`formatters.ts`)

## Required Patterns

### API Route Structure

```typescript
// Global cache with AI enhancement and batch support
declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var cexAIProcessing: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { batch = '1', batchSize = '10' } = req.query;
  
  // Check configurable cache (72 hours default)
  if (global.cexCompleteCache && isCacheValid(global.cexCompleteCache.timestamp, CEX_CACHE_DURATION)) {
    return res.status(200).json({ data: batchData, cached: true });
  }
  
  // Fetch metadata, start AI enhancement in background
  const rawData = await fetchCombinedExchangeData(50);
  const normalizedData = rawData.map(normalizeCombinedExchangeData);
  
  // Background AI processing for fee data
  if (process.env.GEMINI_API_KEY && !global.cexAIProcessing) {
    enhanceWithAI(normalizedData); // Non-blocking
  }
  
  return res.status(200).json({ data: batchData, backgroundProcessing: true });
}
```

### Component Structure
```typescript
// Always include loading and error states
export function ExchangeGrid({ exchanges, isLoading, error }: Props) {
  if (error) return <ErrorAlert message={error.message} />;
  if (isLoading) return <ExchangeSkeleton count={9} />;
  return <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}>{/* content */}</SimpleGrid>;
}
```

### Dark Mode Pattern
```typescript
// Always use useColorModeValue for colors
const bgColor = useColorModeValue('white', 'gray.800');
const borderColor = useColorModeValue('gray.200', 'gray.700');
```

## Static Export Requirements

### next.config.js (MANDATORY)
```javascript
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

### Environment Variables
```bash
# Required for CoinMarketCap API
COINMARKETCAP_API_KEY=your_key_here
```

## Performance Requirements

- **Bundle Size**: < 200KB initial load
- **Caching**: 24-hour API cache, SWR client cache
- **Loading States**: Skeleton components for all data-dependent UI
- **Responsive**: Mobile-first with Chakra UI breakpoints
- **Accessibility**: ARIA labels, keyboard navigation

## Critical Rules

### ✅ ALWAYS DO
- Define TypeScript interfaces before implementing
- Use CoinMarketCap API as primary data source
- Implement 24-hour caching in API routes
- Use `useColorModeValue` for all colors
- Include loading and error states in components
- Use named exports for components

### ❌ NEVER DO
- Use `any` types in TypeScript
- Skip error handling in API routes
- Hardcode colors (use theme values)
- Build UI without working API layer
- Commit API keys to Git
