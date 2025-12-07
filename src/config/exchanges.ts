// Known exchange configurations and metadata
export const EXCHANGE_METADATA = {
  binance: {
    displayName: 'Binance',
    defaultLogo: '/logos/binance.png',
    color: '#F3BA2F',
  },
  coinbase: {
    displayName: 'Coinbase',
    defaultLogo: '/logos/coinbase.png',
    color: '#0052FF',
  },
  kraken: {
    displayName: 'Kraken',
    defaultLogo: '/logos/kraken.png',
    color: '#5741D9',
  },
  kucoin: {
    displayName: 'KuCoin',
    defaultLogo: '/logos/kucoin.png',
    color: '#24AE8F',
  },
  bybit: {
    displayName: 'Bybit',
    defaultLogo: '/logos/bybit.png',
    color: '#F7A600',
  },
} as const;

// DEX configurations
export const DEX_METADATA = {
  uniswap: {
    displayName: 'Uniswap',
    protocol: 'AMM' as const,
    blockchains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
    defaultLogo: '/logos/uniswap.png',
    color: '#FF007A',
  },
  pancakeswap: {
    displayName: 'PancakeSwap',
    protocol: 'AMM' as const,
    blockchains: ['BSC', 'Ethereum'],
    defaultLogo: '/logos/pancakeswap.png',
    color: '#1FC7D4',
  },
  sushiswap: {
    displayName: 'SushiSwap',
    protocol: 'AMM' as const,
    blockchains: ['Ethereum', 'Polygon', 'Arbitrum', 'BSC'],
    defaultLogo: '/logos/sushiswap.png',
    color: '#FA52A0',
  },
  '1inch': {
    displayName: '1inch',
    protocol: 'Aggregator' as const,
    blockchains: ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism'],
    defaultLogo: '/logos/1inch.png',
    color: '#94A6C3',
  },
  curve: {
    displayName: 'Curve',
    protocol: 'AMM' as const,
    blockchains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
    defaultLogo: '/logos/curve.png',
    color: '#40649F',
  },
} as const;

// Fallback logo
export const DEFAULT_EXCHANGE_LOGO = '/logos/default.png';

// Helper function to get exchange metadata
export function getExchangeMetadata(exchangeId: string) {
  return EXCHANGE_METADATA[exchangeId as keyof typeof EXCHANGE_METADATA] || {
    displayName: exchangeId,
    defaultLogo: DEFAULT_EXCHANGE_LOGO,
    color: '#718096',
  };
}

// Helper function to get DEX metadata
export function getDEXMetadata(dexId: string) {
  return DEX_METADATA[dexId as keyof typeof DEX_METADATA] || {
    displayName: dexId,
    protocol: 'AMM' as const,
    blockchains: ['Ethereum'],
    defaultLogo: DEFAULT_EXCHANGE_LOGO,
    color: '#718096',
  };
}
