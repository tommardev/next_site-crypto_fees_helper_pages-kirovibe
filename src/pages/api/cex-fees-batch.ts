import { NextApiRequest, NextApiResponse } from 'next';
import { handleAPIError } from '@/lib/api/error-handler';
import { CEX_CACHE_DURATION, CEX_CACHE_DURATION_SECONDS } from '@/config/constants';
import { initializeGlobalCache, getCacheState, isCacheValid } from '@/lib/utils/cache-optimizer';

/**
 * CEX Fees Batch API Route
 * 
 * DEPRECATED: This endpoint is no longer needed with the new unified batch system.
 * All batches are now handled through the main /api/cex-fees endpoint.
 * This endpoint remains for backward compatibility.
 */

// Shared cache with main API
declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
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
    const cacheState = getCacheState('cex');
    
    // Check if complete cache exists and is valid
    if (cacheState && isCacheValid(cacheState.timestamp, CEX_CACHE_DURATION)) {
      console.log(`✓ Serving CEX batch ${batchNum} from cache (${cacheState.data.length} total exchanges)`);
      
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = cacheState.data.slice(startIndex, endIndex);
      
      console.log(`📊 Batch ${batchNum}: indices ${startIndex}-${endIndex}, returning ${batchData.length} exchanges`);

      if (batchData.length === 0) {
        return res.status(200).json({
          data: [],
          batch: batchNum,
          totalBatches: Math.ceil(cacheState.data.length / size),
          hasMore: false,
          message: 'No more exchanges to load',
        });
      }

      // Set cache headers optimized for Netlify CDN
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${CEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${CEX_CACHE_DURATION_SECONDS * 2}`
      );
      res.setHeader('Netlify-CDN-Cache-Control', `public, max-age=${CEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${CEX_CACHE_DURATION_SECONDS * 2}`);

      const totalBatches = Math.ceil(cacheState.data.length / size);
      const hasMore = endIndex < cacheState.data.length;

      return res.status(200).json({
        data: batchData,
        batch: batchNum,
        totalBatches,
        hasMore,
        totalExchanges: cacheState.data.length,
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
    console.error('CEX Fees Batch API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}