import { CEXFees, DEXFees } from '@/lib/types/exchange';
import { CoinGeckoExchange } from '@/lib/types/api';

export function normalizeCEXData(rawData: CoinGeckoExchange): CEXFees {
  return {
    exchangeId: rawData.id,
    exchangeName: rawData.name,
    logo: rawData.image || `/logos/${rawData.id}.png`,
    makerFee: 0.1, // CoinGecko doesn't provide fee data, using typical default
    takerFee: 0.1, // These would need to be fetched from individual exchange APIs
    withdrawalFees: {},
    depositFees: {},
    trustScore: rawData.trust_score || 0,
    volume24h: rawData.trade_volume_24h_btc || 0,
    yearEstablished: rawData.year_established,
    country: rawData.country || 'Unknown',
    url: rawData.url || '',
    lastUpdated: new Date().toISOString(),
  };
}

// Known fee overrides for popular exchanges (from their official documentation)
const KNOWN_FEES: Record<string, { maker: number; taker: number }> = {
  binance: { maker: 0.1, taker: 0.1 },
  coinbase_exchange: { maker: 0.4, taker: 0.6 },
  kraken: { maker: 0.16, taker: 0.26 },
  kucoin: { maker: 0.1, taker: 0.1 },
  bybit_spot: { maker: 0.1, taker: 0.1 },
  okx: { maker: 0.08, taker: 0.1 },
  gate: { maker: 0.15, taker: 0.15 },
  huobi: { maker: 0.2, taker: 0.2 },
  bitfinex: { maker: 0.1, taker: 0.2 },
  gemini: { maker: 0.25, taker: 0.35 },
};

export function normalizeCEXDataWithFees(rawData: CoinGeckoExchange): CEXFees {
  const normalized = normalizeCEXData(rawData);
  
  // Apply known fees if available
  const knownFee = KNOWN_FEES[rawData.id];
  if (knownFee) {
    normalized.makerFee = knownFee.maker;
    normalized.takerFee = knownFee.taker;
  }
  
  return normalized;
}

export function normalizeDEXData(rawData: any): DEXFees {
  return {
    dexId: rawData.id || rawData.name?.toLowerCase().replace(/\s+/g, '-'),
    dexName: rawData.name,
    logo: rawData.logo || `/logos/${rawData.id}.png`,
    protocol: rawData.protocol || 'AMM',
    blockchain: rawData.blockchains || ['Ethereum'],
    swapFee: rawData.swapFee || 0.3,
    gasFeeEstimate: rawData.gasFeeEstimate || {
      Ethereum: { low: 5, average: 10, high: 20 },
    },
    liquidityUSD: rawData.liquidityUSD || 0,
    volume24h: rawData.volume24h || 0,
    url: rawData.url || '',
    lastUpdated: new Date().toISOString(),
  };
}

// Format numbers for display
export function formatFee(fee: number): string {
  return `${fee.toFixed(2)}%`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M BTC`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K BTC`;
  }
  return `${volume.toFixed(2)} BTC`;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
