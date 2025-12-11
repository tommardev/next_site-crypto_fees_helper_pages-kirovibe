const BASE_URL = 'https://pro-api.coinmarketcap.com';
const API_KEY = process.env.COINMARKETCAP_API_KEY;

if (!API_KEY) {
  console.warn('⚠️  COINMARKETCAP_API_KEY is not set. Exchange fee data will not be available.');
}

// CoinMarketCap API response types
export interface CMCExchangeMap {
  id: number;
  name: string;
  slug: string;
  is_active: number;
  first_historical_data: string;
  last_historical_data: string;
}

export interface CMCExchangeInfo {
  id: number;
  name: string;
  slug: string;
  logo: string;
  description: string;
  date_launched: string;
  notice: string;
  countries: string[];
  fiats: string[];
  tags: string[];
  type: string;
  maker_fee: number;
  taker_fee: number;
  spot_volume_usd: number;
  spot_volume_last_updated: string;
  urls: {
    website: string[];
    twitter: string[];
    blog: string[];
    chat: string[];
    fee: string[];
  };
}

interface CMCResponse<T> {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: T;
}

// Enhanced exchange data with rankings
export interface CMCExchangeRanking {
  id: number;
  name: string;
  slug: string;
  num_market_pairs: number;
  volume_24h: number;
  volume_24h_adjusted: number;
  volume_7d: number;
  volume_30d: number;
  percent_change_volume_24h: number;
  percent_change_volume_7d: number;
  percent_change_volume_30d: number;
  last_updated: string;
}

/**
 * Fetch top exchanges by volume with ranking data
 * @param limit Number of exchanges to fetch (default: 100)
 */
export async function fetchTopExchanges(limit: number = 100): Promise<CMCExchangeMap[]> {
  if (!API_KEY) {
    throw new Error('CoinMarketCap API key is not configured');
  }

  const url = `${BASE_URL}/v1/exchange/map?start=1&limit=${limit}&sort=volume_24h`;
  
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': API_KEY,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
  }

  const result: CMCResponse<CMCExchangeMap[]> = await response.json();
  
  if (result.status.error_code !== 0) {
    throw new Error(`CoinMarketCap API error: ${result.status.error_message}`);
  }

  return result.data;
}

/**
 * REMOVED: fetchExchangeRankings function
 * The /v1/exchange/listings/latest endpoint is not available in the free tier
 * Using only /v1/exchange/map and /v1/exchange/info which are available in free tier
 */

/**
 * Fetch detailed exchange information (metadata only, no fees)
 * @param ids Array of exchange IDs
 */
export async function fetchExchangeInfo(ids: number[]): Promise<Record<string, CMCExchangeInfo>> {
  if (!API_KEY) {
    throw new Error('CoinMarketCap API key is not configured');
  }

  if (ids.length === 0) {
    return {};
  }

  const url = `${BASE_URL}/v1/exchange/info?id=${ids.join(',')}`;
  
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': API_KEY,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
  }

  const result: CMCResponse<Record<string, CMCExchangeInfo>> = await response.json();
  
  if (result.status.error_code !== 0) {
    throw new Error(`CoinMarketCap API error: ${result.status.error_message}`);
  }

  return result.data;
}

/**
 * Fetch exchanges with metadata (no fee data - CMC fees are unreliable)
 * Use this for exchange lists, volumes, and basic info only
 */
export async function fetchExchangesWithDetails(limit: number = 100) {
  // Step 1: Get top exchange IDs by volume
  const exchangeMap = await fetchTopExchanges(limit);
  
  // Step 2: Get detailed metadata for all exchanges (batch request)
  const ids = exchangeMap.map(ex => ex.id);
  const exchangeInfo = await fetchExchangeInfo(ids);
  
  // Step 3: Combine map and info data (excluding unreliable fee data)
  return exchangeMap.map(mapItem => {
    const info = exchangeInfo[mapItem.id.toString()];
    return {
      ...mapItem,
      ...info,
      // Explicitly exclude fee data as it's unreliable
      maker_fee: undefined,
      taker_fee: undefined,
    };
  });
}

// CoinGecko API for supplementary data (trust scores, additional metadata)
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

export interface CoinGeckoExchange {
  id: string;
  name: string;
  year_established: number | null;
  country: string | null;
  description: string;
  url: string;
  image: string;
  has_trading_incentive: boolean;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
}

/**
 * Fetch exchange data from CoinGecko for supplementary information
 * Use for trust scores and additional metadata
 */
export async function fetchCoinGeckoExchanges(): Promise<CoinGeckoExchange[]> {
  const url = `${COINGECKO_BASE_URL}/exchanges?per_page=100&page=1`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  // Add API key if available for higher rate limits
  if (COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
  }
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Combine CMC and CoinGecko data using FREE TIER endpoints only
 * REAL DATA ONLY - No hardcoded conversions or fake data
 */
export async function fetchCombinedExchangeData(limit: number = 100) {
  try {
    // Fetch from both sources using free tier endpoints
    const [cmcExchanges, coinGeckoData] = await Promise.allSettled([
      fetchTopExchanges(limit),
      fetchCoinGeckoExchanges(),
    ]);

    // Create CoinGecko lookup map for supplementary data
    const coinGeckoMap = new Map<string, CoinGeckoExchange>();
    if (coinGeckoData.status === 'fulfilled') {
      coinGeckoData.value.forEach(exchange => {
        coinGeckoMap.set(exchange.name.toLowerCase(), exchange);
        coinGeckoMap.set(exchange.id.toLowerCase(), exchange);
      });
    }

    // Use CMC exchange map as primary source (free tier available)
    if (cmcExchanges.status === 'fulfilled') {
      // Get detailed info for the exchanges
      const exchangeIds = cmcExchanges.value.map(ex => ex.id);
      const exchangeInfo = await fetchExchangeInfo(exchangeIds);

      return cmcExchanges.value.map((exchange, index) => {
        const info = exchangeInfo[exchange.id.toString()];
        
        // Try to find matching CoinGecko data for trust scores
        const cgMatch = coinGeckoMap.get(exchange.name.toLowerCase()) || 
                       coinGeckoMap.get(exchange.slug?.toLowerCase() || '');

        return {
          ...exchange,
          ...info,
          // Add ranking position based on CMC order
          rank: index + 1,
          // Supplement with CoinGecko data where available
          trust_score: cgMatch?.trust_score || 0,
          trust_score_rank: cgMatch?.trust_score_rank || null,
          coingecko_id: cgMatch?.id || null,
          // Explicitly exclude unreliable fee data
          maker_fee: undefined,
          taker_fee: undefined,
        };
      });
    }

    // Fallback to CoinGecko only if CMC fails
    if (coinGeckoData.status === 'fulfilled') {
      return coinGeckoData.value.slice(0, limit).map((exchange, index) => ({
        ...exchange,
        rank: index + 1,
        // Use real BTC volume data from API - no conversions
        volume_24h: exchange.trade_volume_24h_btc || 0,
      }));
    }

    throw new Error('All API sources failed');
  } catch (error) {
    console.error('Error fetching combined exchange data:', error);
    throw error;
  }
}

// DEX Data Sources - Real API integrations

/**
 * Fetch DEX data from CoinGecko - REAL DATA ONLY
 * Returns all exchanges, filtering will be done based on real API data
 */
export async function fetchCoinGeckoDEXes(): Promise<any[]> {
  const url = `${COINGECKO_BASE_URL}/exchanges?per_page=100&page=1`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
  }
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`CoinGecko DEX API error: ${response.status} ${response.statusText}`);
  }

  const exchanges = await response.json();
  
  // Return all exchanges - let the API data determine what's a DEX
  // Filter only for exchanges that have actual trading data
  return exchanges.filter((exchange: any) => 
    exchange.trade_volume_24h_btc && exchange.trade_volume_24h_btc > 0
  );
}

/**
 * Fetch detailed DEX information from CoinGecko
 */
export async function fetchDEXDetails(dexIds: string[]): Promise<any[]> {
  if (dexIds.length === 0) return [];
  
  const results = await Promise.allSettled(
    dexIds.map(async (id) => {
      const url = `${COINGECKO_BASE_URL}/exchanges/${id}`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (COINGECKO_API_KEY) {
        headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`CoinGecko DEX detail error: ${response.status}`);
      }
      
      return response.json();
    })
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value);
}

/**
 * Fetch DEX data from DeFiLlama API - REAL DEX DATA ONLY
 * DeFiLlama provides actual DEX volume and liquidity data
 */
export async function fetchCombinedDEXData(): Promise<any[]> {
  try {
    // Fetch both DEX overview and TVL data
    const [dexResponse, tvlResponse] = await Promise.allSettled([
      fetch('https://api.llama.fi/overview/dexs'),
      fetch('https://api.llama.fi/protocols')
    ]);
    
    let dexData: any[] = [];
    let tvlData: any[] = [];
    
    if (dexResponse.status === 'fulfilled' && dexResponse.value.ok) {
      const data = await dexResponse.value.json();
      dexData = data.protocols || [];
    }
    
    if (tvlResponse.status === 'fulfilled' && tvlResponse.value.ok) {
      const data = await tvlResponse.value.json();
      tvlData = data || [];
    }
    
    // Create TVL lookup map with logo data
    const tvlMap = new Map();
    tvlData.forEach((protocol: any) => {
      if (protocol.category === 'Dexes' || protocol.name) {
        tvlMap.set(protocol.name.toLowerCase(), {
          tvl: protocol.tvl || 0,
          logo: protocol.logo || '', // Real logo from DeFiLlama
          url: protocol.url || '', // Real URL from DeFiLlama
        });
      }
    });
    
    // Return top 50 DEXes with real volume, liquidity, and logo data
    return dexData.slice(0, 50).map((dex: any) => {
      const tvlInfo = tvlMap.get(dex.name?.toLowerCase()) || {};
      
      return {
        id: dex.name?.toLowerCase().replace(/\s+/g, '-') || '',
        name: dex.name || 'Unknown DEX',
        // Use real data from DeFiLlama API
        volume24h: dex.total24h || 0,
        volume7d: dex.total7d || 0,
        change_1d: dex.change_1d || 0,
        chains: dex.chains || [],
        // Add real data from TVL API
        liquidityUSD: tvlInfo.tvl || 0,
        image: tvlInfo.logo || '', // Real logo from DeFiLlama protocols API
        url: tvlInfo.url || '', // Real URL from DeFiLlama protocols API
        centralized: false, // DeFiLlama only tracks DEXes
      };
    }) || [];
    
  } catch (error) {
    console.error('Error fetching DEX data from DeFiLlama:', error);
    // Fallback: Return empty array for graceful degradation
    return [];
  }
}

// REMOVED: inferDEXProtocol and inferBlockchains functions
// These violated real-data-only policy by making up data based on name guessing
// All protocol and blockchain data must come from real API sources