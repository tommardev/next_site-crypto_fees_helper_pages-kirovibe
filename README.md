# CryptoFees - Cryptocurrency Exchange Fee Comparison

Compare trading fees across centralized (CEX) and decentralized (DEX) cryptocurrency exchanges with AI-powered real fee data collection. Built with Next.js, TypeScript, and Chakra UI.

## Features

- 🤖 **AI-Powered Fee Data** - Uses Google Gemini 2.5 Flash to collect real trading fees from official sources
- 🔄 **Multi-Source Data** - CoinMarketCap (rankings), CoinGecko (trust scores), DeFiLlama (DEX data)
- 💰 **CEX & DEX Support** - Compare both centralized and decentralized exchanges
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support
- ⚡ **Smart Caching** - 72-hour configurable caching with background AI enhancement
- 🔍 **Advanced Filtering** - Search, sort, and filter exchanges with real-time updates
- 📊 **Batch Loading** - Progressive loading with background data enhancement
- 📱 **Mobile Friendly** - Fully responsive design
- ♿ **Accessible** - WCAG 2.1 AA compliant

## Tech Stack

- **Framework**: Next.js 16+ with TypeScript
- **UI Library**: Chakra UI v2+ with built-in dark mode
- **Data Fetching**: SWR with configurable caching
- **AI Integration**: Google Gemini 2.5 Flash via @google/genai
- **Animations**: Framer Motion
- **APIs**: CoinMarketCap, CoinGecko, DeFiLlama, Google Gemini AI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cryptofees.git
cd cryptofees
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file and add your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
COINMARKETCAP_API_KEY=your_coinmarketcap_key_here
GEMINI_API_KEY=your_gemini_key_here
```

**Get your FREE API keys**:

**CoinMarketCap** (required for exchange metadata):

1. Go to [CoinMarketCap Pro](https://pro.coinmarketcap.com/signup)
2. Sign up (free Basic plan)
3. Verify your email
4. Copy your API key from the dashboard

**Google Gemini** (required for AI-powered fee data):

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the API key

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```text
src/
├── components/
│   ├── common/          # Reusable components (ErrorBoundary, CacheMonitor, FeeDataStatus)
│   ├── exchange/        # Exchange-specific components (ExchangeCard, DEXCard, Grids, Filters)
│   └── layout/          # Layout components (Header, Footer, Layout)
├── config/
│   └── constants.ts     # App constants with configurable cache durations
├── lib/
│   ├── api/            # API client functions (coinmarketcap.ts, coingecko.ts, gemini.ts)
│   ├── hooks/          # Custom React hooks (useExchangeFees.ts, useFilters.ts)
│   ├── types/          # TypeScript interfaces (exchange.ts, api.ts)
│   └── utils/          # Utility functions (normalize.ts, cache-optimizer.ts)
├── pages/
│   ├── api/            # API routes with batch processing and AI enhancement
│   │   ├── cex-fees.ts         # CEX API with AI enhancement
│   │   ├── dex-fees.ts         # DEX API with AI enhancement
│   │   ├── enhance-fees.ts     # Manual AI enhancement
│   │   ├── cex-fees-batch.ts   # Batch CEX processing
│   │   ├── dex-fees-batch.ts   # Batch DEX processing
│   │   ├── cache-status.ts     # Cache monitoring
│   │   └── ai-status.ts        # AI processing status
│   ├── index.tsx       # CEX fees page with batch loading
│   ├── dex.tsx         # DEX fees page with AI enhancement
│   ├── about.tsx       # About page
│   └── contact.tsx     # Contact page
└── theme.tsx           # Chakra UI theme configuration
```

## API Routes

- `GET /api/cex-fees` - Fetch centralized exchange fees with batch processing and AI enhancement
- `GET /api/dex-fees` - Fetch decentralized exchange fees with AI-powered data collection
- `GET /api/cex-fees-batch` - Batch processing for CEX data
- `GET /api/dex-fees-batch` - Batch processing for DEX data
- `POST /api/enhance-fees` - Manual AI enhancement trigger
- `GET /api/cache-status` - Cache and AI processing status monitoring
- `GET /api/ai-status` - AI processing status
- `POST /api/clear-cache` - Clear cached data

All routes implement 72-hour configurable caching with background AI enhancement to minimize API calls and provide real fee data.

## Data Sources & Architecture

### Data Flow

1. **API Routes** fetch metadata from CMC/CoinGecko (72-hour cache)
2. **AI Enhancement** uses Gemini to collect real fee data in background
3. **Batch Processing** handles large datasets with pagination
4. **Custom Hooks** use SWR for client-side caching with batch loading
5. **Components** consume hooks with loading/error states and real-time updates

### Data Sources

- **Google Gemini 2.5 Flash** - AI-powered real fee data collection for both CEX and DEX
- **CoinMarketCap API** - Exchange rankings, volumes, and metadata (requires free API key)
- **CoinGecko API** - Supplementary data for trust scores and metadata (free tier, no key required)
- **DeFiLlama API** - DEX liquidity and volume data (no key required)

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `COINMARKETCAP_API_KEY`
   - `GEMINI_API_KEY`
   - `CEX_CACHE_HOURS=72`
   - `DEX_CACHE_HOURS=72`
4. Deploy!

### Netlify

1. Build the project:

```bash
npm run build
```

2. Deploy the `out` directory to Netlify
3. Add environment variables in Netlify dashboard

### Static Export

For static hosting, update `next.config.js`:

```javascript
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};
```

Then build:

```bash
npm run build
```

Note: Static export disables API routes, so AI enhancement won't work.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

Required and optional environment variables (see `.env.local.example`):

### Required

- `COINMARKETCAP_API_KEY` - **REQUIRED** for exchange metadata and rankings
  - Get free API key at: [CoinMarketCap Pro](https://pro.coinmarketcap.com/signup)
  - Free tier: 333 calls/day (perfect with 72-hour caching)
- `GEMINI_API_KEY` - **REQUIRED** for AI-powered fee data collection
  - Get free API key at: [Google AI Studio](https://aistudio.google.com/)
  - Free tier: 15 requests/minute, 1,500 requests/day

### Optional

- `NEXT_PUBLIC_SITE_URL` - Your site URL
- `COINGECKO_API_KEY` - CoinGecko API key for higher rate limits
- `CEX_CACHE_HOURS` - CEX cache duration in hours (default: 72)
- `DEX_CACHE_HOURS` - DEX cache duration in hours (default: 72)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Data provided by [CoinGecko](https://www.coingecko.com)
- UI components by [Chakra UI](https://chakra-ui.com)
- Built with [Next.js](https://nextjs.org)

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact us at [contact@cryptofees.com](mailto:contact@cryptofees.com).