import { NextApiRequest, NextApiResponse } from 'next';
import { fetchExchangesWithDetails } from '@/lib/api/coinmarketcap';
import { normalizeCMCData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CACHE_DURATION } from '@/config/constants';

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
        message: 'COINMARKETCAP_API_KEY environment variable is required. Get your free API key at https://pro.coinmarketcap.com/signup',
      });
    }

    // Fetch fresh data from CoinMarketCap with REAL fees
    const rawData = await fetchExchangesWithDetails(100);
    
    // Normalize data
    const normalizedData = rawData
      .filter(ex => ex.maker_fee !== undefined && ex.taker_fee !== undefined)
      .map(normalizeCMCData);

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
