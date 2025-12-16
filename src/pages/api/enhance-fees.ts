import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCEXFeesFromAI, mergeCEXFeeData } from '@/lib/api/gemini';

/**
 * Manual Fee Enhancement API
 * Manually trigger AI enhancement for testing
 */

declare global {
  var cexCompleteCache: { data: any; timestamp: number } | null;
  var cexAIProcessing: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });
  }

  if (!global.cexCompleteCache?.data) {
    return res.status(400).json({ error: 'No exchange data in cache. Load main page first.' });
  }

  if (global.cexAIProcessing) {
    return res.status(400).json({ error: 'AI enhancement already in progress' });
  }

  try {
    global.cexAIProcessing = true;
    const exchanges = global.cexCompleteCache.data.slice(0, 5); // Test with first 5 exchanges
    
    console.log(`🧪 Manual AI enhancement test for ${exchanges.length} exchanges...`);
    
    const aiFeesData = await fetchCEXFeesFromAI(exchanges);
    
    if (aiFeesData.length > 0) {
      const enhancedExchanges = mergeCEXFeeData(exchanges, aiFeesData);
      
      // Update cache with enhanced data
      const updatedData = [...global.cexCompleteCache.data];
      enhancedExchanges.forEach((enhanced, index) => {
        updatedData[index] = enhanced;
      });
      
      global.cexCompleteCache = {
        data: updatedData,
        timestamp: Date.now(),
      };
      
      const enhancedCount = enhancedExchanges.filter(ex => ex.makerFee !== null || ex.takerFee !== null).length;
      
      return res.status(200).json({
        success: true,
        message: `Enhanced ${enhancedCount}/${exchanges.length} exchanges with AI fee data`,
        enhancedExchanges: enhancedExchanges.map(ex => ({
          name: ex.exchangeName,
          makerFee: ex.makerFee,
          takerFee: ex.takerFee,
        })),
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'AI returned no fee data',
      });
    }
  } catch (error) {
    console.error('Manual AI enhancement error:', error);
    return res.status(500).json({
      error: 'AI enhancement failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    global.cexAIProcessing = false;
  }
}