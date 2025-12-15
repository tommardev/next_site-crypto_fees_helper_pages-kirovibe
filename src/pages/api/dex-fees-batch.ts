import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeDEXData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { fetchCombinedDEXData } from '@/lib/api/coinmarketcap';
import { fetchDEXFeesFromAI, mergeDEXFeeData } from '@/lib/api/gemini';

/**
 * DEX Fees Batch API Route
 * 
 * Loads additional batches of DEXes with AI fee data
 * Used for progressive loading after initial batch
 */

import { DEX_CACHE_DURATION, DEX_CACHE_DURATION_SECONDS } from '@/config/constants';

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

  const { batch = '2', batchSize = '10' } = req.query;
  const batchNum = parseInt(batch as string, 10);
  const size = parseInt(batchSize as string, 10);

  try {
    // Check if complete DEX cache exists and is valid
    if (global.dexCompleteCache && Date.now() - global.dexCompleteCache.timestamp < DEX_CACHE_DURATION) {
      console.log(`✓ Serving DEX batch ${batchNum} from ${parseInt(process.env.DEX_CACHE_HOURS || '72', 10)}-hour cache`);
      
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = global.dexCompleteCache.data.slice(startIndex, endIndex);

      if (batchData.length === 0) {
        return res.status(200).json({
          data: [],
          batch: batchNum,
          totalBatches: Math.ceil(global.dexCompleteCache.data.length / size),
          hasMore: false,
          message: 'No more DEXes to load',
        });
      }

      // Set cache headers (configurable duration)
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${DEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${DEX_CACHE_DURATION_SECONDS * 2}`
      );

      const totalBatches = Math.ceil(global.dexCompleteCache.data.length / size);
      const hasMore = endIndex < global.dexCompleteCache.data.length;

      return res.status(200).json({
        data: batchData,
        batch: batchNum,
        totalBatches,
        hasMore,
        totalDEXes: global.dexCompleteCache.data.length,
        cached: true,
        cachedAt: new Date(global.dexCompleteCache.timestamp).toISOString(),
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