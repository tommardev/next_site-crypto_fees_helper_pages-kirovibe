# 🚀 Deployment Guide

Complete guide for deploying CryptoFees to production.

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] TypeScript compilation passes (`npm run type-check`)
- [x] Production build succeeds (`npm run build`)
- [x] No console errors in browser
- [x] All pages load correctly
- [x] API routes return valid data

### ✅ Configuration
- [x] `next.config.js` configured
- [x] Environment variables documented
- [x] `.gitignore` includes sensitive files
- [x] README.md updated

### ✅ Testing
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Test dark mode
- [ ] Test all navigation links
- [ ] Test API endpoints
- [ ] Test error states

## Deployment Options

### Option 1: Vercel (Recommended) ⭐

Vercel is the easiest option as it's made by the Next.js team.

#### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/cryptofees.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js settings

3. **Configure Environment Variables** (REQUIRED)
   - Add `COINMARKETCAP_API_KEY` (REQUIRED) - Your CoinMarketCap API key
   - Add `NEXT_PUBLIC_SITE_URL` with your production URL
   - Optional: Add `NEXT_PUBLIC_COINGECKO_API_KEY` for supplementary data

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site is live! 🎉

#### Vercel Features:
- ✅ Automatic deployments on git push
- ✅ Preview deployments for PRs
- ✅ Edge caching (CDN)
- ✅ Serverless functions for API routes
- ✅ Free SSL certificate
- ✅ Custom domain support

### Option 2: Netlify

#### Steps:

1. **Push to GitHub** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Netlify auto-detects Next.js settings

3. **Configure Environment Variables** (REQUIRED)
   - Go to **Site settings** → **Environment variables**
   - Click **Add a variable**
   - Add these variables:
     - **Key**: `COINMARKETCAP_API_KEY` (REQUIRED)
     - **Value**: Your CoinMarketCap API key
     - **Scopes**: Check all (Production, Deploy Previews, Branch deploys)
   - Click **Save**

4. **Deploy**
   - Trigger a new deploy or wait for automatic deployment
   - Your site will be live in 2-3 minutes! 🎉

#### Netlify Features:
- ✅ Continuous deployment
- ✅ Environment variable management
- ✅ Deploy previews for PRs
- ✅ Free SSL certificate
- ✅ Custom domain support

#### ⚠️ Important for Netlify:
The `COINMARKETCAP_API_KEY` is **REQUIRED**. Without it, exchange fee data cannot be fetched and the site will show an error.

### Option 3: Static Export

For static hosting (GitHub Pages, AWS S3, etc.)

#### Steps:

1. **Update `next.config.js`**
   ```javascript
   module.exports = {
     output: 'export',
     images: {
       unoptimized: true,
     },
     trailingSlash: true,
   };
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy the `out/` directory**
   - Upload to your static host
   - Configure to serve `index.html` for routes

#### ⚠️ Limitations:
- API routes won't work (need to use external API or build-time data)
- No server-side rendering
- No dynamic routes

### Option 4: Docker

#### Dockerfile:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run:
```bash
docker build -t cryptofees .
docker run -p 3000:3000 cryptofees
```

## Environment Variables

### Production Environment Variables

Create these in your hosting platform:

```env
# REQUIRED - CoinMarketCap API Key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# Required
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional - For supplementary data
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_api_key_here

# Optional - For persistent caching
REDIS_URL=your_redis_url
VERCEL_KV_URL=your_vercel_kv_url
```

### Getting API Keys

#### CoinMarketCap API Key (REQUIRED) ⭐
1. Go to https://pro.coinmarketcap.com/signup
2. Sign up for **FREE** Basic plan
3. Verify your email
4. Go to API Keys section in dashboard
5. Copy your API key
6. Add to environment variables in your hosting platform

**Free Tier Limits**:
- 333 calls per day
- 10,000 calls per month
- Perfect for this app with 24-hour caching

**Why Required?** CoinMarketCap provides REAL maker/taker fee data for exchanges, unlike other APIs.

#### CoinGecko API Key (Optional)
1. Go to [CoinGecko API](https://www.coingecko.com/en/api)
2. Sign up for free account
3. Get your API key
4. Add to environment variables

**Note**: CoinGecko is optional and used for supplementary data like trust scores.

## Post-Deployment

### 1. Verify Deployment

Check these URLs work:
- ✅ Homepage: `https://yourdomain.com`
- ✅ DEX page: `https://yourdomain.com/dex`
- ✅ About page: `https://yourdomain.com/about`
- ✅ Contact page: `https://yourdomain.com/contact`
- ✅ API: `https://yourdomain.com/api/cex-fees`

### 2. Test Functionality

- [ ] Exchange data loads
- [ ] Search works
- [ ] Filters work
- [ ] Dark mode toggles
- [ ] Mobile menu works
- [ ] Links open correctly

### 3. Performance Check

Use [PageSpeed Insights](https://pagespeed.web.dev/):
- Target: 90+ score
- Check mobile and desktop
- Verify Core Web Vitals

### 4. SEO Check

- [ ] Meta tags present
- [ ] Open Graph tags work
- [ ] Twitter cards work
- [ ] Sitemap generated (optional)
- [ ] robots.txt configured (optional)

## Custom Domain

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

### Netlify
1. Go to Domain Settings
2. Add custom domain
3. Update DNS records
4. Enable HTTPS (automatic)

## Monitoring

### Recommended Tools

1. **Vercel Analytics** (if using Vercel)
   - Built-in performance monitoring
   - Real user metrics

2. **Google Analytics**
   - Add tracking code to `_document.tsx`
   - Track user behavior

3. **Sentry** (Error Tracking)
   - Catch runtime errors
   - Monitor API failures

4. **Uptime Monitoring**
   - UptimeRobot (free)
   - Pingdom
   - StatusCake

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run type-check
```

## Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run type-check`
- Check for missing dependencies
- Verify Node.js version (18+)

### API Routes Not Working
- Ensure not using static export
- Check API route paths
- Verify environment variables

### Images Not Loading
- Check `next.config.js` image configuration
- Verify image URLs are accessible
- Check CORS settings

### Slow Performance
- Enable caching headers
- Use CDN (Vercel/Netlify provide this)
- Optimize images
- Check API response times

## Scaling

### If You Get High Traffic

1. **Enable Redis Caching**
   - Use Vercel KV or external Redis
   - Persist cache across serverless functions

2. **Upgrade API Tier**
   - Get CoinGecko Pro API key
   - Higher rate limits

3. **Add CDN**
   - Cloudflare (free tier available)
   - Cache static assets

4. **Database for Analytics**
   - Track popular exchanges
   - Store historical data

## Security

### Best Practices

- ✅ Never commit `.env.local`
- ✅ Use environment variables for secrets
- ✅ Keep dependencies updated
- ✅ Enable HTTPS (automatic on Vercel/Netlify)
- ✅ Set proper CORS headers
- ✅ Rate limit API routes

### Security Headers

Add to `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ];
},
```

## Backup & Recovery

### What to Backup

- Source code (Git repository)
- Environment variables (document them)
- Custom configurations
- Database (if added later)

### Recovery Plan

1. Keep code in Git
2. Document all environment variables
3. Have deployment instructions
4. Test recovery process

## Cost Estimates

### Free Tier Options

- **Vercel**: Free for personal projects
- **Netlify**: 100GB bandwidth/month free
- **GitHub Pages**: Free for public repos
- **CoinGecko API**: Free tier (50 calls/min)

### Paid Options (if needed)

- **Vercel Pro**: $20/month (team features)
- **CoinGecko Pro**: $129/month (higher limits)
- **Redis Cloud**: $5/month (persistent cache)

## Support

### Getting Help

- Check documentation: `README.md`, `PROJECT_SUMMARY.md`
- Review steering files: `.kiro/steering/`
- Open GitHub issue
- Contact: contact@cryptofees.com

---

## 🎉 Ready to Deploy!

Choose your deployment method and follow the steps above. Your CryptoFees application will be live in minutes!

**Recommended**: Start with Vercel for the easiest deployment experience.
