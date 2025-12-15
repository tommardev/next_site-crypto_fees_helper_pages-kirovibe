import { GoogleGenAI } from '@google/genai';
import { CEXFees, DEXFees } from '@/lib/types/exchange';

/**
 * Google Gemini API Client for AI-powered fee data collection
 * 
 * Uses official @google/genai SDK with Gemini 2.5 Flash model
 * Provides structured JSON responses with actual trading fees
 */

interface CEXFeeData {
  exchangeId: string;
  makerFee: number | null;
  takerFee: number | null;
  withdrawalFees: { [coin: string]: number };
  depositFees: { [coin: string]: number };
}

interface DEXFeeData {
  dexId: string;
  swapFee: number | null;
  gasFeeEstimate: {
    [blockchain: string]: {
      low: number;
      average: number;
      high: number;
    };
  };
}

/**
 * Generate dynamic prompt for CEX fee data collection
 */
//DO NOT REMOVE. Leave this function for reference of later review
function generateCEXPrompt_Kiro(exchanges: CEXFees[]): string {
  const exchangeList = exchanges.map(ex => `- ${ex.exchangeName} (ID: ${ex.exchangeId})`).join('\n');
  
  return `You are a cryptocurrency exchange fee data expert. I need you to provide REAL, CURRENT trading fees for the following centralized exchanges (CEX). 

IMPORTANT INSTRUCTIONS:
- Only provide REAL fee data that you are confident about
- Use null for any fees you're not certain about
- Maker fees are typically lower than taker fees
- Withdrawal fees vary by cryptocurrency
- Most exchanges have zero deposit fees for crypto
- Return data in the exact JSON format specified below

EXCHANGES TO ANALYZE:
${exchangeList}

Please return a JSON array with the following structure for each exchange:
{
  "exchangeId": "string (use the ID provided above)",
  "makerFee": number | null (percentage, e.g., 0.1 for 0.1%),
  "takerFee": number | null (percentage, e.g., 0.1 for 0.1%),
  "withdrawalFees": {
    "BTC": number | null (absolute amount in BTC),
    "ETH": number | null (absolute amount in ETH),
    "USDT": number | null (absolute amount in USDT)
  },
  "depositFees": {
    "BTC": number | null (usually 0 for crypto),
    "ETH": number | null (usually 0 for crypto),
    "USDT": number | null (usually 0 for crypto)
  }
}

Return only the JSON array, no additional text or explanation.`;
}

function generateCEXPrompt(exchanges: CEXFees[]): string {
  const exchangeList = exchanges.map(ex => `| ${ex.exchangeId} | **${ex.exchangeName}** | `).join('\n');
  
  return `**Find and Retrieve** the current, *lowest-tier* or *lowest-level* specificaly SPOT TRADING maker and taker fees (as a percentage, e.g., 0.1 for 0.1%) from the official SPOT TRADING fee page for each exchange listed below search only by identical "Exchange Name" provided.
**Format** the verified data into the specified JSON structure and Return only the JSON array, no additional text or explanation.

 **List of Exchanges to Check:**
| Exchange ID | Exchange Name |
 ${exchangeList}

**Required Output Schema (return this data in JSON array format):**
[
  {
    "exchangeId": "string (use the ID provided above)",
    "exchange_name": "Binance",
    "makerFee": number | null (percentage, e.g., 0.1 for 0.1%),
    "takerFee": number | null (percentage, e.g., 0.1 for 0.1%)
  },
  // ... continue for all listed exchanges
]
`;
}

/**
 * Generate dynamic prompt for DEX fee data collection
 */
function generateDEXPrompt(dexes: DEXFees[]): string {
  const dexList = dexes.map(dex => `- ${dex.dexName} (ID: ${dex.dexId}) on ${dex.blockchain.join(', ')}`).join('\n');
  
  return `You are a decentralized exchange (DEX) fee data expert. I need you to provide REAL, CURRENT swap fees and gas estimates for the following DEXes.

IMPORTANT INSTRUCTIONS:
- Only provide REAL fee data that you are confident about
- Use null for any fees you're not certain about
- Swap fees are typically 0.05% to 0.3% for most AMM DEXes
- Gas fees vary significantly by blockchain and network congestion
- Return data in the exact JSON format specified below

DEXES TO ANALYZE:
${dexList}

Please return a JSON array with the following structure for each DEX:
{
  "dexId": "string (use the ID provided above)",
  "swapFee": number | null (percentage, e.g., 0.3 for 0.3%),
  "gasFeeEstimate": {
    "Ethereum": {
      "low": number | null (USD),
      "average": number | null (USD),
      "high": number | null (USD)
    },
    "BSC": {
      "low": number | null (USD),
      "average": number | null (USD),
      "high": number | null (USD)
    },
    "Polygon": {
      "low": number | null (USD),
      "average": number | null (USD),
      "high": number | null (USD)
    }
  }
}

Only include gas estimates for blockchains that the DEX actually operates on.
Return only the JSON array, no additional text or explanation.`;
}

/**
 * Call Gemini API using official SDK
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const model = 'gemini-2.5-flash';
  
  const contents = [{
    role: 'user' as const,
    parts: [{
      text: prompt,
    }],
  }];

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
    });

    if (!response || !response.text) {
      throw new Error('No response from Gemini API');
    }

    return response.text;
  } catch (error: any) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Parse JSON response from Gemini, handling potential formatting issues
 */
function parseGeminiJSON<T>(responseText: string): T[] {
  try {
    // Remove any markdown code blocks or extra formatting
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse Gemini response:', responseText);
    throw new Error(`Failed to parse AI response as JSON: ${error}`);
  }
}

/**
 * Fetch CEX fee data using Gemini AI
 */
export async function fetchCEXFeesFromAI(exchanges: CEXFees[]): Promise<CEXFeeData[]> {
  if (exchanges.length === 0) {
    return [];
  }

  try {
    const prompt = generateCEXPrompt(exchanges);
    const responseText = await callGeminiAPI(prompt);
    const feeData = parseGeminiJSON<CEXFeeData>(responseText);
    
    console.log(`Successfully fetched AI fee data for ${feeData.length} CEX exchanges`);
    return feeData;
  } catch (error) {
    console.error('Error fetching CEX fees from AI:', error);
    // Return empty array on error - don't break the main API
    return [];
  }
}

/**
 * Fetch DEX fee data using Gemini AI
 */
export async function fetchDEXFeesFromAI(dexes: DEXFees[]): Promise<DEXFeeData[]> {
  if (dexes.length === 0) {
    return [];
  }

  try {
    const prompt = generateDEXPrompt(dexes);
    const responseText = await callGeminiAPI(prompt);
    const feeData = parseGeminiJSON<DEXFeeData>(responseText);
    
    console.log(`Successfully fetched AI fee data for ${feeData.length} DEX exchanges`);
    return feeData;
  } catch (error) {
    console.error('Error fetching DEX fees from AI:', error);
    // Return empty array on error - don't break the main API
    return [];
  }
}

/**
 * Merge AI fee data with existing exchange data
 */
export function mergeCEXFeeData(exchanges: CEXFees[], aiData: CEXFeeData[]): CEXFees[] {
  const feeMap = new Map(aiData.map(fee => [fee.exchangeId, fee]));
  
  console.log(`Merging AI data: ${aiData.length} AI records with ${exchanges.length} exchanges`);
  console.log('AI Exchange IDs:', aiData.map(d => d.exchangeId));
  console.log('Exchange IDs:', exchanges.map(e => e.exchangeId));
  
  return exchanges.map(exchange => {
    const aiFeesData = feeMap.get(exchange.exchangeId);
    
    if (aiFeesData) {
      console.log(`✓ Matched AI data for ${exchange.exchangeName} (${exchange.exchangeId})`);
      return {
        ...exchange,
        makerFee: aiFeesData.makerFee,
        takerFee: aiFeesData.takerFee,
        withdrawalFees: aiFeesData.withdrawalFees,
        depositFees: aiFeesData.depositFees,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      console.log(`✗ No AI data found for ${exchange.exchangeName} (${exchange.exchangeId})`);
    }
    
    return exchange;
  });
}

/**
 * Merge AI fee data with existing DEX data
 */
export function mergeDEXFeeData(dexes: DEXFees[], aiData: DEXFeeData[]): DEXFees[] {
  const feeMap = new Map(aiData.map(fee => [fee.dexId, fee]));
  
  console.log(`Merging DEX AI data: ${aiData.length} AI records with ${dexes.length} DEXes`);
  console.log('AI DEX IDs:', aiData.map(d => d.dexId));
  console.log('DEX IDs:', dexes.map(d => d.dexId));
  
  return dexes.map(dex => {
    const aiFeesData = feeMap.get(dex.dexId);
    
    if (aiFeesData) {
      console.log(`✓ Matched AI data for ${dex.dexName} (${dex.dexId})`);
      return {
        ...dex,
        swapFee: aiFeesData.swapFee,
        gasFeeEstimate: aiFeesData.gasFeeEstimate,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      console.log(`✗ No AI data found for ${dex.dexName} (${dex.dexId})`);
    }
    
    return dex;
  });
}