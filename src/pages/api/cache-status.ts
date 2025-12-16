import { NextApiRequest, NextApiResponse } from 'next';
import { CEX_CACHE_DURATION, DEX_CACHE_DURATION } from '@/config/constants';

/**
 * Cache Status API
 * 
 * Returns current cache status for debugging
 * Useful for diagnosing cache issues in production
 */

declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var dexCompleteCache: { data: any; timestamp: number } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    
    const cexCacheStatus = global.cexCompleteCache ? {
      exists: true,
      dataLength: global.cexCompleteCache.data?.length || 0,
      cachedAt: new Date(global.cexCompleteCache.timestamp).toISOString(),
      ageMs: now - global.cexCompleteCache.timestamp,
      isValid: (now - global.cexCompleteCache.timestamp) < CEX_CACHE_DURATION,
      expiresAt: new Date(global.cexCompleteCache.timestamp + CEX_CACHE_DURATION).toISOString(),
    } : {
      exists: false,
      dataLength: 0,
      cachedAt: null,
      ageMs: 0,
      isValid: false,
      expiresAt: null,
    };

    const dexCacheStatus = global.dexCompleteCache ? {
      exists: true,
      dataLength: global.dexCompleteCache.data?.length || 0,
      cachedAt: new Date(global.dexCompleteCache.timestamp).toISOString(),
      ageMs: now - global.dexCompleteCache.timestamp,
      isValid: (now - global.dexCompleteCache.timestamp) < DEX_CACHE_DURATION,
      expiresAt: new Date(global.dexCompleteCache.timestamp + DEX_CACHE_DURATION).toISOString(),
    } : {
      exists: false,
      dataLength: 0,
      cachedAt: null,
      ageMs: 0,
      isValid: false,
      expiresAt: null,
    };

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      cex: cexCacheStatus,
      dex: dexCacheStatus,
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