#!/bin/bash

# AI Endpoints Test Script
# Simple curl-based testing for AI routes

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║       AI ENDPOINTS TEST (cURL)                 ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000"
TOKEN=""
PROJECT_ID=""
TASK_ID=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check server health
echo -e "${BLUE}📡 Test 1: Server Health Check${NC}"
echo "──────────────────────────────────────────────────"
HEALTH=$(curl -s -w "\n%{http_code}" "$API_URL/api/health")
HTTP_CODE=$(echo "$HEALTH" | tail -n1)
RESPONSE=$(echo "$HEALTH" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Server is running${NC}"
    echo "   Response: $(echo $RESPONSE | jq -r '.message' 2>/dev/null || echo $RESPONSE)"
else
    echo -e "${RED}❌ Server is not responding${NC}"
    echo "   HTTP Code: $HTTP_CODE"
    exit 1
fi
echo ""

# Test 2: Login (you need to update credentials)
echo -e "${BLUE}📝 Test 2: User Login${NC}"
echo "──────────────────────────────────────────────────"
echo -e "${YELLOW}⚠️  You need to update TEST_EMAIL and TEST_PASSWORD below${NC}"
echo ""

# UPDATE THESE WITH YOUR ACTUAL TEST USER CREDENTIALS
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    TOKEN=$(echo "$RESPONSE" | jq -r '.token')
    USER_NAME=$(echo "$RESPONSE" | jq -r '.user.name')
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "   User: $USER_NAME"
    echo "   Token: ${TOKEN:0:30}..."
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ Login failed - Invalid credentials${NC}"
    echo "   Update TEST_EMAIL and TEST_PASSWORD in this script"
    exit 1
else
    echo -e "${RED}❌ Login failed - Server error or MongoDB not connected${NC}"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 3: AI Service Test
echo -e "${BLUE}🤖 Test 3: AI Service Availability${NC}"
echo "──────────────────────────────────────────────────"
AI_TEST=$(curl -s -w "\n%{http_code}" "$API_URL/api/ai/test" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$AI_TEST" | tail -n1)
RESPONSE=$(echo "$AI_TEST" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    AVAILABLE=$(echo "$RESPONSE" | jq -r '.available')
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
    echo -e "${GREEN}✅ AI Service is available${NC}"
    echo "   Status: $AVAILABLE"
    echo "   Message: $MESSAGE"
else
    echo -e "${RED}❌ AI Service test failed${NC}"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 4: AI Usage Statistics
echo -e "${BLUE}📊 Test 4: AI Usage Statistics${NC}"
echo "──────────────────────────────────────────────────"
STATS=$(curl -s -w "\n%{http_code}" "$API_URL/api/ai/stats" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$STATS" | tail -n1)
RESPONSE=$(echo "$STATS" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Stats retrieved successfully${NC}"
    echo "$RESPONSE" | jq '.stats' 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${RED}❌ Failed to get stats${NC}"
    echo "   HTTP Code: $HTTP_CODE"
fi
echo ""

# Test 5: Analyze Chat (requires project ID)
echo -e "${BLUE}💬 Test 5: Analyze Project Chat${NC}"
echo "──────────────────────────────────────────────────"
echo -e "${YELLOW}⚠️  Skipped - Requires PROJECT_ID${NC}"
echo "   To test manually:"
echo "   curl -X POST $API_URL/api/ai/analyze-chat/YOUR_PROJECT_ID \\"
echo "     -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     -H \"Content-Type: application/json\""
echo ""

# Test 6: Suggest Deadline (requires task ID)
echo -e "${BLUE}📅 Test 6: Suggest Task Deadline${NC}"
echo "──────────────────────────────────────────────────"
echo -e "${YELLOW}⚠️  Skipped - Requires TASK_ID${NC}"
echo "   To test manually:"
echo "   curl -X POST $API_URL/api/ai/suggest-deadline/YOUR_TASK_ID \\"
echo "     -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"currentWorkload\":\"Medium\"}'"
echo ""

# Test 7: Clear Cache
echo -e "${BLUE}🗑️  Test 7: Clear AI Cache${NC}"
echo "──────────────────────────────────────────────────"
CLEAR=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/ai/clear-cache" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$CLEAR" | tail -n1)
RESPONSE=$(echo "$CLEAR" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Cache cleared successfully${NC}"
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "$RESPONSE")
    echo "   $MESSAGE"
else
    echo -e "${RED}❌ Failed to clear cache${NC}"
    echo "   HTTP Code: $HTTP_CODE"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════╗"
echo "║            TEST SUMMARY                        ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Basic tests completed${NC}"
echo ""
echo "📝 Next Steps:"
echo "   1. Create a project and get PROJECT_ID"
echo "   2. Create a task and get TASK_ID"
echo "   3. Send some chat messages in the project"
echo "   4. Then test the AI analysis endpoints:"
echo ""
echo "      # Analyze chat"
echo "      curl -X POST $API_URL/api/ai/analyze-chat/PROJECT_ID \\"
echo "        -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "      # Suggest deadline"
echo "      curl -X POST $API_URL/api/ai/suggest-deadline/TASK_ID \\"
echo "        -H \"Authorization: Bearer $TOKEN\" \\"
echo "        -d '{\"currentWorkload\":\"Medium\"}'"
echo ""
echo "      # Analyze participation (owner only)"
echo "      curl -X POST $API_URL/api/ai/analyze-participation/PROJECT_ID \\"
echo "        -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "      # Generate summary"
echo "      curl -X POST $API_URL/api/ai/generate-summary/PROJECT_ID \\"
echo "        -H \"Authorization: Bearer $TOKEN\""
echo ""
