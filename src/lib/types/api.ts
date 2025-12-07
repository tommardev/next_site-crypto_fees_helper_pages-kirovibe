// API Response wrapper
export interface APIResponse<T> {
  data: T;
  cached: boolean;
  cachedAt: string;
  error?: string;
}

// CoinGecko API raw response types
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
  tickers?: any[];
}

// Error response
export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}

// Cache metadata
export interface CacheMetadata {
  timestamp: number;
  expiresAt: number;
  source: string;
}
