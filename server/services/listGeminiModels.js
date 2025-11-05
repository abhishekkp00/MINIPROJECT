/**
 * List all available Gemini models for your API key
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAnhk5Tv3IhVukSeGjL8q4uoyKFcRoPUSU';

console.log('🔍 Listing available Gemini models...\n');
console.log('API Key:', apiKey.substring(0, 20) + '...\n');

const genAI = new GoogleGenerativeAI(apiKey);

try {
  // Try to list models using the SDK
  console.log('📋 Fetching available models from API...\n');
  
  // Make a direct API call to list models
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.models && data.models.length > 0) {
    console.log('✅ Available models:\n');
    
    data.models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    });
    
    // Find models that support generateContent
    const contentModels = data.models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );
    
    if (contentModels.length > 0) {
      console.log('✅ Models that support generateContent:');
      contentModels.forEach(m => {
        const modelId = m.name.replace('models/', '');
        console.log(`   - ${modelId}`);
      });
      
      // Try the first one
      console.log('\n🧪 Testing first available model...');
      const testModelId = contentModels[0].name.replace('models/', '');
      const testModel = genAI.getGenerativeModel({ model: testModelId });
      const result = await testModel.generateContent('Say "Hello, AI is working!"');
      const response = await result.response;
      console.log(`✅ Test successful! Response: ${response.text()}`);
      console.log(`\n💡 Use this model: ${testModelId}`);
    }
  } else {
    console.log('⚠️ No models found. This might mean:');
    console.log('1. The API key is invalid');
    console.log('2. The Generative AI API is not enabled');
    console.log('3. You need to wait a few minutes for API enablement to propagate');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n🔧 Troubleshooting steps:');
  console.error('1. Verify your API key is correct');
  console.error('2. Enable "Generative Language API" in Google Cloud Console:');
  console.error('   https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
  console.error('3. Create a new API key from Google AI Studio:');
  console.error('   https://aistudio.google.com/app/apikey');
  console.error('4. Wait 5-10 minutes after enabling the API');
}
