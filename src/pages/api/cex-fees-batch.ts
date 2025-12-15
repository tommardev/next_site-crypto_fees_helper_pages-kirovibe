import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCombinedExchangeData } from '@/lib/api/coinmarketcap';
import { normalizeCombinedExchangeData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { fetchCEXFeesFromAI, mergeCEXFeeData } from '@/lib/api/gemini';

/**
 * CEX Fees Batch API Route
 * 
 * Loads additional batches of exchanges with AI fee data
 * Used for progressive loading after initial batch
 */

import { CEX_CACHE_DURATION, CEX_CACHE_DURATION_SECONDS } from '@/config/constants';

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

  const { batch = '2', batchSize = '10' } = req.query;
  const batchNum = parseInt(batch as string, 10);
  const size = parseInt(batchSize as string, 10);

  try {
    // Check if complete cache exists and is valid
    if (global.cexCompleteCache && Date.now() - global.cexCompleteCache.timestamp < CEX_CACHE_DURATION) {
      console.log(`✓ Serving CEX batch ${batchNum} from ${parseInt(process.env.CEX_CACHE_HOURS || '72', 10)}-hour cache`);
      
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = global.cexCompleteCache.data.slice(startIndex, endIndex);

      if (batchData.length === 0) {
        return res.status(200).json({
          data: [],
          batch: batchNum,
          totalBatches: Math.ceil(global.cexCompleteCache.data.length / size),
          hasMore: false,
          message: 'No more exchanges to load',
        });
      }

      // Set cache headers (configurable duration)
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${CEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${CEX_CACHE_DURATION_SECONDS * 2}`
      );

      const totalBatches = Math.ceil(global.cexCompleteCache.data.length / size);
      const hasMore = endIndex < global.cexCompleteCache.data.length;

      return res.status(200).json({
        data: batchData,
        batch: batchNum,
        totalBatches,
        hasMore,
        totalExchanges: global.cexCompleteCache.data.length,
        cached: true,
        cachedAt: new Date(global.cexCompleteCache.timestamp).toISOString(),
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