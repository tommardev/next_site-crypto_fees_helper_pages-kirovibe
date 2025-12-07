# 🚀 Quick Start Guide

Get your CryptoFees application running in 3 simple steps!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Step 1: Get CoinMarketCap API Key (FREE)

1. Go to https://pro.coinmarketcap.com/signup
2. Sign up for a free account (Basic plan)
3. Verify your email
4. Go to API Keys section in dashboard
5. Copy your API key

**Why needed?** CoinMarketCap provides REAL maker/taker fee data for exchanges.

## Step 2: Install Dependencies & Configure

```bash
# Install packages
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local` and add your API key:
```env
COINMARKETCAP_API_KEY=paste_your_api_key_here
```

## Step 3: Start Development Server

```bash
npm run dev
```

The application will start on **http://localhost:3000**

## Step 3: Explore the Application

Open your browser and navigate to:

### 🏠 Main Pages

1. **CEX Fees** - http://localhost:3000
   - View top 100 centralized exchanges
   - Compare maker/taker fees
   - Search and filter exchanges
   - Sort by various criteria

2. **DEX Fees** - http://localhost:3000/dex
   - View top DEX protocols
   - Compare swap fees
   - See gas fee estimates
   - Multi-chain support info

3. **About** - http://localhost:3000/about
   - Learn about the project
   - Understand fee types
   - View data sources

4. **Contact** - http://localhost:3000/contact
   - Get support information
   - Report issues
   - Feature requests

## 🎨 Features to Try

### Search & Filter
1. Use the search bar to find specific exchanges
2. Try different sort options (by fee, volume, trust score)
3. Click "Load More" to see additional exchanges

### Dark Mode
- Click the moon/sun icon in the header
- Theme persists across page refreshes
- Follows system preferences by default

### Exchange Cards
- Hover over cards for smooth animations
- Click any card to visit the exchange's official website
- View trust scores, fees, and volume at a glance

### Responsive Design
- Resize your browser window
- Test on mobile devices
- Check the mobile menu (hamburger icon)

## 📊 API Testing

### Test CEX API Endpoint
```bash
curl http://localhost:3000/api/cex-fees
```

### Test DEX API Endpoint
```bash
curl http://localhost:3000/api/dex-fees
```

Both endpoints return JSON with:
- `data`: Array of exchange/DEX information
- `cached`: Boolean indicating if data is from cache
- `cachedAt`: Timestamp of when data was cached

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

✅ **Real API Data** - Live data from CoinGecko API
✅ **24-Hour Caching** - Optimized performance
✅ **Search & Filter** - Find exchanges quickly
✅ **Dark Mode** - Beautiful in any lighting
✅ **Responsive** - Works on all devices
✅ **Skeleton Loading** - Professional loading states
✅ **Error Handling** - Graceful error messages
✅ **TypeScript** - Full type safety

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy, Next.js will automatically use the next available port (3001, 3002, etc.)

### API Rate Limiting
The CoinGecko free tier has rate limits. The app implements:
- 24-hour caching to minimize API calls
- Rate limiter (50 requests/minute)
- Automatic retry with exponential backoff

### TypeScript Errors
Run type checking:
```bash
npm run type-check
```

All types should be properly defined with 0 errors.

### Clear Cache
If you need to clear the API cache, restart the development server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

## 📝 Environment Variables (Optional)

Create a `.env.local` file for optional configuration:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_COINGECKO_API_KEY=your_api_key_here
```

**Note**: API key is optional. The app works without it using the free tier.

## 🚀 Next Steps

1. **Customize Theme** - Edit `src/theme.tsx`
2. **Add More Exchanges** - Update `src/config/exchanges.ts`
3. **Enhance DEX Data** - Integrate The Graph Protocol
4. **Deploy** - Push to Vercel or Netlify

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Chakra UI Components](https://chakra-ui.com/docs/components)
- [SWR Documentation](https://swr.vercel.app)
- [CoinGecko API](https://www.coingecko.com/en/api)

## 🎉 You're Ready!

Your CryptoFees application is now running. Start exploring and customizing!

For detailed documentation, see:
- `README.md` - Full project documentation
- `PROJECT_SUMMARY.md` - Implementation details
- `.kiro/steering/` - Architecture guidelines

---

**Need Help?** Check the Contact page or open an issue on GitHub.
