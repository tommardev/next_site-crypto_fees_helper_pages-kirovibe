# 🔑 CoinMarketCap API Key Setup Guide

This guide will help you get your FREE CoinMarketCap API key to fetch real exchange fee data.

## Why Do I Need This?

CoinMarketCap provides **REAL maker and taker fee data** for cryptocurrency exchanges. Without this API key, the application cannot fetch exchange fee information.

## Step-by-Step Instructions

### 1. Sign Up for CoinMarketCap

1. Go to https://pro.coinmarketcap.com/signup
2. Fill in your details:
   - Email address
   - Password
   - Accept terms and conditions
3. Click **"Sign Up"**

### 2. Verify Your Email

1. Check your email inbox
2. Click the verification link from CoinMarketCap
3. Your account is now activated!

### 3. Get Your API Key

1. Log in to https://pro.coinmarketcap.com/account
2. Go to the **"API Keys"** section
3. You'll see your default API key already created
4. Click **"Copy"** to copy your API key

### 4. Add API Key to Your Project

#### For Local Development:

1. In your project root, copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Paste your API key:
   ```env
   COINMARKETCAP_API_KEY=paste_your_api_key_here
   ```

4. Save the file

5. Restart your development server:
   ```bash
   npm run dev
   ```

#### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add new variable:
   - **Name**: `COINMARKETCAP_API_KEY`
   - **Value**: Your API key
   - **Environment**: Select all (Production, Preview, Development)
4. Click **"Save"**
5. Redeploy your project

#### For Netlify Deployment:

1. Go to your Netlify site dashboard
2. Click **"Site settings"** → **"Environment variables"**
3. Click **"Add a variable"**
4. Add:
   - **Key**: `COINMARKETCAP_API_KEY`
   - **Value**: Your API key
   - **Scopes**: Check all boxes
5. Click **"Save"**
6. Trigger a new deploy

## Free Tier Limits

The FREE Basic plan includes:

- ✅ **333 API calls per day**
- ✅ **10,000 API calls per month**
- ✅ **Access to all endpoints**
- ✅ **No credit card required**

### Is This Enough?

**YES!** With 24-hour caching, the app makes only:
- **1 API call per day** (when cache expires)
- **~30 API calls per month**

You'll use less than 1% of your free quota! 🎉

## API Key Security

### ⚠️ Important Security Notes:

1. **Never commit your API key to Git**
   - The `.env.local` file is already in `.gitignore`
   - Never share your API key publicly

2. **Use environment variables**
   - Always use `process.env.COINMARKETCAP_API_KEY`
   - Never hardcode the key in your source code

3. **Regenerate if exposed**
   - If you accidentally expose your key, regenerate it immediately
   - Go to CoinMarketCap dashboard → API Keys → Regenerate

## Troubleshooting

### "API key not configured" Error

**Problem**: The app shows "COINMARKETCAP_API_KEY environment variable is required"

**Solution**:
1. Make sure `.env.local` file exists in project root
2. Check that the API key is correctly pasted (no extra spaces)
3. Restart your development server
4. Clear your browser cache

### "Invalid API Key" Error

**Problem**: API returns 401 Unauthorized

**Solution**:
1. Verify your email address on CoinMarketCap
2. Check that you copied the entire API key
3. Try regenerating your API key
4. Make sure there are no quotes around the key in `.env.local`

### "Rate Limit Exceeded" Error

**Problem**: You've exceeded the free tier limits

**Solution**:
1. Check your usage at https://pro.coinmarketcap.com/account
2. Wait 24 hours for the daily limit to reset
3. Consider upgrading to a paid plan if needed (unlikely with caching)

### API Key Not Working in Production

**Problem**: Works locally but not on Vercel/Netlify

**Solution**:
1. Double-check environment variables in hosting dashboard
2. Make sure you selected all environments (Production, Preview, etc.)
3. Redeploy your site after adding environment variables
4. Check deployment logs for errors

## Upgrading Your Plan (Optional)

If you need more API calls, CoinMarketCap offers paid plans:

- **Hobbyist**: $29/month - 10,000 calls/day
- **Startup**: $79/month - 30,000 calls/day
- **Standard**: $299/month - 100,000 calls/day

**Note**: With 24-hour caching, the free tier is more than sufficient for this application.

## Alternative: Using CoinGecko Only

If you prefer not to use CoinMarketCap, you can modify the code to use only CoinGecko. However, note that:

- ❌ CoinGecko doesn't provide maker/taker fee data
- ❌ You'll need to hardcode fee values
- ❌ Data won't be as accurate or up-to-date

CoinMarketCap is recommended for the best user experience.

## Support

### Need Help?

- **CoinMarketCap Support**: https://support.coinmarketcap.com
- **API Documentation**: https://coinmarketcap.com/api/documentation/v1/
- **Project Issues**: Open an issue on GitHub

### Useful Links

- CoinMarketCap Sign Up: https://pro.coinmarketcap.com/signup
- API Dashboard: https://pro.coinmarketcap.com/account
- API Documentation: https://coinmarketcap.com/api/documentation/v1/
- Rate Limits Info: https://coinmarketcap.com/api/pricing/

---

## ✅ Checklist

Before running the app, make sure:

- [ ] Signed up for CoinMarketCap account
- [ ] Verified email address
- [ ] Copied API key from dashboard
- [ ] Added API key to `.env.local` file
- [ ] Restarted development server
- [ ] Tested that exchange data loads

**You're all set!** 🎉 Your CryptoFees app is now ready to fetch real exchange fee data.
