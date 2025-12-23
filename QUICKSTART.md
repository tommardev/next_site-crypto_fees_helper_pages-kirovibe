# 🚀 Quick Start Guide

Get your CryptoFees application running in 3 simple steps with AI-powered fee data collection!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Step 1: Get Required API Keys (FREE)

### CoinMarketCap API Key (Required)

1. Go to [CoinMarketCap Pro](https://pro.coinmarketcap.com/signup)
2. Sign up for a free account (Basic plan)
3. Verify your email
4. Go to API Keys section in dashboard
5. Copy your API key

**Why needed?** CoinMarketCap provides exchange rankings, volumes, and metadata.

### Google Gemini API Key (Required)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the API key

**Why needed?** Gemini AI collects REAL trading fees from official exchange sources.

## Step 2: Install Dependencies & Configure

```bash
# Install packages
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
COINMARKETCAP_API_KEY=paste_your_coinmarketcap_key_here
GEMINI_API_KEY=paste_your_gemini_key_here

# Optional: Configure cache duration (default: 72 hours)
CEX_CACHE_HOURS=72
DEX_CACHE_HOURS=72
```

## Step 3: Start Development Server

```bash
npm run dev
```

The application will start on **[http://localhost:3000](http://localhost:3000)**

## Step 4: Explore the Application

Open your browser and navigate to:

### 🏠 Main Pages

1. **CEX Fees** - [http://localhost:3000](http://localhost:3000)
   - View top 50 centralized exchanges with AI-powered fee data
   - Compare maker/taker fees collected by AI
   - Search and filter exchanges
   - Sort by various criteria
   - Progressive batch loading with background AI enhancement

2. **DEX Fees** - [http://localhost:3000/dex](http://localhost:3000/dex)
   - View top DEX protocols with AI-enhanced data
   - Compare swap fees and gas estimates
   - Multi-chain support info
   - Real-time AI processing status

3. **About** - [http://localhost:3000/about](http://localhost:3000/about)
   - Learn about the project
   - Understand fee types
   - View data sources

4. **Contact** - [http://localhost:3000/contact](http://localhost:3000/contact)
   - Get support information
   - Report issues
   - Feature requests

## 🎨 Features to Try

### AI-Powered Fee Data

1. Watch the "AI is collecting real fee data in the background..." status
2. See exchanges load progressively with batch processing
3. Notice fee data updates as AI enhancement completes
4. Check the cache monitor (development mode) for AI processing status

### Search & Filter

1. Use the search bar to find specific exchanges
2. Try different sort options (by fee, volume, trust score)
3. Click "Load More" to see additional exchanges progressively

### Dark Mode

- Click the moon/sun icon in the header
- Theme persists across page refreshes
- Follows system preferences by default

### Exchange Cards

- Hover over cards for smooth animations
- Click any card to visit the exchange's official website
- View trust scores, AI-collected fees, and volume at a glance

### Responsive Design

- Resize your browser window
- Test on mobile devices
- Check the mobile menu (hamburger icon)

## 📊 API Testing

### Test CEX API Endpoint

```bash
curl http://localhost:3000/api/cex-fees?batch=1&batchSize=20
```

### Test DEX API Endpoint

```bash
curl http://localhost:3000/api/dex-fees?batch=1&batchSize=20
```

### Test Cache Status

```bash
curl http://localhost:3000/api/cache-status
```

### Test AI Status

```bash
curl http://localhost:3000/api/ai-status
```

All endpoints return JSON with:

- `data`: Array of exchange/DEX information
- `cached`: Boolean indicating if data is from cache
- `cachedAt`: Timestamp of when data was cached
- `backgroundProcessing`: Boolean indicating if AI is enhancing data
- `batch`: Current batch number
- `totalBatches`: Total number of batches available

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Lint code
npm run lint
```

## 🎯 What's Working

✅ **Real API Data** - Live data from CoinMarketCap, CoinGecko, and DeFiLlama APIs

✅ **AI-Powered Fee Collection** - Google Gemini 2.5 Flash collects real trading fees

✅ **72-Hour Configurable Caching** - Optimized performance with background AI enhancement

✅ **Batch Processing** - Progressive loading with background data enhancement

✅ **Search & Filter** - Find exchanges quickly with real-time updates

✅ **Dark Mode** - Beautiful in any lighting with Chakra UI

✅ **Responsive** - Works on all devices with mobile-first design

✅ **Skeleton Loading** - Professional loading states with progress indicators

✅ **Error Handling** - Graceful error messages and circuit breaker protection

✅ **TypeScript** - Full type safety with comprehensive interfaces

✅ **AI Status Monitoring** - Real-time AI processing status and cache monitoring

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is busy, Next.js will automatically use the next available port (3001, 3002, etc.)

### API Rate Limiting

The free tier APIs have rate limits. The app implements:

- 72-hour configurable caching to minimize API calls
- Rate limiter (50 requests/minute for CoinGecko)
- Automatic retry with exponential backoff
- Circuit breaker protection for AI calls

### AI Enhancement Not Working

Check your Gemini API key:

1. Verify `GEMINI_API_KEY` is set in `.env.local`
2. Check the API key is valid at [Google AI Studio](https://aistudio.google.com/)
3. Monitor the console for AI processing logs
4. Check `/api/ai-status` endpoint for AI processing status

### TypeScript Errors

Run type checking:

```bash
npm run type-check
```

All types should be properly defined with 0 errors.

### Clear Cache

If you need to clear the API cache:

```bash
# Stop the server (Ctrl+C)
npm run dev

# Or use the clear cache API
curl -X POST http://localhost:3000/api/clear-cache
```

## 📝 Environment Variables (Complete Configuration)

Create a `.env.local` file for complete configuration:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# REQUIRED: CoinMarketCap API Key
COINMARKETCAP_API_KEY=your_coinmarketcap_key_here

# REQUIRED: Google Gemini API Key for AI fee collection
GEMINI_API_KEY=your_gemini_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: CoinGecko API Key (for higher rate limits)
COINGECKO_API_KEY=your_coingecko_key_here

# Cache Configuration (in hours)
CEX_CACHE_HOURS=72
DEX_CACHE_HOURS=72

# Optional: AI processing configuration
AI_BATCH_SIZE=10
AI_BATCH_DELAY=15000
AI_MAX_RETRIES=3
AI_CIRCUIT_BREAKER_DURATION=1800000
```

**Note**: Only CoinMarketCap and Gemini API keys are required. The app works with just these two keys.

## 🚀 Next Steps

1. **Monitor AI Processing** - Watch the console logs for AI enhancement progress
2. **Customize Cache Duration** - Adjust `CEX_CACHE_HOURS` and `DEX_CACHE_HOURS` in `.env.local`
3. **Customize Theme** - Edit `src/theme.tsx` for custom colors and styling
4. **Add More Data Sources** - Extend API integrations in `src/lib/api/`
5. **Enhance AI Prompts** - Improve fee collection accuracy in `src/lib/api/gemini.ts`
6. **Deploy with AI** - Push to Vercel or Netlify with environment variables configured

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Chakra UI Components](https://chakra-ui.com/docs/components) - Explore UI components
- [SWR Documentation](https://swr.vercel.app) - Data fetching and caching
- [Google Gemini AI](https://ai.google.dev/docs) - AI integration documentation
- [CoinMarketCap API](https://coinmarketcap.com/api/documentation/v1/) - Exchange data API
- [CoinGecko API](https://www.coingecko.com/en/api) - Cryptocurrency data API

## 🎉 You're Ready

Your CryptoFees application is now running with AI-powered fee data collection! The system will:

- Load exchange metadata immediately from CoinMarketCap/CoinGecko
- Start AI enhancement in the background using Google Gemini
- Update fee data progressively as AI processing completes
- Cache everything for 72 hours to minimize API costs
- Handle errors gracefully with circuit breaker protection

For detailed documentation, see:

- `README.md` - Full project documentation
- `.kiro/steering/` - Architecture guidelines and patterns
- `src/lib/api/gemini.ts` - AI integration implementation

---

**Need Help?** Check the Contact page or open an issue on GitHub.
