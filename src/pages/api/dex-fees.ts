import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeDEXData } from '@/lib/utils/normalize';
import { handleAPIError } from '@/lib/api/error-handler';
import { CACHE_DURATION } from '@/config/constants';
import { DEX_METADATA } from '@/config/exchanges';

// In-memory cache
let cache: { data: any; timestamp: number } | null = null;

// Mock DEX data (in production, this would come from The Graph or other DEX APIs)
const MOCK_DEX_DATA = [
  {
    id: 'uniswap',
    name: 'Uniswap V3',
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    protocol: 'AMM',
    blockchains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
    swapFee: 0.3,
    gasFeeEstimate: {
      Ethereum: { low: 8, average: 15, high: 30 },
      Polygon: { low: 0.01, average: 0.05, high: 0.1 },
      Arbitrum: { low: 0.5, average: 1, high: 2 },
      Optimism: { low: 0.5, average: 1, high: 2 },
    },
    liquidityUSD: 3500000000,
    volume24h: 1200000000,
    url: 'https://app.uniswap.org',
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    protocol: 'AMM',
    blockchains: ['BSC', 'Ethereum'],
    swapFee: 0.25,
    gasFeeEstimate: {
      BSC: { low: 0.1, average: 0.2, high: 0.5 },
      Ethereum: { low: 8, average: 15, high: 30 },
    },
    liquidityUSD: 2100000000,
    volume24h: 800000000,
    url: 'https://pancakeswap.finance',
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    logo: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
    protocol: 'AMM',
    blockchains: ['Ethereum', 'Polygon', 'Arbitrum', 'BSC'],
    swapFee: 0.3,
    gasFeeEstimate: {
      Ethereum: { low: 8, average: 15, high: 30 },
      Polygon: { low: 0.01, average: 0.05, high: 0.1 },
      Arbitrum: { low: 0.5, average: 1, high: 2 },
      BSC: { low: 0.1, average: 0.2, high: 0.5 },
    },
    liquidityUSD: 450000000,
    volume24h: 150000000,
    url: 'https://www.sushi.com',
  },
  {
    id: '1inch',
    name: '1inch',
    logo: 'https://cryptologos.cc/logos/1inch-1inch-logo.png',
    protocol: 'Aggregator',
    blockchains: ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism'],
    swapFee: 0,
    gasFeeEstimate: {
      Ethereum: { low: 10, average: 18, high: 35 },
      BSC: { low: 0.15, average: 0.25, high: 0.6 },
      Polygon: { low: 0.02, average: 0.06, high: 0.15 },
      Arbitrum: { low: 0.6, average: 1.2, high: 2.5 },
      Optimism: { low: 0.6, average: 1.2, high: 2.5 },
    },
    liquidityUSD: 0,
    volume24h: 500000000,
    url: 'https://app.1inch.io',
  },
  {
    id: 'curve',
    name: 'Curve Finance',
    logo: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
    protocol: 'AMM',
    blockchains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
    swapFee: 0.04,
    gasFeeEstimate: {
      Ethereum: { low: 12, average: 20, high: 40 },
      Polygon: { low: 0.02, average: 0.08, high: 0.2 },
      Arbitrum: { low: 0.8, average: 1.5, high: 3 },
      Optimism: { low: 0.8, average: 1.5, high: 3 },
    },
    liquidityUSD: 3800000000,
    volume24h: 200000000,
    url: 'https://curve.fi',
  },
];

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

    // Normalize DEX data
    const normalizedData = MOCK_DEX_DATA.map(normalizeDEXData);

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
