# Gemini AI Integration Setup

## Overview

This project now uses Google's Gemini AI to collect real fee data for cryptocurrency exchanges. The AI analyzes exchange information and provides structured fee data that gets merged with exchange metadata from CoinMarketCap and CoinGecko.

## Setup Instructions

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the API key

### 2. Install Dependencies

The project uses the official Google GenAI SDK:
```bash
npm install @google/genai
```

### 3. Configure Environment Variables

Add your Gemini API key to `.env.local`:

```bash
# Google Gemini API Key (required for AI-powered fee data collection)
# Get your free API key at: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. How It Works

#### Data Flow:
1. **Fetch Exchange Metadata**: CoinMarketCap/CoinGecko provide exchange rankings, volumes, trust scores
2. **AI Fee Collection**: Gemini AI analyzes exchange list and returns real fee data in JSON format
3. **Data Merging**: AI-generated fees are merged with exchange metadata
4. **Caching**: Results cached for 24 hours to respect API limits

#### AI Configuration:
- **Model**: `gemini-2.5-flash` (official model name)
- **SDK**: `@google/genai` (official Google SDK)
- **Temperature**: 0.1 (low for consistent, factual responses)
- **CEX Prompt**: Requests maker/taker fees, withdrawal fees, deposit fees for centralized exchanges
- **DEX Prompt**: Requests swap fees and gas estimates for decentralized exchanges

## API Endpoints

### CEX Fees: `/api/cex-fees`
- Returns centralized exchange data with AI-generated fee information
- Includes maker/taker fees, withdrawal/deposit fees
- Falls back to null values if AI fails

### DEX Fees: `/api/dex-fees`  
- Returns decentralized exchange data with AI-generated fee information
- Includes swap fees and gas estimates by blockchain
- Falls back to null values if AI fails

## Rate Limits & Caching

### Gemini API Limits:
- **Free Tier**: 15 requests per minute, 1,500 requests per day
- **Caching Strategy**: 24-hour cache prevents excessive API calls
- **Graceful Degradation**: Falls back to null fees if AI fails

### Cost Optimization:
- Single AI call per exchange type (CEX/DEX) per day
- Batch processing of all exchanges in one request
- Cache results to minimize API usage

## Testing

### Test CEX Fees:
```bash
curl http://localhost:3000/api/cex-fees
```

### Test DEX Fees:
```bash
curl http://localhost:3000/api/dex-fees
```

### Expected Response:
```json
{
  "data": [
    {
      "exchangeId": "binance",
      "exchangeName": "Binance",
      "makerFee": 0.1,
      "takerFee": 0.1,
      "withdrawalFees": {
        "BTC": 0.0005,
        "ETH": 0.005,
        "USDT": 1.0
      },
      "depositFees": {
        "BTC": 0,
        "ETH": 0,
        "USDT": 0
      }
    }
  ],
  "cached": false,
  "cachedAt": "2024-12-13T..."
}
```

## Error Handling

### Common Issues:

1. **Missing API Key**:
   ```
   Error: GEMINI_API_KEY environment variable is required
   ```
   **Solution**: Add API key to `.env.local`

2. **API Rate Limited**:
   ```
   Error: Gemini API error: 429 - Too Many Requests
   ```
   **Solution**: Wait for rate limit reset, data will use cache

3. **Invalid JSON Response**:
   ```
   Error: Failed to parse AI response as JSON
   ```
   **Solution**: AI response parsing failed, falls back to null fees

### Graceful Degradation:
- If Gemini API fails, exchanges still display with null fee values
- Cache prevents repeated failures within 24-hour window
- Console logs provide debugging information

## Development

### Local Testing:
```bash
npm run dev
```

### Build Testing:
```bash
npm run build
npm start
```

### Environment Check:
The API will log warnings if `GEMINI_API_KEY` is not configured, but the application will still function with placeholder fee data.

## Production Deployment

### Vercel:
1. Add `GEMINI_API_KEY` to Vercel environment variables
2. Deploy normally - static export works with API routes

### Other Platforms:
Ensure `GEMINI_API_KEY` environment variable is set in your deployment platform.

## Monitoring

### Success Indicators:
- Console logs: "Successfully fetched AI fee data for X exchanges"
- API responses include non-null fee values
- Cache hit/miss logged in API responses

### Failure Indicators:
- Console errors: "Error fetching fees from AI"
- All fee values remain null
- API key configuration warnings

## Future Improvements

1. **Retry Logic**: Implement exponential backoff for failed AI requests
2. **Selective Updates**: Only request AI data for exchanges with missing fees
3. **Fee History**: Track fee changes over time
4. **Multiple AI Models**: Compare results from different AI providers