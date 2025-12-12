# CryptoFees - Cryptocurrency Exchange Fee Comparison

Compare trading fees across centralized (CEX) and decentralized (DEX) cryptocurrency exchanges. Built with Next.js, TypeScript, and Chakra UI.

## Features

- 🤖 **AI-Powered Fee Data** - Uses Google Gemini AI to collect real trading fees
- 🔄 **Real-time Data** - Fetches live exchange data from multiple APIs
- 💰 **CEX & DEX Support** - Compare both centralized and decentralized exchanges
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support
- ⚡ **Fast Performance** - 24-hour caching for optimal speed
- 🔍 **Advanced Filtering** - Search, sort, and filter exchanges
- 📱 **Mobile Friendly** - Fully responsive design
- ♿ **Accessible** - WCAG 2.1 AA compliant

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **UI Library**: Chakra UI v2
- **Data Fetching**: SWR for client-side caching
- **Animations**: Framer Motion
- **API**: CoinGecko (free tier, no API key required)

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
1. Go to https://pro.coinmarketcap.com/signup
2. Sign up (free Basic plan)
3. Verify your email
4. Copy your API key from the dashboard

**Google Gemini** (required for AI-powered fee data):
1. Go to https://aistudio.google.com/
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

```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── exchange/        # Exchange-specific components
│   └── layout/          # Layout components
├── config/              # Configuration files
├── lib/
│   ├── api/            # API client functions
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── pages/
│   ├── api/            # API routes
│   ├── index.tsx       # CEX fees page
│   ├── dex.tsx         # DEX fees page
│   ├── about.tsx       # About page
│   └── contact.tsx     # Contact page
└── theme.tsx           # Chakra UI theme
```

## API Routes

- `GET /api/cex-fees` - Fetch centralized exchange fees
- `GET /api/dex-fees` - Fetch decentralized exchange fees

Both routes implement 24-hour caching to minimize API calls and improve performance.

## Data Sources

- **Google Gemini AI** - AI-powered real fee data collection for both CEX and DEX
- **CoinMarketCap API** - Exchange rankings, volumes, and metadata (requires free API key)
- **CoinGecko API** - Supplementary data for trust scores and metadata (free tier, no key required)
- **DeFiLlama API** - DEX liquidity and volume data

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Deploy!

### Netlify

```bash
npm run build
# Deploy the 'out' directory
```

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
  - Get free API key at: https://pro.coinmarketcap.com/signup
  - Free tier: 333 calls/day (perfect with 24-hour caching)
- `GEMINI_API_KEY` - **REQUIRED** for AI-powered fee data collection
  - Get free API key at: https://aistudio.google.com/
  - Free tier: 15 requests/minute, 1,500 requests/day

### Optional
- `NEXT_PUBLIC_SITE_URL` - Your site URL
- `COINGECKO_API_KEY` - CoinGecko API key for higher rate limits

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Data provided by [CoinGecko](https://www.coingecko.com)
- UI components by [Chakra UI](https://chakra-ui.com)
- Built with [Next.js](https://nextjs.org)

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact us at contact@cryptofees.com.
