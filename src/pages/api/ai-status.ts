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

  // Check if any exchanges have real fee data
  const cexCache = (global as any).cexCompleteCache;
  let enhancedExchanges = 0;
  let totalExchanges = 0;

  if (cexCache?.data) {
    totalExchanges = cexCache.data.length;
    enhancedExchanges = cexCache.data.filter((ex: any) => 
      ex.makerFee !== null || ex.takerFee !== null
    ).length;
  }

  return res.status(200).json({
    geminiConfigured: hasGeminiKey,
    cmcConfigured: hasCMCKey,
    cacheExists: !!cexCache,
    totalExchanges,
    enhancedExchanges,
    enhancementRate: totalExchanges > 0 ? (enhancedExchanges / totalExchanges * 100).toFixed(1) + '%' : '0%',
    lastCacheUpdate: cexCache?.timestamp ? new Date(cexCache.timestamp).toISOString() : null,
  });
}