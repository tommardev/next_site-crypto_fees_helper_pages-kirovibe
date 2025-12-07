---
inclusion: always
---

# Crypto Exchange Fees Comparison - Project Architecture

## Project Overview
This is a Next.js + TypeScript + Chakra UI application for comparing cryptocurrency exchange fees (CEX and DEX). The site is optimized for static hosting on Vercel/Netlify.

## Technology Stack

### Core Framework
- **Next.js 14+** (latest stable) - React framework with App Router
- **TypeScript 5+** - Type safety
- **React 18+** - UI library

### UI/UX Framework
- **Chakra UI v2+** - Component library with built-in dark mode
- **Framer Motion** - Animations and transitions
- **React Icons** - Icon library for exchange logos

### Data Management
- **SWR** or **TanStack Query (React Query)** - Data fetching, caching, and revalidation
- **Zustand** or **Jotai** - Lightweight state management (if needed)

### API & Data Sources
- **CoinGecko API** (free tier) - Exchange data and fees
- **CryptoCompare API** (free tier) - Additional exchange information
- **Binance Public API** - Real-time Binance fees
- **Uniswap Subgraph** - DEX data
- **1inch API** - DEX aggregator data

## Project Structure

```
src/
├── app/                    # Next.js App Router (if upgrading)
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── pages/                  # Next.js Pages Router (current)
│   ├── index.tsx          # CEX fees main page
│   ├── dex.tsx            # DEX fees page
│   ├── about.tsx          # About page
│   ├── contact.tsx        # Contact page
│   ├── api/               # API routes for data fetching
│   │   ├── cex-fees.ts
│   │   └── dex-fees.ts
│   ├── _app.tsx
│   └── _document.tsx
├── components/
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── exchange/          # Exchange-specific components
│   │   ├── ExchangeCard.tsx
│   │   ├── ExchangeGrid.tsx
│   │   ├── ExchangeFilters.tsx
│   │   └── ExchangeSkeleton.tsx
│   ├── common/            # Reusable components
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── SearchBar.tsx
│   └── ui/                # UI primitives
├── lib/
│   ├── api/               # API client functions
│   │   ├── cex-api.ts
│   │   ├── dex-api.ts
│   │   └── cache.ts
│   ├── hooks/             # Custom React hooks
│   │   ├── useExchangeFees.ts
│   │   └── useFilters.ts
│   ├── utils/             # Utility functions
│   │   ├── formatters.ts
│   │   └── sorting.ts
│   └── types/             # TypeScript types
│       ├── exchange.ts
│       └── api.ts
├── config/
│   ├── exchanges.ts       # Exchange configurations
│   └── constants.ts       # App constants
├── styles/
│   └── theme.ts           # Chakra UI theme
└── public/
    └── logos/             # Exchange logos
```

## Component Architecture Principles

### 1. Component Composition
- Break down UI into small, reusable components
- Use composition over inheritance
- Keep components focused on single responsibility

### 2. Server vs Client Components
- Use Server Components by default (Next.js 13+ App Router)
- Mark interactive components with 'use client'
- Minimize client-side JavaScript

### 3. Data Fetching Strategy
- Fetch data in API routes or server components
- Use SWR/React Query for client-side caching
- Implement stale-while-revalidate pattern

### 4. Type Safety
- Define strict TypeScript interfaces for all data
- Use discriminated unions for different exchange types
- Avoid `any` types

## Caching Strategy

### Global Cache (24-hour persistence)
```typescript
// Implement in API routes with Next.js cache
export const revalidate = 86400; // 24 hours

// Or use external cache (Redis, Vercel KV)
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
```

### Cache Layers
1. **CDN Cache** - Static pages cached at edge
2. **API Route Cache** - Next.js built-in caching
3. **Client Cache** - SWR/React Query for user session
4. **Persistent Cache** - Vercel KV or similar for API responses

### Cache Invalidation
- Automatic revalidation after 24 hours
- Manual revalidation endpoint for admin
- Stale-while-revalidate for better UX

## Modern UI/UX Requirements

### Design Principles
- **Mobile-first** responsive design
- **Dark mode** support (Chakra UI built-in)
- **Skeleton loading** for all data-dependent components
- **Smooth animations** with Framer Motion
- **Accessible** (WCAG 2.1 AA compliance)

### Card Grid Design
```typescript
// Exchange card should display:
- Exchange logo (small, optimized)
- Exchange name
- Trading fee (maker/taker)
- Withdrawal fee (average)
- Rating/popularity indicator
- Quick action button
```

### Filtering & Sorting
- Filter by: Exchange type, fee range, supported coins
- Sort by: Fees (low to high), Name (A-Z), Popularity
- Search by exchange name
- Persist filters in URL query params

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 200KB (initial)

## Static Export Configuration

```typescript
// next.config.js
module.exports = {
  output: 'export', // For static hosting
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
};
```

## Environment Variables
```
# .env.local
NEXT_PUBLIC_COINGECKO_API_KEY=
NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY=
CACHE_REDIS_URL= # Optional for persistent cache
```

## Development Guidelines

### Code Style
- Use functional components with hooks
- Prefer named exports for components
- Use absolute imports with `@/` prefix
- Follow Chakra UI naming conventions

### Testing (if implemented)
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows

### Performance Optimization
- Use `next/image` for logos (with fallback for static export)
- Implement code splitting with dynamic imports
- Lazy load below-the-fold content
- Minimize bundle size with tree shaking

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Netlify
```bash
npm run build
# Deploy 'out' directory
```

### Build Command
```bash
npm run build
```

### Output Directory
```
out/
```
