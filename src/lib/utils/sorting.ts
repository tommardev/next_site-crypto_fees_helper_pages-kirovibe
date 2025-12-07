import { CEXFees, DEXFees, SortOption } from '@/lib/types/exchange';

export function sortCEXExchanges(exchanges: CEXFees[], sortBy: SortOption): CEXFees[] {
  const sorted = [...exchanges];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.exchangeName.localeCompare(b.exchangeName));
    case 'makerFee':
      return sorted.sort((a, b) => a.makerFee - b.makerFee);
    case 'takerFee':
      return sorted.sort((a, b) => a.takerFee - b.takerFee);
    case 'volume':
      return sorted.sort((a, b) => b.volume24h - a.volume24h);
    case 'trustScore':
      return sorted.sort((a, b) => b.trustScore - a.trustScore);
    case 'rank':
    default:
      return sorted; // Keep original order
  }
}

export function sortDEXExchanges(
  dexes: DEXFees[],
  sortBy: 'name' | 'swapFee' | 'volume' | 'liquidity'
): DEXFees[] {
  const sorted = [...dexes];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.dexName.localeCompare(b.dexName));
    case 'swapFee':
      return sorted.sort((a, b) => a.swapFee - b.swapFee);
    case 'volume':
      return sorted.sort((a, b) => b.volume24h - a.volume24h);
    case 'liquidity':
      return sorted.sort((a, b) => b.liquidityUSD - a.liquidityUSD);
    default:
      return sorted;
  }
}

export function filterExchangesBySearch<T extends { exchangeName?: string; dexName?: string }>(
  exchanges: T[],
  searchQuery: string
): T[] {
  if (!searchQuery.trim()) return exchanges;

  const query = searchQuery.toLowerCase();
  return exchanges.filter(exchange => {
    const name = (exchange.exchangeName || exchange.dexName || '').toLowerCase();
    return name.includes(query);
  });
}
