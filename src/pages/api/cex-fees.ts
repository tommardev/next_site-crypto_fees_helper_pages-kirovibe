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

  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return res.status(200).json({
        data: cache.data,
        cached: true,
        cachedAt: new Date(cache.timestamp).toISOString(),
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

    // Use Gemini AI to collect real fee data for these exchanges
    let finalData = normalizedData;
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`Fetching AI fee data for ${normalizedData.length} exchanges...`);
        const aiFeesData = await fetchCEXFeesFromAI(normalizedData);
        
        if (aiFeesData.length > 0) {
          finalData = mergeCEXFeeData(normalizedData, aiFeesData);
          console.log(`Successfully merged AI fee data for ${aiFeesData.length} exchanges`);
        }
      } catch (aiError) {
        console.error('AI fee collection failed, using placeholder data:', aiError);
        // Continue with placeholder data if AI fails
      }
    } else {
      console.warn('GEMINI_API_KEY not configured, using placeholder fee data');
    }

    // Update cache
    cache = {
      data: finalData,
      timestamp: Date.now(),
    };

    // Set cache headers for CDN/browser caching
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
    console.error('CEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
