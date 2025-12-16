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

// Use global cache for consistency across API routes
declare global {
  var dexCompleteCache: { data: any; timestamp: number } | null;
}

// Initialize global cache if not exists
if (typeof global !== 'undefined' && !global.dexCompleteCache) {
  global.dexCompleteCache = null;
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
    if (global.dexCompleteCache && Date.now() - global.dexCompleteCache.timestamp < DEX_CACHE_DURATION) {
      console.log(`✓ Serving DEX data from cache`);
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = global.dexCompleteCache.data.slice(startIndex, endIndex);
      
      return res.status(200).json({
        data: batchData,
        cached: true,
        cachedAt: new Date(global.dexCompleteCache.timestamp).toISOString(),
        batch: batchNum,
        totalBatches: Math.ceil(global.dexCompleteCache.data.length / size),
        hasMore: endIndex < global.dexCompleteCache.data.length,
      });
    }

    // Cache expired or doesn't exist - rebuild complete DEX dataset with AI
    console.log('⚡ Cache expired/missing - rebuilding complete DEX dataset with AI...');

    // Fetch real DEX data from APIs
    const rawDEXData = await fetchCombinedDEXData();
    
    // Normalize DEX data (will be empty array if APIs fail)
    const normalizedData = rawDEXData.map(normalizeDEXData);

    // For first batch request, return immediately with placeholder data
    // Then enhance with AI in background
    if (batchNum === 1) {
      // Return first batch immediately with placeholder data
      const startIndex = 0;
      const endIndex = size;
      const firstBatchData = normalizedData.slice(startIndex, endIndex);

      // Cache placeholder data temporarily
      global.dexCompleteCache = {
        data: normalizedData,
        timestamp: Date.now(),
      };

      // Start AI enhancement in background (don't await)
      if (process.env.GEMINI_API_KEY && normalizedData.length > 0) {
        console.log(`🚀 Starting background DEX AI enhancement for ${normalizedData.length} DEXes...`);
        
        // Background AI processing (async, no await)
        (async () => {
          try {
            let completeDataWithAI = [...normalizedData];
            const batchSize = 10;
            const totalBatches = Math.ceil(normalizedData.length / batchSize);
            
            for (let i = 0; i < totalBatches; i++) {
              const batchStart = i * batchSize;
              const batchEnd = batchStart + batchSize;
              const batchDEXes = normalizedData.slice(batchStart, batchEnd);
              
              console.log(`🤖 Background processing DEX AI batch ${i + 1}/${totalBatches} (${batchDEXes.length} DEXes)...`);
              
              const aiFeesData = await fetchDEXFeesFromAI(batchDEXes);
              
              if (aiFeesData.length > 0) {
                const enhancedBatch = mergeDEXFeeData(batchDEXes, aiFeesData);
                completeDataWithAI.splice(batchStart, batchDEXes.length, ...enhancedBatch);
                console.log(`✓ Background enhanced DEX batch ${i + 1}/${totalBatches} with AI fee data`);
              }
            }
            
            // Update cache with AI-enhanced data
            global.dexCompleteCache = {
              data: completeDataWithAI,
              timestamp: Date.now(),
            };
            
            console.log(`🎉 Background DEX AI enhancement complete - cached for ${DEX_CACHE_HOURS} hours`);
          } catch (aiError) {
            console.error('Background DEX AI enhancement failed:', aiError);
          }
        })();
      }

      const totalBatches = Math.ceil(normalizedData.length / size);
      const hasMore = endIndex < normalizedData.length;

      return res.status(200).json({
        data: firstBatchData,
        cached: false,
        cachedAt: new Date().toISOString(),
        batch: batchNum,
        totalBatches,
        hasMore,
        totalDEXes: normalizedData.length,
        backgroundProcessing: !!process.env.GEMINI_API_KEY,
      });
    }

    // For non-first batch requests, return from current cache
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchData = normalizedData.slice(startIndex, endIndex);

    // Set cache headers - prevent CDN caching for dynamic content
    res.setHeader(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const totalBatches = Math.ceil(normalizedData.length / size);
    const hasMore = endIndex < normalizedData.length;

    return res.status(200).json({
      data: batchData,
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
