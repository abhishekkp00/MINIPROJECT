# AI API Endpoints Documentation

## Overview
AI-powered endpoints using Google Gemini to provide intelligent insights for project management.

**Base URL:** `/api/ai`  
**Authentication:** Required (JWT Bearer Token)

---

## 📋 Endpoints

### 1. **Analyze Project Chat**
Extract insights, action items, and decisions from chat messages.

```http
POST /api/ai/analyze-chat/:projectId
```

**Auth:** Required (Project Member)

**Parameters:**
- `projectId` (URL param) - Project ID to analyze

**Response:**
```json
{
  "success": true,
  "analysis": {
    "keyTopics": ["Authentication module", "API integration"],
    "actionItems": [
      {
        "task": "Implement JWT authentication",
        "owner": "Bob Smith",
        "dueDate": "2025-11-10"
      }
    ],
    "nextSteps": ["Finalize database schema", "Start coding"],
    "blockers": ["Database schema not finalized"],
    "decisions": ["Use JWT tokens for session management"],
    "messageCount": 50,
    "projectName": "E-Commerce Platform",
    "projectType": "web development",
    "timestamp": "2025-11-05T10:30:00.000Z"
  }
}
```

**Caching:** Results cached for 1 hour per project

**Cost:** ~500-800 tokens per request

---

### 2. **Suggest Task Deadline**
Get AI-powered deadline suggestions based on task complexity and team workload.

```http
POST /api/ai/suggest-deadline/:taskId
```

**Auth:** Required (Project Member)

**Parameters:**
- `taskId` (URL param) - Task ID

**Body:**
```json
{
  "currentWorkload": "Medium - 3 other tasks in progress"
}
```

**Response:**
```json
{
  "success": true,
  "suggestion": {
    "suggestedDeadline": "2025-11-19",
    "durationDays": 9,
    "reasoning": "Task requires JWT implementation with proper error handling. Database schema blocker expected to be resolved by Nov 6. Considering Bob's current workload of 3 tasks.",
    "riskFactors": [
      "Database schema delay",
      "Technical complexity of JWT refresh tokens",
      "Security considerations",
      "Testing requirements"
    ],
    "confidence": "Medium",
    "taskId": "6729a1b2c3d4e5f678901235",
    "taskTitle": "Implement User Authentication",
    "generatedAt": "2025-11-05T10:30:00.000Z"
  }
}
```

**Caching:** Results cached for 1 hour per task

**Cost:** ~600-900 tokens per request

---

### 3. **Analyze Member Participation**
Calculate activity scores and identify engagement patterns.

```http
POST /api/ai/analyze-participation/:projectId
```

**Auth:** Required (Project Owner Only)

**Parameters:**
- `projectId` (URL param) - Project ID

**Response:**
```json
{
  "success": true,
  "analytics": {
    "memberScores": [
      {
        "id": "user123",
        "name": "Alice Johnson",
        "score": 100,
        "level": "High"
      },
      {
        "id": "user456",
        "name": "Bob Smith",
        "score": 64,
        "level": "Medium"
      }
    ],
    "inactiveMembers": [
      {
        "id": "user789",
        "name": "Charlie Brown",
        "reason": "Minimal participation (1 message)"
      }
    ],
    "topContributors": ["Alice Johnson", "Bob Smith"],
    "engagementQuality": "Imbalanced - Alice dominant 50%",
    "recommendations": [
      "Solicit input from all members, especially Charlie",
      "Encourage quieter members to share first",
      "Rotate meeting facilitators",
      "Acknowledge all contributions"
    ],
    "projectName": "E-Commerce Platform",
    "totalMessages": 50,
    "analyzedAt": "2025-11-05T10:30:00.000Z"
  }
}
```

**Caching:** Results cached for 1 hour per project

**Cost:** ~700-1000 tokens per request

---

### 4. **Generate Project Summary**
Create comprehensive executive summary with sentiment analysis.

```http
POST /api/ai/generate-summary/:projectId
```

**Auth:** Required (Project Member)

**Parameters:**
- `projectId` (URL param) - Project ID

**Response:**
```json
{
  "success": true,
  "summary": {
    "executiveSummary": "E-Commerce Platform is actively progressing with React/Node.js stack. Team has completed 12 of 24 tasks (50%). Currently focused on authentication implementation with JWT tokens. Database schema finalization is blocking some work.",
    "keyDecisions": [
      "Use JWT tokens for session management",
      "Implement proper error handling across all endpoints"
    ],
    "completedItems": [
      "Initial project setup",
      "Database connection",
      "Basic CRUD operations"
    ],
    "inProgress": [
      "JWT authentication",
      "Database schema finalization"
    ],
    "upcomingMilestones": [
      "Authentication module completion",
      "Error handling integration",
      "Frontend-backend integration"
    ],
    "risksAndConcerns": [
      "Database schema blocker",
      "Team member workload distribution"
    ],
    "teamSentiment": "Positive",
    "projectId": "6729a1b2c3d4e5f678901234",
    "projectName": "E-Commerce Platform",
    "generatedAt": "2025-11-05T10:30:00.000Z"
  }
}
```

**Caching:** Results cached for 1 hour per project

**Cost:** ~800-1200 tokens per request

---

### 5. **Get AI Usage Statistics**
Monitor API usage, costs, and caching efficiency.

```http
GET /api/ai/stats
```

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalCalls": 15,
    "totalTokens": 12450,
    "estimatedCost": "$0.0009",
    "cacheHits": 8,
    "cacheMisses": 7,
    "cachedKeys": 5
  }
}
```

**Cost:** Free (no AI call)

---

### 6. **Test AI Service**
Verify Gemini API connectivity and service health.

```http
GET /api/ai/test
```

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "message": "Hello from Gemini 2.5 Flash!",
  "available": true
}
```

**Cost:** ~10-20 tokens per request

---

### 7. **Clear AI Cache**
Force refresh of all cached AI responses.

```http
POST /api/ai/clear-cache
```

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "message": "AI cache cleared successfully"
}
```

**Cost:** Free (no AI call)

---

## 🔐 Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

Get token from login endpoint:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 🛡️ Access Control

| Endpoint | Required Role |
|----------|---------------|
| Analyze Chat | Project Member |
| Suggest Deadline | Project Member |
| Analyze Participation | **Project Owner Only** |
| Generate Summary | Project Member |
| Get Stats | Any Authenticated User |
| Test Service | Any Authenticated User |
| Clear Cache | Any Authenticated User |

---

## 💰 Cost & Performance

### Pricing (Gemini 2.5 Flash)
- **Cost:** $0.075 per 1 million tokens
- **Average request:** 500-1000 tokens
- **Estimated cost per request:** $0.00004 - $0.00008

### Caching
- **Cache Duration:** 1 hour (3600 seconds)
- **Cache Strategy:** Per-function, per-resource
- **Benefit:** 100% cost reduction for cached requests

### Example Costs
```
100 chat analyses = $0.006 - $0.008
1000 deadline suggestions = $0.06 - $0.08
10,000 requests = $0.60 - $0.80
```

---

## ⚠️ Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Not authorized, token failed"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Access denied. You are not a member of this project."
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Project not found"
}
```

**400 Bad Request**
```json
{
  "success": false,
  "error": "No messages found to analyze. Start chatting first!"
}
```

**500 Server Error**
```json
{
  "success": false,
  "error": "Failed to analyze chat messages"
}
```

---

## 🧪 Testing

### Using cURL

**1. Login to get token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**2. Test AI service:**
```bash
curl -X GET http://localhost:5000/api/ai/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Analyze chat:**
```bash
curl -X POST http://localhost:5000/api/ai/analyze-chat/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Using the Test Script

```bash
cd server
node tests/testAIEndpoints.js
```

---

## 📊 Usage Examples

### Frontend Integration

```javascript
// React component
import { useState } from 'react';

const ProjectInsights = ({ projectId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeChat = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/analyze-chat/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to analyze chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={analyzeChat} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Project Chat'}
      </button>
      
      {analysis && (
        <div>
          <h3>Key Topics</h3>
          <ul>
            {analysis.keyTopics.map((topic, i) => (
              <li key={i}>{topic}</li>
            ))}
          </ul>
          
          <h3>Action Items</h3>
          <ul>
            {analysis.actionItems.map((item, i) => (
              <li key={i}>
                {item.task} - {item.owner} - Due: {item.dueDate}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## 🔧 Configuration

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NODE_ENV=development
PORT=5000
```

### Cache Settings

Edit `server/services/aiService.js` to adjust cache duration:

```javascript
const cache = new NodeCache({
  stdTTL: 3600,      // 1 hour (change this)
  checkperiod: 120   // Check every 2 minutes
});
```

---

## 🚀 Next Steps

1. **Get Gemini API Key:** https://aistudio.google.com/app/apikey
2. **Add to .env:** `GEMINI_API_KEY=your_key_here`
3. **Start server:** `npm run dev`
4. **Test endpoints:** Use Postman or test script
5. **Integrate in frontend:** Use fetch/axios in React components

---

## 📚 Related Documentation

- [Gemini AI Setup Guide](../GEMINI_AI_SETUP.md)
- [AI Service Source](../services/aiService.js)
- [Test Suite](../services/testAIService.js)
- [Google Gemini Docs](https://ai.google.dev/docs)

---

**Created:** November 5, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
