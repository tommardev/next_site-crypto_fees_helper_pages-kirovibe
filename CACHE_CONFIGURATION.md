# Cache Configuration Guide

## Overview

The application uses configurable cache durations for CEX and DEX data to optimize performance and API costs while allowing flexibility for different deployment environments.

## Environment Variables

### CEX Cache Configuration
```bash
# CEX cache duration in hours (default: 24)
CEX_CACHE_HOURS=24
```

### DEX Cache Configuration  
```bash
# DEX cache duration in hours (default: 12)
DEX_CACHE_HOURS=12
```

## Default Values

- **CEX Cache**: 24 hours (recommended for production)
- **DEX Cache**: 12 hours (DEX data changes more frequently)

## Production Recommendations

### High-Traffic Production
```bash
# Longer cache for cost optimization
CEX_CACHE_HOURS=48
DEX_CACHE_HOURS=24
```

### Development/Testing
```bash
# Shorter cache for faster iteration
CEX_CACHE_HOURS=1
DEX_CACHE_HOURS=1
```

### Staging Environment
```bash
# Moderate cache for testing
CEX_CACHE_HOURS=6
DEX_CACHE_HOURS=3
```

## Cache Behavior

### Cache Hit (Data Served from Cache)
- **Response Time**: < 1 second
- **API Calls**: None
- **Cost**: Minimal server resources
- **Indicator**: `cached: true` in API response

### Cache Miss (Fresh Data with AI)
- **Response Time**: 2-3 minutes (complete dataset rebuild)
- **API Calls**: CoinMarketCap + CoinGecko + Gemini AI
- **Cost**: Higher due to AI processing
- **Indicator**: `cached: false` in API response

## Cache Lifecycle

1. **Initial Request**: Build complete dataset → Cache for configured duration
2. **Subsequent Requests**: Serve from cache instantly
3. **Cache Expiration**: Rebuild with fresh AI data
4. **New Cache Cycle**: Repeat with updated data

## Cost Optimization

### API Usage per Cache Cycle
- **CoinMarketCap**: 1 call per cache rebuild
- **CoinGecko**: 1-2 calls per cache rebuild  
- **Gemini AI**: 10-20 calls per cache rebuild (batched)

### Recommended Settings by Usage

**Low Traffic (< 1000 visits/day)**:
```bash
CEX_CACHE_HOURS=12
DEX_CACHE_HOURS=6
```

**Medium Traffic (1000-10000 visits/day)**:
```bash
CEX_CACHE_HOURS=24
DEX_CACHE_HOURS=12
```

**High Traffic (> 10000 visits/day)**:
```bash
CEX_CACHE_HOURS=48
DEX_CACHE_HOURS=24
```

## Monitoring Cache Performance

### Log Messages to Monitor
```
✓ Serving CEX data from 24-hour cache          # Cache hit
⚡ Cache expired/missing - rebuilding...        # Cache miss
🎉 Complete dataset ready - caching for X hours # Cache rebuilt
```

### Key Metrics
- **Cache Hit Rate**: Percentage of requests served from cache
- **Rebuild Frequency**: How often cache expires and rebuilds
- **API Cost**: Total API calls per day/month

## Environment-Specific Configuration

### Vercel Deployment
```bash
# Production
CEX_CACHE_HOURS=24
DEX_CACHE_HOURS=12

# Preview
CEX_CACHE_HOURS=6
DEX_CACHE_HOURS=3
```

### Netlify Deployment
```bash
# Production
CEX_CACHE_HOURS=24
DEX_CACHE_HOURS=12
```

### Docker/Self-Hosted
```bash
# Production
CEX_CACHE_HOURS=48
DEX_CACHE_HOURS=24
```

## Troubleshooting

### Cache Not Working
1. Check environment variables are set correctly
2. Verify no syntax errors in `.env` files
3. Restart application after changing cache settings

### Too Frequent Rebuilds
- Increase cache hours for your environment
- Monitor server logs for cache hit/miss patterns

### Stale Data Issues
- Decrease cache hours if data freshness is critical
- Consider different cache durations for CEX vs DEX

## Best Practices

1. **Set longer cache in production** to minimize AI API costs
2. **Use shorter cache in development** for faster iteration
3. **Monitor cache hit rates** to optimize settings
4. **Consider traffic patterns** when setting cache duration
5. **Test cache behavior** in staging before production deployment

## Cache Headers

The application automatically sets appropriate HTTP cache headers based on configuration:

```typescript
Cache-Control: public, s-maxage=${CACHE_DURATION_SECONDS}, stale-while-revalidate=${CACHE_DURATION_SECONDS * 2}
```

This ensures CDN and browser caching aligns with server-side cache duration.