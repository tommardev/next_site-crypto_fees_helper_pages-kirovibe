---
inclusion: always
---

# Crypto Exchange Fees Comparison - Project Architecture

## Core Technology Stack

**Next.js 14+ (Pages Router) + TypeScript + Chakra UI + SWR**

- **Primary Data Source**: CoinMarketCap API (real fee data)
- **UI Framework**: Chakra UI v2+ with built-in dark mode
- **Data Fetching**: SWR with 24-hour caching
- **Deployment**: Static export for Vercel/Netlify

## Project Structure (MANDATORY)

```text
src/
├── pages/
│   ├── index.tsx          # CEX fees main page
│   ├── dex.tsx            # DEX fees page
│   ├── api/
│   │   ├── cex-fees.ts    # Primary API route
│   │   └── dex-fees.ts    # DEX API route
├── components/
│   ├── exchange/          # Exchange-specific components
│   ├── layout/            # Header, Footer, Layout
│   └── common/            # ErrorBoundary, ErrorAlert
├── lib/
│   ├── api/               # coinmarketcap.ts, error-handler.ts
│   ├── hooks/             # useExchangeFees.ts, useFilters.ts
│   ├── types/             # exchange.ts, api.ts
│   └── utils/             # formatters.ts, normalize.ts
├── config/
│   ├── constants.ts       # App constants
│   └── exchanges.ts       # Exchange configurations
```

## Architecture Principles

### Component Rules
- **Always use TypeScript interfaces** - Never use `any` types
- **Chakra UI components only** - Use `useColorModeValue` for dark mode
- **Named exports preferred** - `export function ComponentName`
- **Single responsibility** - One concern per component

### Data Flow Pattern
1. **API Routes** (`pages/api/`) fetch and cache data (24-hour TTL)
2. **Custom Hooks** (`lib/hooks/`) use SWR for client-side caching
3. **Components** consume hooks, handle loading/error states
4. **Types** (`lib/types/`) define all interfaces first

### File Naming Conventions
- **Components**: PascalCase (`ExchangeCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useExchangeFees.ts`)
- **Types**: camelCase (`exchange.ts`, `api.ts`)
- **Utils**: camelCase (`formatters.ts`)

## Required Patterns

### API Route Structure
```typescript
// 24-hour cache with error handling
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json({ data: cache.data, cached: true });
  }
  // Fetch, cache, return with proper error handling
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
