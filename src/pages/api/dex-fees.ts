import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeDEXData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { DEX_CACHE_DURATION, DEX_CACHE_DURATION_SECONDS } from '@/config/constants';

// Get cache hours for logging
const DEX_CACHE_HOURS = parseInt(process.env.DEX_CACHE_HOURS || '72', 10);
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

// In-memory cache for complete AI-enhanced DEX data (24-hour cache)
let completeDEXCache: { data: any; timestamp: number } | null = null;

// Make cache available globally for batch API
if (typeof global !== 'undefined') {
  global.dexCompleteCache = completeDEXCache;
}

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
    // Check cache for complete AI-enhanced DEX data (configurable cache)
    if (completeDEXCache && Date.now() - completeDEXCache.timestamp < DEX_CACHE_DURATION) {
      console.log(`✓ Serving DEX data from ${DEX_CACHE_HOURS}-hour cache`);
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = completeDEXCache.data.slice(startIndex, endIndex);
      
      return res.status(200).json({
        data: batchData,
        cached: true,
        cachedAt: new Date(completeDEXCache.timestamp).toISOString(),
        batch: batchNum,
        totalBatches: Math.ceil(completeDEXCache.data.length / size),
        hasMore: endIndex < completeDEXCache.data.length,
      });
    }

    // Cache expired or doesn't exist - rebuild complete DEX dataset with AI
    console.log('⚡ Cache expired/missing - rebuilding complete DEX dataset with AI...');

    // Fetch real DEX data from APIs
    const rawDEXData = await fetchCombinedDEXData();
    
    // Normalize DEX data (will be empty array if APIs fail)
    const normalizedData = rawDEXData.map(normalizeDEXData);

    // Fetch AI fee data for ALL DEXes at once (for complete cache)
    let completeDataWithAI = normalizedData;
    if (process.env.GEMINI_API_KEY && normalizedData.length > 0) {
      try {
        console.log(`🤖 Fetching AI fee data for ALL ${normalizedData.length} DEXes (cache rebuild)...`);
        
        // Process in batches of 10 to avoid API timeouts, but cache the complete result
        const batchSize = 10;
        const totalBatches = Math.ceil(normalizedData.length / batchSize);
        
        for (let i = 0; i < totalBatches; i++) {
          const batchStart = i * batchSize;
          const batchEnd = batchStart + batchSize;
          const batchDEXes = normalizedData.slice(batchStart, batchEnd);
          
          console.log(`🤖 Processing DEX AI batch ${i + 1}/${totalBatches} (${batchDEXes.length} DEXes)...`);
          
          const aiFeesData = await fetchDEXFeesFromAI(batchDEXes);
          
          if (aiFeesData.length > 0) {
            const enhancedBatch = mergeDEXFeeData(batchDEXes, aiFeesData);
            // Replace the batch in the complete array
            completeDataWithAI.splice(batchStart, batchDEXes.length, ...enhancedBatch);
            console.log(`✓ Enhanced DEX batch ${i + 1}/${totalBatches} with AI fee data`);
          }
        }
        
        console.log(`🎉 Complete DEX dataset with AI fees ready - caching for ${DEX_CACHE_HOURS} hours`);
      } catch (aiError) {
        console.error('AI fee collection failed during DEX cache rebuild, using placeholder data:', aiError);
        // Continue with placeholder data if AI fails
      }
    } else if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, caching placeholder DEX fee data');
    }

    // Cache the complete AI-enhanced DEX dataset for 24 hours
    completeDEXCache = {
      data: completeDataWithAI,
      timestamp: Date.now(),
    };
    
    // Update global cache for batch API access
    if (typeof global !== 'undefined') {
      global.dexCompleteCache = completeDEXCache;
    }

    // Return the requested batch from the complete dataset
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchData = completeDataWithAI.slice(startIndex, endIndex);

    // Set cache headers for CDN/browser caching (configurable duration)
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${DEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${DEX_CACHE_DURATION_SECONDS * 2}`
    );

    const totalBatches = Math.ceil(completeDataWithAI.length / size);
    const hasMore = endIndex < completeDataWithAI.length;

    return res.status(200).json({
      data: batchData,
      cached: false,
      cachedAt: new Date().toISOString(),
      batch: batchNum,
      totalBatches,
      hasMore,
      totalDEXes: completeDataWithAI.length,
    });
  } catch (error) {
    console.error('DEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
