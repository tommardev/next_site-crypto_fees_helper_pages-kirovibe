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

    // Fetch AI fee data for ALL exchanges at once (for complete cache)
    let completeDataWithAI = normalizedData;
    if (process.env.GEMINI_API_KEY && normalizedData.length > 0) {
      try {
        console.log(`🤖 Fetching AI fee data for ALL ${normalizedData.length} exchanges (cache rebuild)...`);
        
        // Process in batches of 10 to avoid API timeouts, but cache the complete result
        const batchSize = 10;
        const totalBatches = Math.ceil(normalizedData.length / batchSize);
        
        for (let i = 0; i < totalBatches; i++) {
          const batchStart = i * batchSize;
          const batchEnd = batchStart + batchSize;
          const batchExchanges = normalizedData.slice(batchStart, batchEnd);
          
          console.log(`🤖 Processing AI batch ${i + 1}/${totalBatches} (${batchExchanges.length} exchanges)...`);
          
          const aiFeesData = await fetchCEXFeesFromAI(batchExchanges);
          
          if (aiFeesData.length > 0) {
            const enhancedBatch = mergeCEXFeeData(batchExchanges, aiFeesData);
            // Replace the batch in the complete array
            completeDataWithAI.splice(batchStart, batchExchanges.length, ...enhancedBatch);
            console.log(`✓ Enhanced batch ${i + 1}/${totalBatches} with AI fee data`);
          }
        }
        
        console.log(`🎉 Complete CEX dataset with AI fees ready - caching for ${CEX_CACHE_HOURS} hours`);
      } catch (aiError) {
        console.error('AI fee collection failed during cache rebuild, using placeholder data:', aiError);
        // Continue with placeholder data if AI fails
      }
    } else if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, caching placeholder fee data');
    }

    // Cache the complete AI-enhanced dataset for 24 hours
    completeCache = {
      data: completeDataWithAI,
      timestamp: Date.now(),
    };
    
    // Update global cache for batch API access
    if (typeof global !== 'undefined') {
      global.cexCompleteCache = completeCache;
    }

    // Return the requested batch from the complete dataset
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchData = completeDataWithAI.slice(startIndex, endIndex);

    // Set cache headers for CDN/browser caching (configurable duration)
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CEX_CACHE_DURATION_SECONDS}, stale-while-revalidate=${CEX_CACHE_DURATION_SECONDS * 2}`
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
      totalExchanges: completeDataWithAI.length,
    });
  } catch (error) {
    console.error('CEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
