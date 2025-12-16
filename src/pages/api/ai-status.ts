import { NextApiRequest, NextApiResponse } from 'next';

/**
 * AI Enhancement Status Check
 * Simple endpoint to verify if Gemini AI is working
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasCMCKey = !!process.env.COINMARKETCAP_API_KEY;

  // Check CEX and DEX data
  const cexCache = (global as any).cexCompleteCache;
  const dexCache = (global as any).dexCompleteCache;
  const lastAIError = (global as any).lastAIError;
  const lastDEXAIError = (global as any).lastDEXAIError;
  const cexProcessing = (global as any).cexAIProcessing || false;
  const dexProcessing = (global as any).dexAIProcessing || false;
  
  let enhancedExchanges = 0;
  let totalExchanges = 0;
  let enhancedDEXes = 0;
  let totalDEXes = 0;

  if (cexCache?.data) {
    totalExchanges = cexCache.data.length;
    enhancedExchanges = cexCache.data.filter((ex: any) => 
      ex.makerFee !== null || ex.takerFee !== null
    ).length;
  }

  if (dexCache?.data) {
    totalDEXes = dexCache.data.length;
    enhancedDEXes = dexCache.data.filter((dex: any) => 
      dex.swapFee !== null
    ).length;
  }

  return res.status(200).json({
    geminiConfigured: hasGeminiKey,
    cmcConfigured: hasCMCKey,
    cexProcessing,
    dexProcessing,
    cex: {
      cacheExists: !!cexCache,
      processing: cexProcessing,
      totalExchanges,
      enhancedExchanges,
      enhancementRate: totalExchanges > 0 ? (enhancedExchanges / totalExchanges * 100).toFixed(1) + '%' : '0%',
      lastCacheUpdate: cexCache?.timestamp ? new Date(cexCache.timestamp).toISOString() : null,
      lastError: lastAIError,
    },
    dex: {
      cacheExists: !!dexCache,
      processing: dexProcessing,
      totalDEXes,
      enhancedDEXes,
      enhancementRate: totalDEXes > 0 ? (enhancedDEXes / totalDEXes * 100).toFixed(1) + '%' : '0%',
      lastCacheUpdate: dexCache?.timestamp ? new Date(dexCache.timestamp).toISOString() : null,
      lastError: lastDEXAIError,
    },
    // Legacy fields for backward compatibility
    cacheExists: !!cexCache,
    totalExchanges,
    enhancedExchanges,
    enhancementRate: totalExchanges > 0 ? (enhancedExchanges / totalExchanges * 100).toFixed(1) + '%' : '0%',
    lastCacheUpdate: cexCache?.timestamp ? new Date(cexCache.timestamp).toISOString() : null,
    lastError: lastAIError,
  });
}