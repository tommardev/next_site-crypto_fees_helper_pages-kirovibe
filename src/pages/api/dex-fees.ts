import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeDEXData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CACHE_DURATION } from '@/config/constants';
import { fetchCombinedDEXData } from '@/lib/api/coinmarketcap';

/**
 * DEX Fees API Route
 * 
 * DATA STRATEGY:
 * - CoinGecko: DEX listings, volumes, basic metadata
 * - Real API data only - no hardcoded lists
 * - Graceful degradation if APIs fail (empty array)
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

    // Update cache
    cache = {
      data: normalizedData,
      timestamp: Date.now(),
    };

    // Set cache headers
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=172800'
    );

    return res.status(200).json({
      data: normalizedData,
      cached: false,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
