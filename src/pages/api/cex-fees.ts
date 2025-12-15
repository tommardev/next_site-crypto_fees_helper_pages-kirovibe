import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCombinedExchangeData } from '@/lib/api/coinmarketcap';
import { normalizeCombinedExchangeData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CEX_CACHE_DURATION, CEX_CACHE_DURATION_SECONDS } from '@/config/constants';

// Get cache hours for logging
const CEX_CACHE_HOURS = parseInt(process.env.CEX_CACHE_HOURS || '72', 10);
import { fetchCEXFeesFromAI, mergeCEXFeeData } from '@/lib/api/gemini';

/**
 * CEX Fees API Route
 * 
 * DATA STRATEGY:
 * - CoinMarketCap: Exchange rankings, volumes, basic metadata (CMC fee data is unreliable)
 * - CoinGecko: Trust scores, additional metadata
 * - Gemini AI: Real fee data collection using AI-powered analysis
 * 
 * FLOW:
 * 1. Fetch exchange metadata from CMC/CoinGecko
 * 2. Use Gemini AI to collect real fee data for those exchanges
 * 3. Merge AI fee data with exchange metadata
 * 4. Cache for 24 hours to respect API limits
 */

// In-memory cache for complete AI-enhanced data (24-hour cache)
let completeCache: { data: any; timestamp: number } | null = null;

// Make cache available globally for batch API
if (typeof global !== 'undefined') {
  global.cexCompleteCache = completeCache;
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
    // Check cache for complete AI-enhanced data (configurable cache)
    if (completeCache && Date.now() - completeCache.timestamp < CEX_CACHE_DURATION) {
      console.log('✓ Serving CEX data from 24-hour cache');
      const startIndex = (batchNum - 1) * size;
      const endIndex = startIndex + size;
      const batchData = completeCache.data.slice(startIndex, endIndex);
      
      return res.status(200).json({
        data: batchData,
        cached: true,
        cachedAt: new Date(completeCache.timestamp).toISOString(),
        batch: batchNum,
        totalBatches: Math.ceil(completeCache.data.length / size),
        hasMore: endIndex < completeCache.data.length,
      });
    }

    // Cache expired or doesn't exist - rebuild complete dataset with AI
    console.log('⚡ Cache expired/missing - rebuilding complete CEX dataset with AI...');

    // Check if API key is configured
    if (!process.env.COINMARKETCAP_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'COINMARKETCAP_API_KEY environment variable is required for exchange rankings and metadata. Get your free API key at https://pro.coinmarketcap.com/signup',
      });
    }

    // Fetch combined data from CMC (volumes, rankings) + CoinGecko (trust scores)
    const rawData = await fetchCombinedExchangeData(100);
    
    // Normalize data with placeholder fee values
    const normalizedData = rawData.map(normalizeCombinedExchangeData);

    // For first batch request, return immediately with placeholder data
    // Then enhance with AI in background
    if (batchNum === 1) {
      // Return first batch immediately with placeholder data
      const startIndex = 0;
      const endIndex = size;
      const firstBatchData = normalizedData.slice(startIndex, endIndex);

      // Cache placeholder data temporarily
      completeCache = {
        data: normalizedData,
        timestamp: Date.now(),
      };
      
      // Update global cache for batch API access
      if (typeof global !== 'undefined') {
        global.cexCompleteCache = completeCache;
      }

      // Start AI enhancement in background (don't await)
      if (process.env.GEMINI_API_KEY && normalizedData.length > 0) {
        console.log(`🚀 Starting background AI enhancement for ${normalizedData.length} exchanges...`);
        
        // Background AI processing (async, no await)
        (async () => {
          try {
            let completeDataWithAI = [...normalizedData];
            const batchSize = 10;
            const totalBatches = Math.ceil(normalizedData.length / batchSize);
            
            for (let i = 0; i < totalBatches; i++) {
              const batchStart = i * batchSize;
              const batchEnd = batchStart + batchSize;
              const batchExchanges = normalizedData.slice(batchStart, batchEnd);
              
              console.log(`🤖 Background processing AI batch ${i + 1}/${totalBatches} (${batchExchanges.length} exchanges)...`);
              
              const aiFeesData = await fetchCEXFeesFromAI(batchExchanges);
              
              if (aiFeesData.length > 0) {
                const enhancedBatch = mergeCEXFeeData(batchExchanges, aiFeesData);
                completeDataWithAI.splice(batchStart, batchExchanges.length, ...enhancedBatch);
                console.log(`✓ Background enhanced batch ${i + 1}/${totalBatches} with AI fee data`);
              }
            }
            
            // Update cache with AI-enhanced data
            completeCache = {
              data: completeDataWithAI,
              timestamp: Date.now(),
            };
            
            if (typeof global !== 'undefined') {
              global.cexCompleteCache = completeCache;
            }
            
            console.log(`🎉 Background AI enhancement complete - cached for ${CEX_CACHE_HOURS} hours`);
          } catch (aiError) {
            console.error('Background AI enhancement failed:', aiError);
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
        totalExchanges: normalizedData.length,
        backgroundProcessing: !!process.env.GEMINI_API_KEY,
      });
    }

    // For non-first batch requests, return from current cache
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchData = normalizedData.slice(startIndex, endIndex);

    // Set cache headers for CDN/browser caching (configurable duration)
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${CEX_CACHE_DURATION_SECONDS * 2}`
    );

    const totalBatches = Math.ceil(normalizedData.length / size);
    const hasMore = endIndex < normalizedData.length;

    return res.status(200).json({
      data: batchData,
      cached: false,
      cachedAt: new Date().toISOString(),
      batch: batchNum,
      totalBatches,
      hasMore,
      totalExchanges: normalizedData.length,
    });
  } catch (error) {
    console.error('CEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
