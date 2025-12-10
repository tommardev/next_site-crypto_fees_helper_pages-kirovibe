import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCombinedExchangeData } from '@/lib/api/coinmarketcap';
import { normalizeCombinedExchangeData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CACHE_DURATION } from '@/config/constants';

/**
 * CEX Fees API Route
 * 
 * DATA STRATEGY:
 * - CoinMarketCap: Exchange rankings, volumes, basic metadata (CMC fee data is unreliable)
 * - CoinGecko: Trust scores, additional metadata
 * - Fee Data: Currently using placeholders (null values) until dedicated fee sources are integrated
 * 
 * FUTURE: Will integrate dedicated fee data sources while keeping CMC/CoinGecko for rankings and metadata
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
    // NOTE: CMC fee data is unreliable, so we use placeholders for now
    const rawData = await fetchCombinedExchangeData(100);
    
    // Normalize data with placeholder fee values
    const normalizedData = rawData.map(normalizeCombinedExchangeData);

    // Update cache
    cache = {
      data: normalizedData,
      timestamp: Date.now(),
    };

    // Set cache headers for CDN/browser caching
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
    console.error('CEX Fees API Error:', error);
    const errorResponse = handleAPIError(error);
    return res.status(500).json(errorResponse);
  }
}
