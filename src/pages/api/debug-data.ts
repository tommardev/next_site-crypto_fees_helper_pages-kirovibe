import { NextApiRequest, NextApiResponse } from 'next';
import { getCacheState } from '@/lib/utils/cache-optimizer';

/**
 * Debug API Route - View All Data Elements
 * 
 * DEVELOPMENT ONLY: Route to inspect complete cached data for debugging
 * Shows all exchanges/DEXes with their current data state for correctness verification
 * 
 * Usage:
 * - GET /api/debug-data?type=cex - View all CEX data
 * - GET /api/debug-data?type=dex - View all DEX data
 * - GET /api/debug-data - View both CEX and DEX data
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;

  try {
    const debugData: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // Get CEX data if requested or no type specified
    if (!type || type === 'cex') {
      const cexCache = getCacheState('cex');
      debugData.cex = {
        cached: !!cexCache,
        cacheAge: cexCache ? Math.round((Date.now() - cexCache.timestamp) / (1000 * 60 * 60)) : null,
        totalExchanges: cexCache?.data?.length || 0,
        aiProcessing: cexCache?.isProcessing || false,
        sampleData: cexCache?.data?.slice(0, 3) || [], // First 3 items for inspection
        dataStructure: cexCache?.data?.[0] ? Object.keys(cexCache.data[0]) : [],
        feeDataStatus: {
          withMakerFee: cexCache?.data?.filter((ex: any) => ex.makerFee !== null).length || 0,
          withTakerFee: cexCache?.data?.filter((ex: any) => ex.takerFee !== null).length || 0,
          withoutFees: cexCache?.data?.filter((ex: any) => ex.makerFee === null && ex.takerFee === null).length || 0,
        }
      };
    }

    // Get DEX data if requested or no type specified
    if (!type || type === 'dex') {
      const dexCache = getCacheState('dex');
      debugData.dex = {
        cached: !!dexCache,
        cacheAge: dexCache ? Math.round((Date.now() - dexCache.timestamp) / (1000 * 60 * 60)) : null,
        totalDEXes: dexCache?.data?.length || 0,
        aiProcessing: dexCache?.isProcessing || false,
        sampleData: dexCache?.data?.slice(0, 3) || [], // First 3 items for inspection
        dataStructure: dexCache?.data?.[0] ? Object.keys(dexCache.data[0]) : [],
        feeDataStatus: {
          withSwapFee: dexCache?.data?.filter((dex: any) => dex.swapFee !== null).length || 0,
          withoutFees: dexCache?.data?.filter((dex: any) => dex.swapFee === null).length || 0,
        }
      };
    }

    // Global AI processing status
    debugData.aiStatus = {
      cexProcessing: global.cexAIProcessing || false,
      dexProcessing: global.dexAIProcessing || false,
      circuitBreaker: global.geminiCircuitBreaker || null,
      lastCEXError: global.lastAIError || null,
      lastDEXError: global.lastDEXAIError || null,
    };

    // Environment configuration
    debugData.config = {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasCMCKey: !!process.env.COINMARKETCAP_API_KEY,
      hasCoinGeckoKey: !!process.env.COINGECKO_API_KEY,
      cexCacheHours: process.env.CEX_CACHE_HOURS || '72',
      dexCacheHours: process.env.DEX_CACHE_HOURS || '72',
    };

    return res.status(200).json(debugData);
  } catch (error) {
    console.error('Debug API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve debug data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}