/**
 * Quick test of gemini-2.5-flash model
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

console.log('🧪 Testing gemini-2.5-flash...\n');

try {
  // Try gemini-2.5-flash (stable version)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const result = await model.generateContent('Say "Hello from Gemini 2.5 Flash!"');
  const response = await result.response;
  const text = response.text();
  
  console.log('✅ SUCCESS! Model works!');
  console.log('Response:', text);
  console.log('\n💡 Use this model: gemini-2.5-flash');
  
} catch (error) {
  console.error('❌ Failed:', error.message);
  
  // Try gemini-flash-latest as fallback
  console.log('\n🔄 Trying gemini-flash-latest...');
  try {
    const model2 = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result2 = await model2.generateContent('Say "Hello from Gemini Flash Latest!"');
    const response2 = await result2.response;
    const text2 = response2.text();
    
    console.log('✅ SUCCESS! Model works!');
    console.log('Response:', text2);
    console.log('\n💡 Use this model: gemini-flash-latest');
  } catch (error2) {
    console.error('❌ Also failed:', error2.message);
  }
}
