# Google Gemini AI Service Setup Guide

## ✅ What's Been Created

The AI Service has been successfully created with the following features:

### 1. **Core AI Functions** (`server/services/aiService.js`)
- ✅ `analyzeChatMessages(messages, projectType)` - Extract topics, action items, next steps, blockers, and decisions
- ✅ `generateDeadlineSuggestion(taskData, chatHistory)` - Suggest realistic deadlines with reasoning and risk factors
- ✅ `analyzeMemberParticipation(messages)` - Calculate activity scores, identify inactive members, top contributors
- ✅ `generateProjectSummary(projectData, messages)` - Create executive summary with decisions, milestones, and sentiment

### 2. **Enhanced Features**
- ✅ **Caching Mechanism** - NodeCache with 1-hour TTL to save API costs
- ✅ **Error Handling** - Comprehensive try-catch blocks with specific error messages
- ✅ **Cost Tracking** - Monitors API calls, tokens used, and estimated costs
- ✅ **Rate Limiting** - Built-in delays between calls to avoid hitting limits
- ✅ **Logging** - Detailed logging for all API operations

### 3. **Dependencies Installed**
```bash
✅ node-cache@5.1.2 - For caching AI responses
✅ @google/generative-ai - Google Gemini SDK (already installed)
```

### 4. **Test Suite** (`server/services/testAIService.js`)
- ✅ Complete test coverage for all 4 functions
- ✅ Sample data for realistic testing
- ✅ API usage statistics display
- ✅ Comprehensive error reporting

---

## ⚠️ API Key Setup Required

The Gemini API key in your `.env` file **exists** but **doesn't have access** to Gemini models yet.

### Current Status:
```
GEMINI_API_KEY=AIzaSyAnhk5Tv3IhVukSeGjL8q4uoyKFcRoPUSU
Status: ❌ API not enabled
```

### How to Enable Gemini API:

#### Option 1: Google AI Studio (Recommended - Free Tier Available)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Get API Key" or "Create API Key"
3. Select your Google Cloud project (or create a new one)
4. Enable the Gemini API for your project
5. Copy the new API key
6. Update `server/.env`:
   ```env
   GEMINI_API_KEY=your_new_api_key_here
   ```

#### Option 2: Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select or create a project
3. Enable billing (required for Gemini API)
4. Navigate to "APIs & Services" > "Enable APIs and Services"
5. Search for "Generative Language API" and enable it
6. Go to "Credentials" and create an API key
7. Update your `.env` file with the new key

### Free Tier Limits (as of Nov 2025):
- **gemini-1.5-flash**: 15 requests per minute, 1 million tokens per day
- **gemini-1.5-pro**: 2 requests per minute, 50 requests per day
- No credit card required for free tier

---

## 🧪 Testing the AI Service

Once you've enabled the API and updated the key:

### 1. Quick Test
```bash
cd server
node services/checkGeminiAPI.js
```
Expected output:
```
✅ gemini-1.5-flash works! Response: Hello
```

### 2. Full Test Suite
```bash
cd server
node services/testAIService.js
```
Expected output:
```
✅ Test 1: Analyzing Chat Messages - Success!
✅ Test 2: Generating Deadline Suggestion - Success!
✅ Test 3: Analyzing Member Participation - Success!
✅ Test 4: Generating Project Summary - Success!
Success Rate: 100.0%
```

### 3. Individual Function Test (in Node REPL or script)
```javascript
import dotenv from 'dotenv';
dotenv.config();

import aiService from './services/aiService.js';

// Test with sample data
const messages = [
  {
    _id: '1',
    sender: { id: 'user1', name: 'Alice' },
    text: 'We need to implement authentication',
    createdAt: new Date()
  }
];

const result = await aiService.analyzeChatMessages(messages, 'web development');
console.log(result);
```

---

## 📊 Using AI Functions in Your App

### In API Routes
```javascript
import aiService from '../services/aiService.js';

// Analyze chat endpoint
router.get('/api/chat/projects/:projectId/analyze', protect, async (req, res) => {
  try {
    const messages = await Message.find({ chat: chatId }).populate('sender');
    const analysis = await aiService.analyzeChatMessages(messages, 'web development');
    
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deadline suggestion endpoint
router.post('/api/tasks/:taskId/suggest-deadline', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    const chatHistory = await Message.find({ chat: task.project }).limit(20);
    
    const suggestion = await aiService.generateDeadlineSuggestion(task, chatHistory);
    
    res.json({ success: true, suggestion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Cost Management
```javascript
// Check API usage
const stats = aiService.getAPIStats();
console.log(`Total calls: ${stats.totalCalls}`);
console.log(`Total tokens: ${stats.totalTokens}`);
console.log(`Estimated cost: $${stats.estimatedCost}`);

// Clear cache to force fresh AI responses
aiService.clearCache();
```

---

## 🎯 Next Steps

1. **Enable Gemini API** using one of the methods above
2. **Update GEMINI_API_KEY** in `server/.env`
3. **Run tests** to verify everything works
4. **Create API endpoints** to expose AI functions to your frontend
5. **Add UI components** in React to trigger AI analysis

---

## 📁 Files Created

```
server/
├── services/
│   ├── aiService.js           # Main AI service with 4 functions ✅
│   ├── testAIService.js       # Comprehensive test suite ✅
│   ├── checkGeminiAPI.js      # API verification script ✅
│   └── aiService.js.backup    # Backup of original file ✅
└── package.json               # Updated with node-cache ✅
```

---

## 💡 Pro Tips

1. **Caching**: Responses are cached for 1 hour - identical requests won't use API calls
2. **Rate Limiting**: Add 2-second delays between test calls to avoid rate limits
3. **Error Handling**: All functions gracefully handle API failures
4. **Cost Tracking**: Monitor usage with `getAPIStats()` regularly
5. **Token Optimization**: Messages are limited to last 20-50 to reduce token usage

---

## 🐛 Troubleshooting

### "AI service not available"
→ Check if `GEMINI_API_KEY` is set in `.env`

### "models/gemini-pro is not found"
→ API not enabled - follow setup steps above

### "Rate limit exceeded"
→ Wait a minute or use caching more aggressively

### "Billing not enabled"
→ Enable billing in Google Cloud Console (free tier available)

---

**Status**: ✅ Code Complete | ⏳ API Setup Pending | 🧪 Ready to Test

Once you enable the Gemini API, all functions will work immediately!
