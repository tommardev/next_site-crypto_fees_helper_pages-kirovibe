import { NextApiRequest, NextApiResponse } from 'next';
import { CEX_CACHE_DURATION, DEX_CACHE_DURATION } from '@/config/constants';
import { initializeGlobalCache, getCacheState } from '@/lib/utils/cache-optimizer';

/**
 * Cache Status API
 * 
 * Returns current cache status for debugging
 * Useful for diagnosing cache issues in production
 */

declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var dexCompleteCache: { data: any; timestamp: number } | null;
  var cexAIProcessing: boolean;
  var dexAIProcessing: boolean;
  var lastAIError: string | null;
  var lastDEXAIError: string | null;
  var geminiCircuitBreaker: { blocked: boolean; until: number } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize global cache safely
    initializeGlobalCache();
    
    const now = Date.now();
    
    // Get cache states safely
    const cexCacheState = getCacheState('cex');
    const dexCacheState = getCacheState('dex');
    
    const cexCacheStatus = cexCacheState ? {
      exists: true,
      dataLength: cexCacheState.data?.length || 0,
      cachedAt: new Date(cexCacheState.timestamp).toISOString(),
      cacheTimestamp: cexCacheState.timestamp, // Add raw timestamp for incremental detection
      ageMs: now - cexCacheState.timestamp,
      ageHours: Math.floor((now - cexCacheState.timestamp) / (1000 * 60 * 60)),
      isValid: (now - cexCacheState.timestamp) < CEX_CACHE_DURATION,
      expiresAt: new Date(cexCacheState.timestamp + CEX_CACHE_DURATION).toISOString(),
      aiProcessing: cexCacheState.isProcessing,
      lastError: cexCacheState.lastError,
    } : {
      exists: false,
      dataLength: 0,
      cachedAt: null,
      cacheTimestamp: 0, // Add raw timestamp for incremental detection
      ageMs: 0,
      ageHours: 0,
      isValid: false,
      expiresAt: null,
      aiProcessing: false,
      lastError: null,
    };

    const dexCacheStatus = dexCacheState ? {
      exists: true,
      dataLength: dexCacheState.data?.length || 0,
      cachedAt: new Date(dexCacheState.timestamp).toISOString(),
      cacheTimestamp: dexCacheState.timestamp, // Add raw timestamp for incremental detection
      ageMs: now - dexCacheState.timestamp,
      ageHours: Math.floor((now - dexCacheState.timestamp) / (1000 * 60 * 60)),
      isValid: (now - dexCacheState.timestamp) < DEX_CACHE_DURATION,
      expiresAt: new Date(dexCacheState.timestamp + DEX_CACHE_DURATION).toISOString(),
      aiProcessing: dexCacheState.isProcessing,
      lastError: dexCacheState.lastError,
    } : {
      exists: false,
      dataLength: 0,
      cachedAt: null,
      cacheTimestamp: 0, // Add raw timestamp for incremental detection
      ageMs: 0,
      ageHours: 0,
      isValid: false,
      expiresAt: null,
      aiProcessing: false,
      lastError: null,
    };

    // Circuit Breaker Status
    const circuitBreakerActive = global.geminiCircuitBreaker && 
      global.geminiCircuitBreaker.blocked && 
      now < global.geminiCircuitBreaker.until;

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      cex: cexCacheStatus,
      dex: dexCacheStatus,
      ai: {
        circuitBreakerActive,
        circuitBreakerUntil: global.geminiCircuitBreaker?.until 
          ? new Date(global.geminiCircuitBreaker.until).toISOString()
          : null,
        geminiConfigured: !!process.env.GEMINI_API_KEY,
      },
      cacheDurations: {
        cexMs: CEX_CACHE_DURATION,
        dexMs: DEX_CACHE_DURATION,
        cexHours: CEX_CACHE_DURATION / (1000 * 60 * 60),
        dexHours: DEX_CACHE_DURATION / (1000 * 60 * 60),
      },
    });
  } catch (error) {
    console.error('Cache status error:', error);
    return res.status(500).json({
      error: 'Failed to get cache status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}