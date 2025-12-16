# Real Data Only Policy - MANDATORY

## Core Principle: Never Use Fake or Hardcoded Data - Use AI for Real Fee Collection

**CRITICAL: Always use real data from actual API endpoints. Use AI to collect real fee data. Never create fake, mock, or hardcoded data.**

## Strict Rules

### ✅ ALWAYS DO:
- **Verify API endpoints exist** before implementing
- **Test API responses** to confirm data structure
- **Use AI (Gemini) to collect real fee data** from official sources
- **Ask user for clarification** if API endpoint is unclear
- **Use null/undefined** for missing data until AI enhancement completes
- **Implement proper error handling** when real data is unavailable
- **Use placeholder text** like "Data not available" instead of fake names
- **Validate API responses** match expected interface structure
- **Implement background AI processing** with circuit breaker protection

### ❌ NEVER DO:
- Create fake exchange names, fees, or volumes
- Use hardcoded arrays of mock data
- Generate random numbers for fees or volumes
- Use placeholder names like "Exchange1", "TestCoin"
- Create fake URLs, logos, or contact information
- Use made-up API responses for testing
- Hardcode business logic with fake values
- Block main API response waiting for AI enhancement
- Skip circuit breaker protection for AI calls

## Acceptable Constants (ONLY)

### Configuration Values (OK):
```typescript
// App configuration - ACCEPTABLE
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_EXCHANGES = 100;
const DEFAULT_CURRENCY = 'USD';
const API_TIMEOUT = 30000; // 30 seconds

// UI constants - ACCEPTABLE
const BREAKPOINTS = { base: 1, md: 2, lg: 3 };
const COLORS = { primary: 'blue.500', error: 'red.500' };
```

### Static Content (OK):
```typescript
// Page content - ACCEPTABLE
const ABOUT_TEXT = "Compare cryptocurrency exchange fees...";
const CONTACT_EMAIL = "support@yourapp.com";
const FOOTER_LINKS = [{ name: "Privacy", url: "/privacy" }];
```

## Data Validation Requirements

### Before Using Any Data Source:
1. **Verify endpoint exists**: Test API call manually
2. **Check response structure**: Ensure it matches your interfaces
3. **Validate rate limits**: Confirm you can make required calls
4. **Test error scenarios**: Handle API failures gracefully
5. **Document data source**: Note where each field comes from

### API Integration Checklist:
- [ ] API endpoint tested and working
- [ ] Response structure documented
- [ ] Error handling implemented
- [ ] Rate limiting respected
- [ ] Cache strategy defined
- [ ] Fallback behavior for failures

## Implementation Patterns

### Correct Data Fetching:
```typescript
// CORRECT: Real API data with AI enhancement and proper error handling
export async function fetchExchangeFees() {
  try {
    const response = await fetch('/api/cex-fees?batch=1&batchSize=20');
    const data = await response.json();
    return {
      exchanges: data.data, // Real data from multiple APIs
      backgroundProcessing: data.backgroundProcessing, // AI enhancement status
      cached: data.cached
    };
  } catch (error) {
    return { exchanges: [], backgroundProcessing: false, cached: false }; // Empty array, not fake data
  }
}
```

### Correct Error States:
```typescript
// CORRECT: Show real error states
if (isLoading) return <Skeleton />;
if (error) return <ErrorAlert message="Failed to load exchange data" />;
if (!exchanges.length) return <Text>No exchanges found</Text>;
```

### WRONG Examples (NEVER DO):
```typescript
// WRONG: Fake hardcoded data
const FAKE_EXCHANGES = [
  { name: "Binance", fee: 0.1 }, // NEVER DO THIS
  { name: "Coinbase", fee: 0.5 }, // NEVER DO THIS
];

// WRONG: Made-up business logic
const calculateFee = (amount) => amount * 0.001; // NEVER hardcode rates

// WRONG: Fake API responses
const mockResponse = { exchanges: [...] }; // NEVER DO THIS
```

## When Data is Unavailable

### Proper Handling:
- **Use null/undefined**: `makerFee: null` until AI enhancement completes
- **Show "AI collecting data"**: Display AI processing status
- **Implement placeholders**: Use skeleton loaders with AI status
- **Ask for real source**: "Which API should I use for this data?"
- **Use AI to research**: Let Gemini AI collect real fee data from official sources

### Error Messages:
```typescript
// CORRECT: Honest error messages with AI context
"Exchange fee data is currently unavailable - AI enhancement in progress"
"API rate limit exceeded, please try again later"
"Unable to connect to data source"
"AI fee collection temporarily unavailable"

// WRONG: Fake success
"Showing sample data" // NEVER imply fake data is real
"Using estimated fees" // NEVER imply fake data is real
```

## Verification Process

### Before Implementing Any Feature:
1. **Identify data source**: "Where does this data come from?"
2. **Test API endpoint**: Make actual API calls
3. **Verify data structure**: Ensure response matches needs
4. **Plan error handling**: What happens when API fails?
5. **Ask if uncertain**: "Should I use CoinMarketCap API for this?"

### Code Review Checklist:
- [ ] No hardcoded exchange names or fees
- [ ] No fake URLs or contact information
- [ ] No made-up numbers in business logic
- [ ] All data comes from verified API sources
- [ ] Proper error handling for missing data
- [ ] Clear documentation of data sources

## Critical Enforcement

### Red Flags (STOP IMMEDIATELY):
- Any array with hardcoded business data
- Fake names, URLs, or contact information
- Random number generation for business values
- Mock API responses in production code
- Hardcoded fees, volumes, or exchange information

### When in Doubt:
- **STOP and ask**: "Which API endpoint should I use?"
- **Test first**: Verify API works before coding
- **Document source**: Note where each data field originates
- **Use placeholders**: Show "Loading..." or "Not available"

**REMEMBER: Real data builds trust. Fake data destroys credibility.**