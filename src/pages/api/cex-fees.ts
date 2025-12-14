import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCombinedExchangeData } from '@/lib/api/coinmarketcap';
import { normalizeCombinedExchangeData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CACHE_DURATION } from '@/config/constants';
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

// In-memory cache for development
let cache: { data: any; timestamp: number } | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { batch = '1', batchSize = '8' } = req.query;
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

    // Calculate batch indices
    const startIndex = (batchNum - 1) * size;
    const endIndex = startIndex + size;
    const batchExchanges = normalizedData.slice(startIndex, endIndex);

    // Use Gemini AI to collect real fee data for this batch only
    let finalBatchData = batchExchanges;
    if (process.env.GEMINI_API_KEY && batchExchanges.length > 0) {
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
      totalExchanges: normalizedData.length,
    });
  } catch (error) {
    console.error('CEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
