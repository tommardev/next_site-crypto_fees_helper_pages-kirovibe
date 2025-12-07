import { useState, useMemo } from 'react';
import { CEXFees, DEXFees, SortOption } from '@/lib/types/exchange';

export function useCEXFilters(exchanges: CEXFees[] | undefined) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [showCount, setShowCount] = useState(20);

  const filteredAndSorted = useMemo(() => {
    if (!exchanges) return [];

    // Filter by search query
    let filtered = exchanges.filter(exchange =>
      exchange.exchangeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.exchangeName.localeCompare(b.exchangeName));
        break;
      case 'makerFee':
        filtered.sort((a, b) => a.makerFee - b.makerFee);
        break;
      case 'takerFee':
        filtered.sort((a, b) => a.takerFee - b.takerFee);
        break;
      case 'volume':
        filtered.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'trustScore':
        filtered.sort((a, b) => b.trustScore - a.trustScore);
        break;
      case 'rank':
      default:
        // Keep original order (already sorted by rank from API)
        break;
    }

    return filtered;
  }, [exchanges, searchQuery, sortBy]);

  const displayedExchanges = useMemo(() => {
    return filteredAndSorted.slice(0, showCount);
  }, [filteredAndSorted, showCount]);

  const hasMore = filteredAndSorted.length > showCount;

  const reset = () => {
    setSearchQuery('');
    setSortBy('rank');
    setShowCount(20);
  };

  const loadMore = () => {
    setShowCount(prev => Math.min(prev + 20, filteredAndSorted.length));
  };

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    displayedExchanges,
    totalCount: filteredAndSorted.length,
    hasMore,
    loadMore,
    reset,
  };
}

export function useDEXFilters(dexes: DEXFees[] | undefined) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'swapFee' | 'volume' | 'liquidity'>('volume');
  const [showCount, setShowCount] = useState(20);

  const filteredAndSorted = useMemo(() => {
    if (!dexes) return [];

    // Filter by search query
    let filtered = dexes.filter(dex =>
      dex.dexName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.dexName.localeCompare(b.dexName));
        break;
      case 'swapFee':
        filtered.sort((a, b) => a.swapFee - b.swapFee);
        break;
      case 'volume':
        filtered.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'liquidity':
        filtered.sort((a, b) => b.liquidityUSD - a.liquidityUSD);
        break;
      default:
        break;
    }

    return filtered;
  }, [dexes, searchQuery, sortBy]);

  const displayedDEXes = useMemo(() => {
    return filteredAndSorted.slice(0, showCount);
  }, [filteredAndSorted, showCount]);

  const hasMore = filteredAndSorted.length > showCount;

  const reset = () => {
    setSearchQuery('');
    setSortBy('volume');
    setShowCount(20);
  };

  const loadMore = () => {
    setShowCount(prev => Math.min(prev + 20, filteredAndSorted.length));
  };

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    displayedDEXes,
    totalCount: filteredAndSorted.length,
    hasMore,
    loadMore,
    reset,
  };
}
