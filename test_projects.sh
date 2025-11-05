#!/bin/bash

# Project Management API - Automated Test Script
# Tests all project endpoints in sequence

BASE_URL="http://localhost:5000/api"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}================================${NC}"
echo -e "${BOLD}${BLUE}Project API Automated Test${NC}"
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

# Extract token using grep and cut
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
echo -e "${YELLOW}📝 Step 2: Create Project...${NC}"
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Automated Test Project",
    "description": "This project was created by automated test script",
    "deadline": "2025-12-31T23:59:59.999Z",
    "tags": ["Test", "Automation", "Demo"],
    "priority": "medium",
    "status": "planning"
  }')

# Extract project ID
PROJECT_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Create project failed!${NC}"
  echo $CREATE_RESPONSE | head -c 500
  exit 1
fi

echo -e "${GREEN}✅ Project created!${NC}"
echo -e "Project ID: ${PROJECT_ID}"
echo ""

# Step 3: Get All Projects
echo -e "${YELLOW}📋 Step 3: Get All Projects (with pagination)...${NC}"
ALL_PROJECTS=$(curl -s -X GET "$BASE_URL/projects?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

PROJECT_COUNT=$(echo $ALL_PROJECTS | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -z "$PROJECT_COUNT" ]; then
  echo -e "${RED}❌ Get all projects failed!${NC}"
else
  echo -e "${GREEN}✅ Retrieved all projects!${NC}"
  echo -e "Total projects: ${PROJECT_COUNT}"
fi
echo ""

# Step 4: Get Single Project
echo -e "${YELLOW}🔍 Step 4: Get Single Project Details...${NC}"
SINGLE_PROJECT=$(curl -s -X GET $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN")

PROJECT_NAME=$(echo $SINGLE_PROJECT | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}❌ Get single project failed!${NC}"
else
  echo -e "${GREEN}✅ Retrieved project details!${NC}"
  echo -e "Project Name: ${PROJECT_NAME}"
fi
echo ""

# Step 5: Update Project
echo -e "${YELLOW}✏️ Step 5: Update Project...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "priority": "high",
    "name": "Updated Test Project"
  }')

UPDATED=$(echo $UPDATE_RESPONSE | grep -o '"success":true')

if [ -z "$UPDATED" ]; then
  echo -e "${RED}❌ Update project failed!${NC}"
  echo $UPDATE_RESPONSE | head -c 300
else
  echo -e "${GREEN}✅ Project updated!${NC}"
  echo -e "New status: active, priority: high"
fi
echo ""

# Step 6: Search Projects
echo -e "${YELLOW}🔎 Step 6: Search Projects...${NC}"
SEARCH_RESPONSE=$(curl -s -X GET $BASE_URL/projects/search/test \
  -H "Authorization: Bearer $TOKEN")

SEARCH_COUNT=$(echo $SEARCH_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ -z "$SEARCH_COUNT" ]; then
  echo -e "${RED}❌ Search failed!${NC}"
else
  echo -e "${GREEN}✅ Search completed!${NC}"
  echo -e "Found ${SEARCH_COUNT} matching projects"
fi
echo ""

# Step 7: Filter Projects by Status
echo -e "${YELLOW}🔍 Step 7: Filter Projects (status=active)...${NC}"
FILTER_RESPONSE=$(curl -s -X GET "$BASE_URL/projects?status=active&priority=high" \
  -H "Authorization: Bearer $TOKEN")

FILTERED_COUNT=$(echo $FILTER_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -z "$FILTERED_COUNT" ]; then
  echo -e "${RED}❌ Filter failed!${NC}"
else
  echo -e "${GREEN}✅ Filter applied!${NC}"
  echo -e "Active + High priority projects: ${FILTERED_COUNT}"
fi
echo ""

# Step 8: Delete Project
echo -e "${YELLOW}🗑️ Step 8: Delete Project...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN")

DELETED=$(echo $DELETE_RESPONSE | grep -o '"success":true')
TASKS_DELETED=$(echo $DELETE_RESPONSE | grep -o '"tasksDeleted":[0-9]*' | cut -d':' -f2)

if [ -z "$DELETED" ]; then
  echo -e "${RED}❌ Delete failed!${NC}"
  echo $DELETE_RESPONSE | head -c 300
else
  echo -e "${GREEN}✅ Project deleted!${NC}"
  echo -e "Tasks deleted: ${TASKS_DELETED}"
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
[ ! -z "$PROJECT_COUNT" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$PROJECT_NAME" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$UPDATED" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$SEARCH_COUNT" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$FILTERED_COUNT" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))
[ ! -z "$DELETED" ] && ((TESTS_PASSED++)) || ((TESTS_FAILED++))

echo -e "${GREEN}✅ Tests Passed: ${TESTS_PASSED}/8${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}❌ Tests Failed: ${TESTS_FAILED}/8${NC}"
fi
echo ""

if [ $TESTS_PASSED -eq 8 ]; then
  echo -e "${BOLD}${GREEN}🎉 All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${BOLD}${RED}⚠️ Some tests failed. Check the output above.${NC}"
  exit 1
fi
