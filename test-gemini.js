/**
 * Test script for Gemini AI integration
 * Run with: node test-gemini.js
 * 
 * Note: This requires transpilation for TypeScript imports
 * Better to test via API endpoints: curl http://localhost:3000/api/cex-fees
 */

// For testing, we'll create a simple API test instead
const https = require('https');
const http = require('http');

// Mock exchange data for testing
const mockCEXExchanges = [
  {
    exchangeId: 'binance',
    exchangeName: 'Binance',
    logo: '/logos/binance.png',
    makerFee: null,
    takerFee: null,
    withdrawalFees: {},
    depositFees: {},
    trustScore: 10,
    volume24h: 1000000000,
    yearEstablished: 2017,
    country: 'Malta',
    url: 'https://binance.com',
    lastUpdated: new Date().toISOString()
  },
  {
    exchangeId: 'coinbase',
    exchangeName: 'Coinbase',
    logo: '/logos/coinbase.png',
    makerFee: null,
    takerFee: null,
    withdrawalFees: {},
    depositFees: {},
    trustScore: 9,
    volume24h: 500000000,
    yearEstablished: 2012,
    country: 'United States',
    url: 'https://coinbase.com',
    lastUpdated: new Date().toISOString()
  }
];

const mockDEXExchanges = [
  {
    dexId: 'uniswap-v3',
    dexName: 'Uniswap V3',
    logo: '/logos/uniswap.png',
    protocol: 'AMM',
    blockchain: ['Ethereum'],
    swapFee: null,
    gasFeeEstimate: {},
    liquidityUSD: 2000000000,
    volume24h: 800000000,
    url: 'https://uniswap.org',
    lastUpdated: new Date().toISOString()
  }
];

async function testAPIEndpoints() {
  console.log('🧪 Testing Gemini AI Integration via API Endpoints...\n');

  // Check if development server is running
  console.log('ℹ️  Make sure your development server is running: npm run dev\n');

  const testEndpoint = (url, name) => {
    return new Promise((resolve) => {
      const request = http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            console.log(`✅ ${name} endpoint working`);
            console.log(`   - Status: ${res.statusCode}`);
            console.log(`   - Cached: ${parsed.cached}`);
            console.log(`   - Exchanges: ${parsed.data?.length || 0}`);
            
            if (parsed.data && parsed.data.length > 0) {
              const sample = parsed.data[0];
              const hasAIFees = sample.makerFee !== null || sample.takerFee !== null || sample.swapFee !== null;
              console.log(`   - AI Fees: ${hasAIFees ? '✅ Present' : '⚠️  Null (check GEMINI_API_KEY)'}`);
            }
            console.log('');
            resolve(true);
          } catch (error) {
            console.log(`❌ ${name} endpoint failed: ${error.message}\n`);
            resolve(false);
          }
        });
      }).on('error', (error) => {
        console.log(`❌ ${name} endpoint error: ${error.message}\n`);
        resolve(false);
      });
      
      request.setTimeout(10000, () => {
        console.log(`❌ ${name} endpoint timeout\n`);
        request.destroy();
        resolve(false);
      });
    });
  };

  try {
    console.log('📊 Testing CEX Fees API...');
    await testEndpoint('http://localhost:3000/api/cex-fees', 'CEX Fees');
    
    console.log('🔄 Testing DEX Fees API...');
    await testEndpoint('http://localhost:3000/api/dex-fees', 'DEX Fees');
    
    console.log('🎉 API endpoint testing completed!');
    console.log('\nℹ️  To test with real Gemini AI:');
    console.log('   1. Add GEMINI_API_KEY to .env.local');
    console.log('   2. Restart development server');
    console.log('   3. Clear cache by waiting 24 hours or restarting server');
    console.log('   4. Check API responses for non-null fee values');
    
  } catch (error) {
    console.error('\n❌ API testing failed:', error.message);
  }
}

// Run the test
testAPIEndpoints();