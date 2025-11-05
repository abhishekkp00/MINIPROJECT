/**
 * List available Gemini models for the API key
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAnhk5Tv3IhVukSeGjL8q4uoyKFcRoPUSU';

console.log('🔍 Checking Gemini API...\n');
console.log('API Key:', apiKey.substring(0, 20) + '...');

const genAI = new GoogleGenerativeAI(apiKey);

try {
  console.log('\n📋 Attempting to list models...');
  
  // Try gemini-1.5-flash instead
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
  
  for (const modelName of models) {
    try {
      console.log(`\n✓ Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "Hello"');
      const response = await result.response;
      const text = response.text();
      
      console.log(`  ✅ ${modelName} works! Response: ${text}`);
      break;
    } catch (error) {
      console.log(`  ❌ ${modelName} failed:`);
      console.log(`     Error: ${error.message}`);
      if (error.status) console.log(`     Status: ${error.status}`);
    }
  }
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\nPossible solutions:');
  console.error('1. Enable Gemini API in Google Cloud Console');
  console.error('2. Check if API key has correct permissions');
  console.error('3. Verify billing is enabled');
  console.error('4. Try generating a new API key from https://makersuite.google.com/app/apikey');
}
