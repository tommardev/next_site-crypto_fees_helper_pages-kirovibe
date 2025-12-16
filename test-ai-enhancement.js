/**
 * Test AI Enhancement
 * Simple script to test if Gemini AI is working
 */

require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    return;
  }

  console.log('✓ GEMINI_API_KEY found');

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const model = 'gemini-2.5-flash';
    
    const prompt = `Find the current SPOT TRADING maker and taker fees for Binance exchange. Return only JSON:
[
  {
    "exchangeId": "binance",
    "exchange_name": "Binance",
    "makerFee": 0.1,
    "takerFee": 0.1
  }
]`;

    console.log('🤖 Testing Gemini API...');
    
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });

    if (response && response.text) {
      console.log('✓ Gemini API response received');
      console.log('Response length:', response.text.length);
      console.log('Response preview:', response.text.substring(0, 200) + '...');
      
      // Try to parse JSON
      try {
        const cleanedText = response.text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        const parsed = JSON.parse(cleanedText);
        console.log('✓ JSON parsing successful');
        console.log('Parsed data:', JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError.message);
        console.log('Raw response:', response.text);
      }
    } else {
      console.error('❌ No response from Gemini API');
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
  }
}

testGeminiAPI();