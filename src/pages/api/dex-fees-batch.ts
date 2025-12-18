import { NextApiRequest, NextApiResponse } from 'next';
import { handleAPIError } from '@/lib/api/error-handler';
import { DEX_CACHE_DURATION, DEX_CACHE_DURATION_SECONDS } from '@/config/constants';
import { initializeGlobalCache, getCacheState, isCacheValid } from '@/lib/utils/cache-optimizer';

/**
 * DEX Fees Batch API Route
 * 
 * DEPRECATED: This endpoint is no longer needed with the new unified batch system.
 * All batches are now handled through the main /api/dex-fees endpoint.
 * This endpoint remains for backward compatibility.
 */

// Shared cache with main DEX API
declare global {
  var dexCompleteCache: { data: any; timestamp: number } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize global cache safely
  initializeGlobalCache();

  const { batch = '2', batchSize = '20' } = req.query;
  const batchNum = parseInt(batch as string, 10);
  const size = parseInt(batchSize as string, 10);

  try {
    // Get cache state safely
    const cacheState = getCacheState('dex');
    
    // Check if complete DEX cache exists and is valid
    if (cacheState && isCacheValid(cacheState.timestamp, DEX_CACHE_DURATION)) {
      console.log(`✓ Serving DEX batch ${batchNum} from cache (${cacheState.data.length} total DEXes)`);
      
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = cacheState.data.slice(startIndex, endIndex);
      
      console.log(`📊 DEX Batch ${batchNum}: indices ${startIndex}-${endIndex}, returning ${batchData.length} DEXes`);

      if (batchData.length === 0) {
        return res.status(200).json({
          data: [],
          batch: batchNum,
          totalBatches: Math.ceil(cacheState.data.length / size),
          hasMore: false,
          message: 'No more DEXes to load',
        });
      }

      // Set cache headers optimized for Netlify CDN
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${DEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${DEX_CACHE_DURATION_SECONDS * 2}`
      );
      res.setHeader('Netlify-CDN-Cache-Control', `public, max-age=${DEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${DEX_CACHE_DURATION_SECONDS * 2}`);

      const totalBatches = Math.ceil(cacheState.data.length / size);
      const hasMore = endIndex < cacheState.data.length;

      return res.status(200).json({
        data: batchData,
        batch: batchNum,
        totalBatches,
        hasMore,
        totalDEXes: cacheState.data.length,
        cached: true,
        cachedAt: new Date(cacheState.timestamp).toISOString(),
        backgroundProcessing: cacheState.isProcessing,
      });
    }

    // Cache doesn't exist or expired - redirect to main API to rebuild
    return res.status(200).json({
      data: [],
      batch: batchNum,
      totalBatches: 0,
      hasMore: false,
      message: 'Cache expired - please refresh the main page to rebuild cache',
      cacheExpired: true,
    });
  } catch (error) {
    console.error('DEX Fees Batch API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}