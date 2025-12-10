import { CEXFees, DEXFees } from '@/lib/types/exchange';
import { CoinGeckoExchange } from '@/lib/types/api';

/**
 * Normalize combined exchange data (CMC + CoinGecko)
 * Uses placeholder values for fee data since CMC fees are unreliable
 */
export function normalizeCombinedExchangeData(rawData: any): CEXFees {
  return {
    exchangeId: rawData.slug || rawData.id?.toString() || rawData.name?.toLowerCase().replace(/\s+/g, '-'),
    exchangeName: rawData.name,
    logo: rawData.logo || rawData.image || `/logos/${rawData.slug || rawData.id}.png`,
    // Use placeholder values for fees - will be replaced with real data from other sources
    makerFee: null, // Placeholder: Fee data not available
    takerFee: null, // Placeholder: Fee data not available
    withdrawalFees: {}, // Placeholder: Will be populated from dedicated fee sources
    depositFees: {}, // Placeholder: Will be populated from dedicated fee sources
    trustScore: rawData.trust_score || 0,
    volume24h: rawData.volume_24h || rawData.spot_volume_usd || rawData.trade_volume_24h_btc || 0,
    yearEstablished: rawData.date_launched ? new Date(rawData.date_launched).getFullYear() : 
                    rawData.year_established || null,
    country: rawData.countries?.[0] || rawData.country || 'Unknown',
    url: rawData.urls?.website?.[0] || rawData.url || '',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Normalize CoinGecko exchange data (for supplementary data)
 * REAL DATA ONLY - No hardcoded fees
 */
export function normalizeCEXData(rawData: CoinGeckoExchange): CEXFees {
  return {
    exchangeId: rawData.id,
    exchangeName: rawData.name,
    logo: rawData.image || `/logos/${rawData.id}.png`,
    // Use null placeholders - no hardcoded fee data
    makerFee: null, // Placeholder: Fee data not available from CoinGecko
    takerFee: null, // Placeholder: Fee data not available from CoinGecko
    withdrawalFees: {}, // Placeholder: Will be populated from dedicated fee sources
    depositFees: {}, // Placeholder: Will be populated from dedicated fee sources
    trustScore: rawData.trust_score || 0,
    volume24h: rawData.trade_volume_24h_btc || 0,
    yearEstablished: rawData.year_established,
    country: rawData.country || 'Unknown',
    url: rawData.url || '',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Normalize DEX data from DeFiLlama API - REAL DATA ONLY
 * DeFiLlama provides authentic DEX volume and chain data
 */
export function normalizeDEXData(rawData: any): DEXFees {
  return {
    dexId: rawData.id || rawData.name?.toLowerCase().replace(/\s+/g, '-') || '',
    dexName: rawData.name || 'Unknown DEX',
    logo: rawData.image || `/logos/${rawData.id || 'default'}.png`,
    protocol: 'AMM', // Most DEXes are AMM-based
    blockchain: rawData.chains || [], // Real blockchain data from DeFiLlama
    swapFee: null, // Placeholder: Real swap fee data not available from current APIs
    gasFeeEstimate: {}, // Placeholder: Will be populated from real gas price APIs
    liquidityUSD: 0, // Placeholder: Will be populated from real liquidity APIs
    volume24h: rawData.volume24h || rawData.total24h || 0, // Use real USD volume from DeFiLlama
    url: rawData.url || '',
    lastUpdated: new Date().toISOString(),
  };
}

// Format numbers for display
export function formatFee(fee: number | null): string {
  if (fee === null) return '-';
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
