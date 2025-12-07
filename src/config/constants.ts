// Cache configuration
export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const CACHE_DURATION_SECONDS = 86400; // 24 hours in seconds

// API configuration
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
export const COINGECKO_RATE_LIMIT = 50; // requests per minute
export const COINGECKO_RATE_WINDOW = 60000; // 1 minute in ms

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_EXCHANGES = 100;
export const INITIAL_DISPLAY_COUNT = 20;

// UI Constants
export const SKELETON_COUNT = 9;
export const GRID_COLUMNS = { base: 1, md: 2, lg: 3 };

// Sort options
export const SORT_OPTIONS = [
  { value: 'rank', label: 'Rank' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'makerFee', label: 'Maker Fee (Low to High)' },
  { value: 'takerFee', label: 'Taker Fee (Low to High)' },
  { value: 'volume', label: 'Volume (High to Low)' },
  { value: 'trustScore', label: 'Trust Score (High to Low)' },
] as const;

// Default values
export const DEFAULT_SORT = 'rank';
export const DEFAULT_TRUST_SCORE = 0;

// External links
export const GITHUB_URL = 'https://github.com';
export const TWITTER_URL = 'https://twitter.com';

// SEO
export const SITE_NAME = 'CryptoFees';
export const SITE_DESCRIPTION = 'Compare cryptocurrency exchange fees across CEX and DEX platforms';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptofees.com';
