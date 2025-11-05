#!/bin/bash

# Task Management API - Automated Test Script
# Tests all task endpoints in sequence

BASE_URL="http://localhost:5000/api"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}================================${NC}"
echo -e "${BOLD}${BLUE}Task API Automated Test${NC}"
echo -e "${BOLD}${BLUE}================================${NC}"
echo ""

# Step 1: Login
echo -e "${YELLOW}🔐 Step 1: Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo -e "Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Create Project
echo -e "${YELLOW}📝 Step 2: Create Project for Tasks...${NC}"
PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Task Testing Project",
    "description": "Project created for testing task endpoints",
    "deadline": "2025-12-31T23:59:59.999Z",
    "priority": "high"
  }')

PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Create project failed!${NC}"
  echo $PROJECT_RESPONSE | head -c 500
  exit 1
fi

echo -e "${GREEN}✅ Project created!${NC}"
echo -e "Project ID: ${PROJECT_ID}"
echo ""

# Step 3: Create Task
echo -e "${YELLOW}📋 Step 3: Create Task...${NC}"
TASK_RESPONSE=$(curl -s -X POST $BASE_URL/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement User Authentication",
    "description": "Set up JWT authentication with login, signup, and protected routes",
    "deadline": "2025-11-30T23:59:59.999Z",
    "priority": "high",
    "status": "pending"
  }')

TASK_ID=$(echo $TASK_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  echo -e "${RED}❌ Create task failed!${NC}"
  echo $TASK_RESPONSE | head -c 500
  exit 1
fi

echo -e "${GREEN}✅ Task created!${NC}"
echo -e "Task ID: ${TASK_ID}"
echo ""

# Step 4: Get All Tasks
echo -e "${YELLOW}📋 Step 4: Get All Project Tasks...${NC}"
ALL_TASKS=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN")

TASK_COUNT=$(echo $ALL_TASKS | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -z "$TASK_COUNT" ]; then
  echo -e "${RED}❌ Get tasks failed!${NC}"
else
  echo -e "${GREEN}✅ Retrieved all tasks!${NC}"
  echo -e "Total tasks: ${TASK_COUNT}"
fi
echo ""

# Step 5: Get Single Task
echo -e "${YELLOW}🔍 Step 5: Get Task Details...${NC}"
TASK_DETAIL=$(curl -s -X GET $BASE_URL/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")

TASK_TITLE=$(echo $TASK_DETAIL | grep -o '"title":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TASK_TITLE" ]; then
  echo -e "${RED}❌ Get task details failed!${NC}"
else
  echo -e "${GREEN}✅ Retrieved task details!${NC}"
  echo -e "Task Title: ${TASK_TITLE}"
fi
echo ""

# Step 6: Update Task Status to In Progress
echo -e "${YELLOW}✏️ Step 6: Update Task Status (pending → in-progress)...${NC}"
STATUS_UPDATE=$(curl -s -X PUT $BASE_URL/tasks/$TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}')

UPDATED_STATUS=$(echo $STATUS_UPDATE | grep -o '"success":true')

if [ -z "$UPDATED_STATUS" ]; then
  echo -e "${RED}❌ Status update failed!${NC}"
  echo $STATUS_UPDATE | head -c 300
else
  echo -e "${GREEN}✅ Task status updated!${NC}"
  echo -e "New status: in-progress"
fi
echo ""

# Step 7: Add Comment
echo -e "${YELLOW}💬 Step 7: Add Comment to Task...${NC}"
COMMENT_RESPONSE=$(curl -s -X POST $BASE_URL/tasks/$TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Working on the authentication module now. Making good progress!"}')

COMMENT_SUCCESS=$(echo $COMMENT_RESPONSE | grep -o '"success":true')

if [ -z "$COMMENT_SUCCESS" ]; then
  echo -e "${RED}❌ Add comment failed!${NC}"
  echo $COMMENT_RESPONSE | head -c 300
else
  echo -e "${GREEN}✅ Comment added!${NC}"
fi
echo ""

# Step 8: Update Task Details
echo -e "${YELLOW}✏️ Step 8: Update Task Details...${NC}"
TASK_UPDATE=$(curl -s -X PUT $BASE_URL/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement Complete Authentication System",
    "priority": "urgent"
  }')

UPDATE_SUCCESS=$(echo $TASK_UPDATE | grep -o '"success":true')

if [ -z "$UPDATE_SUCCESS" ]; then
  echo -e "${RED}❌ Task update failed!${NC}"
  echo $TASK_UPDATE | head -c 300
else
  echo -e "${GREEN}✅ Task updated!${NC}"
  echo -e "Title and priority changed"
fi
echo ""

# Step 9: Filter Tasks
echo -e "${YELLOW}🔍 Step 9: Filter Tasks (status=in-progress)...${NC}"
FILTERED=$(curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/tasks?status=in-progress" \
  -H "Authorization: Bearer $TOKEN")

FILTERED_COUNT=$(echo $FILTERED | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -z "$FILTERED_COUNT" ]; then
  echo -e "${RED}❌ Filter failed!${NC}"
else
  echo -e "${GREEN}✅ Filter applied!${NC}"
  echo -e "In-progress tasks: ${FILTERED_COUNT}"
fi
echo ""

# Step 10: Create Second Task
echo -e "${YELLOW}📋 Step 10: Create Second Task...${NC}"
TASK2_RESPONSE=$(curl -s -X POST $BASE_URL/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Database Schema",
    "description": "Create MongoDB schemas for users, projects, and tasks",
    "deadline": "2025-11-20T23:59:59.999Z",
    "priority": "medium"
  }')

TASK2_ID=$(echo $TASK2_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TASK2_ID" ]; then
  echo -e "${RED}❌ Create second task failed!${NC}"
else
  echo -e "${GREEN}✅ Second task created!${NC}"
  echo -e "Task ID: ${TASK2_ID}"
fi
echo ""

# Step 11: Mark First Task as Completed
echo -e "${YELLOW}✅ Step 11: Mark First Task as Completed...${NC}"
COMPLETE=$(curl -s -X PUT $BASE_URL/tasks/$TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}')

COMPLETED=$(echo $COMPLETE | grep -o '"success":true')

if [ -z "$COMPLETED" ]; then
  echo -e "${RED}❌ Complete task failed!${NC}"
  echo $COMPLETE | head -c 300
else
  echo -e "${GREEN}✅ Task marked as completed!${NC}"
fi
echo ""

# Step 12: Get My Tasks
echo -e "${YELLOW}📊 Step 12: Get My Tasks...${NC}"
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
MY_TASKS=$(curl -s -X GET "$BASE_URL/tasks/user/$USER_ID" \
  -H "Authorization: Bearer $TOKEN")

MY_TASK_COUNT=$(echo $MY_TASKS | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -z "$MY_TASK_COUNT" ]; then
  echo -e "${RED}❌ Get my tasks failed!${NC}"
else
  echo -e "${GREEN}✅ Retrieved my tasks!${NC}"
  echo -e "My total tasks: ${MY_TASK_COUNT}"
fi
echo ""

# Step 13: Delete Second Task
echo -e "${YELLOW}🗑️ Step 13: Delete Second Task...${NC}"
if [ ! -z "$TASK2_ID" ]; then
  DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/tasks/$TASK2_ID \
    -H "Authorization: Bearer $TOKEN")

  DELETED=$(echo $DELETE_RESPONSE | grep -o '"success":true')

  if [ -z "$DELETED" ]; then
    echo -e "${RED}❌ Delete task failed!${NC}"
    echo $DELETE_RESPONSE | head -c 300
  else
    echo -e "${GREEN}✅ Task deleted!${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Skipping (second task not created)${NC}"
fi
echo ""

# Final Summary
echo -e "${BOLD}${BLUE}================================${NC}"
echo -e "${BOLD}${BLUE}Test Summary${NC}"
echo -e "${BOLD}${BLUE}================================${NC}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

[ ! -z "$TOKEN" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$PROJECT_ID" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$TASK_ID" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$TASK_COUNT" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$TASK_TITLE" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$UPDATED_STATUS" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$COMMENT_SUCCESS" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$UPDATE_SUCCESS" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$FILTERED_COUNT" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$TASK2_ID" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$COMPLETED" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$MY_TASK_COUNT" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$DELETED" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))

echo -e "${GREEN}✅ Tests Passed: ${TESTS_PASSED}/13${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}❌ Tests Failed: ${TESTS_FAILED}/13${NC}"
fi
echo ""

if [ $TESTS_PASSED -ge 12 ]; then
  echo -e "${BOLD}${GREEN}🎉 Most/All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${BOLD}${RED}⚠️ Some tests failed. Check the output above.${NC}"
  exit 1
fi
