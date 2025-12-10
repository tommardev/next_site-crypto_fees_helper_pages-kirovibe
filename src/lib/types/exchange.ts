// CEX (Centralized Exchange) Fee Structure
export interface CEXFees {
  exchangeId: string;
  exchangeName: string;
  logo: string;
  makerFee: number | null;        // Percentage (e.g., 0.1 for 0.1%) - null when data not available
  takerFee: number | null;        // Percentage - null when data not available
  withdrawalFees: {
    [coin: string]: number; // Absolute amount
  };
  depositFees: {
    [coin: string]: number;
  };
  trustScore: number;      // 1-10 scale
  volume24h: number;       // BTC
  yearEstablished: number | null;
  country: string;
  url: string;
  lastUpdated: string;     // ISO timestamp
}

// DEX (Decentralized Exchange) Fee Structure
export interface DEXFees {
  dexId: string;
  dexName: string;
  logo: string;
  protocol: 'AMM' | 'Order Book' | 'Aggregator';
  blockchain: string[];    // ['Ethereum', 'BSC', 'Polygon']
  swapFee: number | null;  // Percentage - null when data not available
  gasFeeEstimate: {
    [blockchain: string]: {
      low: number;         // USD
      average: number;
      high: number;
    };
  };
  liquidityUSD: number;
  volume24h: number;
  url: string;
  lastUpdated: string;
}

// Sort options
export type SortOption = 'rank' | 'name' | 'makerFee' | 'takerFee' | 'volume' | 'trustScore';

// Filter state
export interface FilterState {
  searchQuery: string;
  sortBy: SortOption;
  minTrustScore?: number;
  maxFee?: number;
}
