import { CEXFees, DEXFees } from '@/lib/types/exchange';
import { CoinGeckoExchange } from '@/lib/types/api';
import { CMCExchangeInfo } from '@/lib/api/coinmarketcap';

/**
 * Normalize CoinMarketCap exchange data with REAL fees
 */
export function normalizeCMCData(rawData: CMCExchangeInfo & { id: number }): CEXFees {
  return {
    exchangeId: rawData.slug || rawData.id.toString(),
    exchangeName: rawData.name,
    logo: rawData.logo || `/logos/${rawData.slug}.png`,
    makerFee: rawData.maker_fee || 0,
    takerFee: rawData.taker_fee || 0,
    withdrawalFees: {},
    depositFees: {},
    trustScore: 0, // CMC doesn't provide trust score, can supplement with CoinGecko
    volume24h: rawData.spot_volume_usd ? rawData.spot_volume_usd / 50000 : 0, // Convert USD to BTC estimate
    yearEstablished: rawData.date_launched ? new Date(rawData.date_launched).getFullYear() : null,
    country: rawData.countries?.[0] || 'Unknown',
    url: rawData.urls?.website?.[0] || '',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Normalize CoinGecko exchange data (for supplementary data)
 */
export function normalizeCEXData(rawData: CoinGeckoExchange): CEXFees {
  return {
    exchangeId: rawData.id,
    exchangeName: rawData.name,
    logo: rawData.image || `/logos/${rawData.id}.png`,
    makerFee: 0,
    takerFee: 0,
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
