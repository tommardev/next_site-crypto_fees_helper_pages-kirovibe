import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeDEXData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CACHE_DURATION } from '@/config/constants';
import { fetchCombinedDEXData } from '@/lib/api/coinmarketcap';
import { fetchDEXFeesFromAI, mergeDEXFeeData } from '@/lib/api/gemini';

/**
 * DEX Fees API Route
 * 
 * DATA STRATEGY:
 * - CoinGecko: DEX listings, volumes, basic metadata
 * - Gemini AI: Real swap fees and gas estimates using AI-powered analysis
 * - Real API data only - no hardcoded lists
 * - Graceful degradation if APIs fail (empty array)
 * 
 * FLOW:
 * 1. Fetch DEX metadata from CoinGecko/DeFiLlama
 * 2. Use Gemini AI to collect real fee data for those DEXes
 * 3. Merge AI fee data with DEX metadata
 * 4. Cache for 24 hours to respect API limits
 */

// In-memory cache
let cache: { data: any; timestamp: number } | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { batch = '1', batchSize = '10' } = req.query;
  const batchNum = parseInt(batch as string, 10);
  const size = parseInt(batchSize as string, 10);

  try {
    // Check cache for complete data
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = cache.data.slice(startIndex, endIndex);
      
      return res.status(200).json({
        data: batchData,
        cached: true,
        cachedAt: new Date(cache.timestamp).toISOString(),
        batch: batchNum,
        totalBatches: Math.ceil(cache.data.length / size),
        hasMore: endIndex < cache.data.length,
      });
    }

    // Fetch real DEX data from APIs
    const rawDEXData = await fetchCombinedDEXData();
    
    // Normalize DEX data (will be empty array if APIs fail)
    const normalizedData = rawDEXData.map(normalizeDEXData);

    // Calculate batch indices
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchDEXes = normalizedData.slice(startIndex, endIndex);

    // Use Gemini AI to collect real fee data for this batch only
    let finalBatchData = batchDEXes;
    if (process.env.GEMINI_API_KEY && batchDEXes.length > 0) {
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
    } else if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, using placeholder fee data');
    }

    // Update cache with complete data if this is batch 1
    if (batchNum === 1) {
      cache = {
        data: normalizedData, // Store complete normalized data for future batches
        timestamp: Date.now(),
      };
    }

    // Set cache headers for CDN/browser caching
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=7200' // Shorter cache for batches
    );

    const totalBatches = Math.ceil(normalizedData.length / size);
    const hasMore = endIndex < normalizedData.length;

    return res.status(200).json({
      data: finalBatchData,
      cached: false,
      cachedAt: new Date().toISOString(),
      batch: batchNum,
      totalBatches,
      hasMore,
      totalDEXes: normalizedData.length,
    });
  } catch (error) {
    console.error('DEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
