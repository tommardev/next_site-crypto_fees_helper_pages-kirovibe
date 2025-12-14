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

// Shared cache with main API
let exchangeCache: any[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { batch = '2', batchSize = '8' } = req.query;
  const batchNum = parseInt(batch as string, 10);
  const size = parseInt(batchSize as string, 10);

  try {
    // Get base exchange data (from cache or fresh fetch)
    let baseExchanges: any[];
    
    if (exchangeCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      baseExchanges = exchangeCache;
    } else {
      // Fetch fresh data if cache is stale
      const rawData = await fetchCombinedExchangeData(100);
      baseExchanges = rawData.map(normalizeCombinedExchangeData);
      
      // Update cache
      exchangeCache = baseExchanges;
      cacheTimestamp = Date.now();
    }

    // Calculate batch indices
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchExchanges = baseExchanges.slice(startIndex, endIndex);

    if (batchExchanges.length === 0) {
      return res.status(200).json({
        data: [],
        batch: batchNum,
        totalBatches: Math.ceil(baseExchanges.length / size),
        hasMore: false,
        message: 'No more exchanges to load',
      });
    }

    // Use Gemini AI to collect real fee data for this batch
    let finalBatchData = batchExchanges;
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`Fetching AI fee data for batch ${batchNum} (${batchExchanges.length} exchanges)...`);
        const aiFeesData = await fetchCEXFeesFromAI(batchExchanges);
        
        if (aiFeesData.length > 0) {
          finalBatchData = mergeCEXFeeData(batchExchanges, aiFeesData);
          console.log(`Successfully merged AI fee data for ${aiFeesData.length} exchanges in batch ${batchNum}`);
        }
      } catch (aiError) {
        console.error(`AI fee collection failed for batch ${batchNum}, using placeholder data:`, aiError);
        // Continue with placeholder data if AI fails
      }
    }

    // Set cache headers
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=7200'
    );

    const totalBatches = Math.ceil(baseExchanges.length / size);
    const hasMore = endIndex < baseExchanges.length;

    return res.status(200).json({
      data: finalBatchData,
      batch: batchNum,
      totalBatches,
      hasMore,
      totalExchanges: baseExchanges.length,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('CEX Fees Batch API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}