import { NextApiRequest, NextApiResponse } from 'next';
import { fetchDEXFeesFromAI, mergeDEXFeeData } from '@/lib/api/gemini';

/**
 * Manual DEX Fee Enhancement API
 * Manually trigger AI enhancement for DEX testing
 */

declare global {
  var dexCompleteCache: { data: any; timestamp: number } | null;
  var dexAIProcessing: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });
  }

  if (!global.dexCompleteCache?.data) {
    return res.status(400).json({ error: 'No DEX data in cache. Load DEX page first.' });
  }

  if (global.dexAIProcessing) {
    return res.status(400).json({ error: 'DEX AI enhancement already in progress' });
  }

  try {
    global.dexAIProcessing = true;
    const dexes = global.dexCompleteCache.data.slice(0, 3); // Test with first 3 DEXes (smaller batch)
    
    console.log(`🧪 Manual DEX AI enhancement test for ${dexes.length} DEXes...`);
    
    const aiFeesData = await fetchDEXFeesFromAI(dexes);
    
    if (aiFeesData.length > 0) {
      const enhancedDEXes = mergeDEXFeeData(dexes, aiFeesData);
      
      // Update cache with enhanced data
      const updatedData = [...global.dexCompleteCache.data];
      enhancedDEXes.forEach((enhanced, index) => {
        updatedData[index] = enhanced;
      });
      
      global.dexCompleteCache = {
        data: updatedData,
        timestamp: Date.now(),
      };
      
      const enhancedCount = enhancedDEXes.filter(dex => dex.swapFee !== null).length;
      
      return res.status(200).json({
        success: true,
        message: `Enhanced ${enhancedCount}/${dexes.length} DEXes with AI fee data`,
        enhancedDEXes: enhancedDEXes.map(dex => ({
          name: dex.dexName,
          swapFee: dex.swapFee,
        })),
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'AI returned no DEX fee data',
      });
    }
  } catch (error) {
    console.error('Manual DEX AI enhancement error:', error);
    return res.status(500).json({
      error: 'DEX AI enhancement failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    global.dexAIProcessing = false;
  }
}