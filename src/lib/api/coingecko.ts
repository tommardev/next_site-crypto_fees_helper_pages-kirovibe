import { COINGECKO_BASE_URL } from '@/config/constants';
import { CoinGeckoExchange } from '@/lib/types/api';
import { fetchWithRetry } from './error-handler';
import { fetchWithRateLimit } from './rate-limiter';

export async function fetchExchanges(perPage: number = 100): Promise<CoinGeckoExchange[]> {
  const url = `${COINGECKO_BASE_URL}/exchanges?per_page=${perPage}`;
  
  const response = await fetchWithRateLimit(url);
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchExchangeDetails(exchangeId: string): Promise<any> {
  const url = `${COINGECKO_BASE_URL}/exchanges/${exchangeId}`;
  
  const response = await fetchWithRetry(url);
  return response.json();
}

export async function fetchExchangeTickers(exchangeId: string, page: number = 1): Promise<any> {
  const url = `${COINGECKO_BASE_URL}/exchanges/${exchangeId}/tickers?page=${page}`;
  
  const response = await fetchWithRetry(url);
  return response.json();
}
