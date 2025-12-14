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

// Shared cache with main API
let dexCache: any[] | null = null;
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
    // Get base DEX data (from cache or fresh fetch)
    let baseDEXes: any[];
    
    if (dexCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      baseDEXes = dexCache;
    } else {
      // Fetch fresh data if cache is stale
      const rawDEXData = await fetchCombinedDEXData();
      baseDEXes = rawDEXData.map(normalizeDEXData);
      
      // Update cache
      dexCache = baseDEXes;
      cacheTimestamp = Date.now();
    }

    // Calculate batch indices
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchDEXes = baseDEXes.slice(startIndex, endIndex);

    if (batchDEXes.length === 0) {
      return res.status(200).json({
        data: [],
        batch: batchNum,
        totalBatches: Math.ceil(baseDEXes.length / size),
        hasMore: false,
        message: 'No more DEXes to load',
      });
    }

    // Use Gemini AI to collect real fee data for this batch
    let finalBatchData = batchDEXes;
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`Fetching AI fee data for DEX batch ${batchNum} (${batchDEXes.length} DEXes)...`);
        const aiFeesData = await fetchDEXFeesFromAI(batchDEXes);
        
        if (aiFeesData.length > 0) {
          finalBatchData = mergeDEXFeeData(batchDEXes, aiFeesData);
          console.log(`Successfully merged AI fee data for ${aiFeesData.length} DEXes in batch ${batchNum}`);
        }
      } catch (aiError) {
        console.error(`AI fee collection failed for DEX batch ${batchNum}, using placeholder data:`, aiError);
        // Continue with placeholder data if AI fails
      }
    }

    // Set cache headers
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=7200'
    );

    const totalBatches = Math.ceil(baseDEXes.length / size);
    const hasMore = endIndex < baseDEXes.length;

    return res.status(200).json({
      data: finalBatchData,
      batch: batchNum,
      totalBatches,
      hasMore,
      totalDEXes: baseDEXes.length,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DEX Fees Batch API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}