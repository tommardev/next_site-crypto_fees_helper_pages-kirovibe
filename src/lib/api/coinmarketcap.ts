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

/**
 * Fetch top exchanges by volume
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
 * Fetch detailed exchange information including fees
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
 * Fetch exchanges with full details in batches
 * CoinMarketCap allows multiple IDs in one request
 */
export async function fetchExchangesWithDetails(limit: number = 100) {
  // Step 1: Get top exchange IDs
  const exchangeMap = await fetchTopExchanges(limit);
  
  // Step 2: Get detailed info for all exchanges (batch request)
  const ids = exchangeMap.map(ex => ex.id);
  const exchangeInfo = await fetchExchangeInfo(ids);
  
  // Step 3: Combine map and info data
  return exchangeMap.map(mapItem => {
    const info = exchangeInfo[mapItem.id.toString()];
    return {
      ...mapItem,
      ...info,
    };
  });
}
