# 🚀 Quick Testing Reference

## Prerequisites
1. **Start Backend Server:**
   ```bash
   cd /home/abhishek/MINIPROJECT/server
   npm run dev
   ```
   Server should run on: http://localhost:5000

2. **Fix MongoDB Connection** (if needed):
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add IP Address
   - Use `0.0.0.0/0` for development
   - Wait 1-2 minutes for changes

## Step-by-Step Testing

### 1️⃣ Login & Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

📝 **Copy the token** and use it in all subsequent requests!

---

### 2️⃣ Create a Project
```bash
# Replace YOUR_TOKEN with the token from step 1
TOKEN="YOUR_TOKEN"

curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "Testing the project endpoints",
    "deadline": "2025-12-31T23:59:59.999Z",
    "tags": ["Test", "Demo"],
    "priority": "medium"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "_id": "6547abc123def456789",
    "name": "My First Project",
    ...
  }
}
```

📝 **Copy the _id** from the response!

---

### 3️⃣ Get All Projects
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [ /* array of projects */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

### 4️⃣ Get Single Project
```bash
# Replace PROJECT_ID with the _id from step 2
PROJECT_ID="6547abc123def456789"

curl -X GET http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6547abc123def456789",
    "name": "My First Project",
    "taskStats": {
      "total": 0,
      "completed": 0,
      "pending": 0,
      "completionRate": 0
    },
    ...
  }
}
```

---

### 5️⃣ Update Project
```bash
curl -X PUT http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "priority": "high",
    "name": "Updated Project Name"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": { /* updated project */ }
}
```

---

### 6️⃣ Search Projects
```bash
curl -X GET http://localhost:5000/api/projects/search/first \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [ /* matching projects */ ],
  "count": 1
}
```

---

### 7️⃣ Delete Project
```bash
curl -X DELETE http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Project and associated tasks deleted successfully",
  "data": {
    "projectId": "6547abc123def456789",
    "projectName": "My First Project",
    "tasksDeleted": 0
  }
}
```

---

## 🎯 All-in-One Test Script

Copy and paste this entire script:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "🔐 Step 1: Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:20}..."
echo ""

echo "📝 Step 2: Create Project..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Automated test project",
    "deadline": "2025-12-31T23:59:59.999Z",
    "tags": ["Test"],
    "priority": "medium"
  }')

PROJECT_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Create project failed!"
  echo $CREATE_RESPONSE
  exit 1
fi

echo "✅ Project created! ID: $PROJECT_ID"
echo ""

echo "📋 Step 3: Get All Projects..."
curl -s -X GET $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "🔍 Step 4: Get Single Project..."
curl -s -X GET $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "✏️ Step 5: Update Project..."
curl -s -X PUT $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active", "priority": "high"}' | head -c 200
echo "..."
echo ""

echo "🔎 Step 6: Search Projects..."
curl -s -X GET $BASE_URL/projects/search/test \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "🗑️ Step 7: Delete Project..."
DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN")
echo $DELETE_RESPONSE | head -c 200
echo ""

echo ""
echo "✅ All tests completed successfully!"
```

Save as `test_projects.sh` and run:
```bash
chmod +x test_projects.sh
./test_projects.sh
```

---

## 📱 Postman Import

### Option 1: Import Collection File
1. Open Postman
2. Click "Import"
3. Select `Postman_Collection.json`
4. Collection will be ready with all endpoints!

### Option 2: Manual Setup
1. Create new collection: "Project Management API"
2. Add environment variable:
   - `base_url`: `http://localhost:5000/api`
   - `token`: (will be auto-filled after login)
   - `project_id`: (will be auto-filled after create)
3. Add requests from the collection

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ Could not connect to any servers in your MongoDB Atlas cluster
```

**Fix:**
1. Go to: https://cloud.mongodb.com/
2. Select your cluster
3. Network Access → Add IP Address
4. Add `0.0.0.0/0` (allows all IPs - development only!)
5. Wait 1-2 minutes
6. Restart server: `cd server && npm run dev`

---

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

**Fix:** 
- Make sure you included the Authorization header
- Token format: `Bearer YOUR_TOKEN` (with space after Bearer)
- Token might be expired, login again

---

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Only project owner can update this project"
}
```

**Fix:**
- You're trying to update/delete a project you don't own
- Only the owner can update or delete projects
- Members can only view

---

### 404 Not Found
```json
{
  "success": false,
  "message": "Project not found"
}
```

**Fix:**
- Project ID is wrong
- Project was deleted
- Check the ID format (should be 24 character hex string)

---

## 📊 Expected Results Summary

| Action | Expected Status | Expected Message |
|--------|----------------|------------------|
| Login | 200 | Returns token |
| Create Project | 201 | "Project created successfully" |
| Get All Projects | 200 | Returns array with pagination |
| Get Single Project | 200 | Returns project with taskStats |
| Update Project | 200 | "Project updated successfully" |
| Delete Project | 200 | "Project and associated tasks deleted successfully" |
| Add Member | 200 | "Member added successfully" |
| Remove Member | 200 | "Member removed successfully" |
| Search Projects | 200 | Returns matching projects |

---

## 🎉 Success Indicators

✅ Server running on http://localhost:5000  
✅ MongoDB connected (green message in terminal)  
✅ Login returns token  
✅ Create project returns 201  
✅ Get all projects returns array  
✅ Update/Delete operations work  

---

## 📚 Documentation Files

- `PROJECT_ROUTES_SUMMARY.md` - Complete implementation summary
- `PROJECT_ENDPOINTS_TESTING.md` - Detailed API documentation
- `Postman_Collection.json` - Import into Postman
- `QUICK_TEST_REFERENCE.md` - This file!

---

## 🚀 Next Steps

After testing projects, implement:
1. Task endpoints (CRUD for tasks)
2. Comments endpoints (add/delete comments)
3. File upload for attachments
4. Real-time updates with Socket.IO
5. Notifications system

---

**Happy Testing! 🎊**
