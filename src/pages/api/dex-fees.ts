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

  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return res.status(200).json({
        data: cache.data,
        cached: true,
        cachedAt: new Date(cache.timestamp).toISOString(),
      });
    }

    // Fetch real DEX data from APIs
    const rawDEXData = await fetchCombinedDEXData();
    
    // Normalize DEX data (will be empty array if APIs fail)
    const normalizedData = rawDEXData.map(normalizeDEXData);

    // Use Gemini AI to collect real fee data for these DEXes
    let finalData = normalizedData;
    if (process.env.GEMINI_API_KEY && normalizedData.length > 0) {
      try {
        console.log(`Fetching AI fee data for ${normalizedData.length} DEXes...`);
        const aiFeesData = await fetchDEXFeesFromAI(normalizedData);
        
        if (aiFeesData.length > 0) {
          finalData = mergeDEXFeeData(normalizedData, aiFeesData);
          console.log(`Successfully merged AI fee data for ${aiFeesData.length} DEXes`);
        }
      } catch (aiError) {
        console.error('AI fee collection failed, using placeholder data:', aiError);
        // Continue with placeholder data if AI fails
      }
    } else if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, using placeholder fee data');
    }

    // Update cache
    cache = {
      data: finalData,
      timestamp: Date.now(),
    };

    // Set cache headers
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=172800'
    );

    return res.status(200).json({
      data: finalData,
      cached: false,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
