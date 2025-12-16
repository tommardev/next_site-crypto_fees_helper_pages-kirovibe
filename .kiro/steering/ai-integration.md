---
inclusion: always
---

# AI Integration - MANDATORY

## Core Principle: AI-Powered Real Fee Data Collection

**Use Google Gemini AI to collect real trading fees from official exchange sources. Never block main API responses.**

## AI Architecture

### Background Processing Pattern

```typescript
// Global state management for AI processing
declare global {
  var cexAIProcessing: boolean;
  var geminiCircuitBreaker: { blocked: boolean; until: number } | null;
}

// Non-blocking AI enhancement
if (process.env.GEMINI_API_KEY && !global.cexAIProcessing && !isCircuitBreakerActive) {
  global.cexAIProcessing = true;
  enhanceWithAI(normalizedData).finally(() => {
    global.cexAIProcessing = false;
  });
}
```

### Batch Processing with Delays

```typescript
// Sequential batch processing to avoid API overload
const batchSize = 10;
const delayBetweenBatches = 15000; // 15 seconds

for (let i = 0; i < totalBatches; i++) {
  const batchExchanges = normalizedData.slice(batchStart, batchEnd);
  
  try {
    const aiFeesData = await fetchCEXFeesFromAI(batchExchanges);
    const enhancedBatch = mergeCEXFeeData(batchExchanges, aiFeesData);
    
    // Update cache incrementally
    global.cexCompleteCache.data.splice(batchStart, batchExchanges.length, ...enhancedBatch);
  } catch (error) {
    console.error(`Batch ${i + 1} failed:`, error.message);
  }
  
  // Wait between batches
  if (i < totalBatches - 1) {
    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
  }
}
```

## AI Prompt Engineering

### CEX Fee Collection Prompt

```typescript
function generateCEXPrompt(exchanges: CEXFees[]): string {
  const exchangeList = exchanges.map(ex => `| ${ex.exchangeId} | **${ex.exchangeName}** |`).join('\n');
  
  return `**Find and Retrieve** the current, *lowest-tier* SPOT TRADING maker and taker fees (as percentage) from official fee pages.

**List of Exchanges:**
| Exchange ID | Exchange Name |
${exchangeList}

**Required JSON Output:**
[
  {
    "exchangeId": "string",
    "exchange_name": "string", 
    "makerFee": number | null,
    "takerFee": number | null
  }
]`;
}
```

### DEX Fee Collection Prompt

```typescript
function generateDEXPrompt(dexes: DEXFees[]): string {
  return `Collect real swap fees and gas estimates for these DEXes:
${dexes.map(dex => `- ${dex.dexName} on ${dex.blockchain.join(', ')}`).join('\n')}

Return JSON with real fee data only, use null for unknown values.`;
}
```

## Error Handling & Circuit Breaker

### Retry Logic with Exponential Backoff

```typescript
async function fetchCEXFeesFromAI(exchanges: CEXFees[]): Promise<CEXFeeData[]> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const responseText = await callGeminiAPI(prompt);
      return parseGeminiJSON<CEXFeeData>(responseText);
    } catch (error) {
      // Don't retry on authentication errors
      if (error.message.includes('Invalid Gemini API key')) break;
      
      // Wait before retrying with exponential backoff
      if (attempt < maxRetries) {
        const waitTime = Math.pow(4, attempt) * 5000; // 20s, 80s, 320s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  return []; // Return empty on failure - don't break main API
}
```

### Circuit Breaker Protection

```typescript
// Check circuit breaker before AI calls
const isCircuitBreakerActive = global.geminiCircuitBreaker && 
  global.geminiCircuitBreaker.blocked && 
  Date.now() < global.geminiCircuitBreaker.until;

if (isCircuitBreakerActive) {
  console.log('Circuit breaker active - skipping AI enhancement');
  return;
}

// Activate circuit breaker on overload
if (error.message.includes('overloaded') || error.message.includes('503')) {
  global.geminiCircuitBreaker = {
    blocked: true,
    until: Date.now() + (30 * 60 * 1000) // Block for 30 minutes
  };
}
```

## Data Merging Patterns

### Safe AI Data Integration

```typescript
export function mergeCEXFeeData(exchanges: CEXFees[], aiData: CEXFeeData[]): CEXFees[] {
  const feeMap = new Map(aiData.map(fee => [fee.exchangeId, fee]));
  
  return exchanges.map(exchange => {
    const aiFeesData = feeMap.get(exchange.exchangeId);
    
    if (aiFeesData) {
      return {
        ...exchange,
        makerFee: aiFeesData.makerFee,
        takerFee: aiFeesData.takerFee,
        withdrawalFees: aiFeesData.withdrawalFees || {},
        depositFees: aiFeesData.depositFees || {},
        lastUpdated: new Date().toISOString(),
      };
    }
    
    return exchange; // Return unchanged if no AI data
  });
}
```

## Environment Configuration

### Required Environment Variables

```bash
# REQUIRED: Google Gemini API Key
GEMINI_API_KEY=your_gemini_key_here

# Optional: AI processing configuration
AI_BATCH_SIZE=10
AI_BATCH_DELAY=15000
AI_MAX_RETRIES=3
AI_CIRCUIT_BREAKER_DURATION=1800000  # 30 minutes
```

## UI Integration

### AI Status Display

```typescript
// Show AI processing status to users
export function FeeDataStatus({ backgroundProcessing, lastUpdated }: Props) {
  return (
    <Box>
      {backgroundProcessing && (
        <Alert status="info">
          <AlertIcon />
          AI is collecting real fee data in the background...
        </Alert>
      )}
      <Text fontSize="sm" color="gray.500">
        Last updated: {formatDistanceToNow(new Date(lastUpdated))} ago
      </Text>
    </Box>
  );
}
```

### Cache Monitoring

```typescript
export function CacheMonitor() {
  const { data: cacheStatus } = useSWR('/api/cache-status', fetcher);
  
  return (
    <VStack spacing={2}>
      <Badge colorScheme={cacheStatus?.aiProcessing ? 'yellow' : 'green'}>
        {cacheStatus?.aiProcessing ? 'AI Processing' : 'Ready'}
      </Badge>
      <Text fontSize="xs">
        Cache: {cacheStatus?.cacheAge}h old
      </Text>
    </VStack>
  );
}
```

## Critical Rules

### ✅ ALWAYS DO

- Use background AI processing (never block main API)
- Implement circuit breaker protection
- Use sequential batch processing with delays
- Return empty arrays on AI failure (graceful degradation)
- Merge AI data safely with existing data
- Show AI processing status to users
- Use exponential backoff for retries
- Parse AI responses safely with error handling

### ❌ NEVER DO

- Block main API response waiting for AI
- Skip circuit breaker protection
- Process all exchanges simultaneously (causes overload)
- Fail main API when AI fails
- Skip error handling in AI calls
- Expose AI processing details to end users
- Use AI for non-fee data (stick to metadata APIs)
- Skip validation of AI responses

**Remember: AI enhances real data collection but never replaces proper API architecture.**