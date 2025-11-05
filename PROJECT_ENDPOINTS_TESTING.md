# Project Management API - Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication
All project endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. GET /api/projects
**Get all projects where user is owner or member**

### Request
- **Method:** GET
- **URL:** `http://localhost:5000/api/projects`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

### Query Parameters (Optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (planning/active/completed)
- `priority` - Filter by priority (low/medium/high)

### Example Requests
```bash
# Get all projects (paginated)
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get active projects, page 2, limit 5
curl -X GET "http://localhost:5000/api/projects?status=active&page=2&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "_id": "6547abc123def456789",
      "name": "AI Project Management System",
      "description": "Building an intelligent project management tool",
      "owner": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "avatar-url",
        "role": "mentor"
      },
      "members": [
        {
          "_id": "user456",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "avatar": "avatar-url",
          "role": "student"
        }
      ],
      "status": "active",
      "priority": "high",
      "deadline": "2025-12-31T23:59:59.999Z",
      "tags": ["AI", "Web Development"],
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-20T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

## 2. POST /api/projects
**Create a new project**

### Request
- **Method:** POST
- **URL:** `http://localhost:5000/api/projects`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

### Request Body
```json
{
  "name": "E-Commerce Platform",
  "description": "Building a full-stack e-commerce platform with React and Node.js",
  "deadline": "2025-06-30T23:59:59.999Z",
  "tags": ["React", "Node.js", "MongoDB"],
  "priority": "high",
  "status": "planning"
}
```

### Required Fields
- `name` - Project name (3-100 characters)
- `description` - Project description (max 1000 characters)

### Optional Fields
- `deadline` - Project deadline (must be future date)
- `tags` - Array of tags (max 30 chars each)
- `priority` - low/medium/high (default: medium)
- `status` - planning/active/completed (default: planning)

### Example Request
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App Development",
    "description": "Creating a cross-platform mobile app using React Native",
    "deadline": "2025-08-15T23:59:59.999Z",
    "tags": ["React Native", "Mobile", "iOS", "Android"],
    "priority": "medium"
  }'
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "_id": "6547abc123def456789",
    "name": "E-Commerce Platform",
    "description": "Building a full-stack e-commerce platform with React and Node.js",
    "owner": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar-url",
      "role": "mentor"
    },
    "members": [
      {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "avatar-url",
        "role": "mentor"
      }
    ],
    "status": "planning",
    "priority": "high",
    "deadline": "2025-06-30T23:59:59.999Z",
    "tags": ["React", "Node.js", "MongoDB"],
    "createdAt": "2025-11-03T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:00:00.000Z"
  }
}
```

### Error Responses
```json
// 400 - Missing required field
{
  "success": false,
  "message": "Project name is required"
}

// 400 - Invalid deadline
{
  "success": false,
  "message": "Deadline must be in the future"
}

// 400 - Validation error
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Title must be at least 3 characters"
  ]
}
```

---

## 3. GET /api/projects/:id
**Get single project details**

### Request
- **Method:** GET
- **URL:** `http://localhost:5000/api/projects/:id`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

### Example Request
```bash
curl -X GET http://localhost:5000/api/projects/6547abc123def456789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "6547abc123def456789",
    "name": "AI Project Management System",
    "description": "Building an intelligent project management tool",
    "owner": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar-url",
      "role": "mentor"
    },
    "members": [
      {
        "_id": "user456",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "avatar-url",
        "role": "student"
      }
    ],
    "status": "active",
    "priority": "high",
    "deadline": "2025-12-31T23:59:59.999Z",
    "tags": ["AI", "Web Development"],
    "taskStats": {
      "total": 15,
      "completed": 8,
      "pending": 7,
      "completionRate": 53
    },
    "isOverdue": false,
    "daysRemaining": 45,
    "memberCount": 2,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-20T14:30:00.000Z"
  }
}
```

### Error Responses
```json
// 404 - Project not found
{
  "success": false,
  "message": "Project not found"
}

// 403 - Access denied
{
  "success": false,
  "message": "Access denied. You are not a member of this project"
}

// 400 - Invalid ID
{
  "success": false,
  "message": "Invalid project ID format"
}
```

---

## 4. PUT /api/projects/:id
**Update project details (Owner only)**

### Request
- **Method:** PUT
- **URL:** `http://localhost:5000/api/projects/:id`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

### Request Body (All fields optional)
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "deadline": "2025-12-31T23:59:59.999Z",
  "status": "active",
  "priority": "high",
  "tags": ["Updated", "Tags"]
}
```

### Example Request
```bash
curl -X PUT http://localhost:5000/api/projects/6547abc123def456789 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "priority": "high",
    "deadline": "2025-12-31T23:59:59.999Z"
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "_id": "6547abc123def456789",
    "name": "Updated Project Name",
    "description": "Updated description",
    "owner": { /* owner data */ },
    "members": [ /* members data */ ],
    "status": "active",
    "priority": "high",
    "deadline": "2025-12-31T23:59:59.999Z",
    "tags": ["Updated", "Tags"],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:00:00.000Z"
  }
}
```

### Error Responses
```json
// 403 - Not owner
{
  "success": false,
  "message": "Access denied. Only project owner can update this project"
}

// 404 - Project not found
{
  "success": false,
  "message": "Project not found"
}
```

---

## 5. DELETE /api/projects/:id
**Delete project and all associated tasks (Owner only)**

### Request
- **Method:** DELETE
- **URL:** `http://localhost:5000/api/projects/:id`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

### Example Request
```bash
curl -X DELETE http://localhost:5000/api/projects/6547abc123def456789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Project and associated tasks deleted successfully",
  "data": {
    "projectId": "6547abc123def456789",
    "projectName": "AI Project Management System",
    "tasksDeleted": 15
  }
}
```

### Error Responses
```json
// 403 - Not owner
{
  "success": false,
  "message": "Access denied. Only project owner can delete this project"
}

// 404 - Project not found
{
  "success": false,
  "message": "Project not found"
}
```

---

## 6. POST /api/projects/:id/members
**Add member to project (Owner only)**

### Request
- **Method:** POST
- **URL:** `http://localhost:5000/api/projects/:id/members`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

### Request Body
```json
{
  "userId": "user456"
}
```

### Example Request
```bash
curl -X POST http://localhost:5000/api/projects/6547abc123def456789/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user456"}'
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": {
    "_id": "6547abc123def456789",
    "name": "AI Project Management System",
    "members": [
      { "_id": "user123", "name": "John Doe" },
      { "_id": "user456", "name": "Jane Smith" }
    ]
  }
}
```

---

## 7. DELETE /api/projects/:id/members/:userId
**Remove member from project (Owner only)**

### Request
- **Method:** DELETE
- **URL:** `http://localhost:5000/api/projects/:id/members/:userId`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

### Example Request
```bash
curl -X DELETE http://localhost:5000/api/projects/6547abc123def456789/members/user456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Member removed successfully",
  "data": {
    "_id": "6547abc123def456789",
    "name": "AI Project Management System",
    "members": [
      { "_id": "user123", "name": "John Doe" }
    ]
  }
}
```

---

## 8. GET /api/projects/search/:query
**Search projects by name, description or tags**

### Request
- **Method:** GET
- **URL:** `http://localhost:5000/api/projects/search/:query`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

### Example Request
```bash
curl -X GET http://localhost:5000/api/projects/search/react \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "_id": "6547abc123def456789",
      "name": "React E-Commerce",
      "description": "Building with React",
      "tags": ["React", "Node.js"]
    }
  ],
  "count": 1
}
```

---

## Testing Workflow

### 1. First, login to get JWT token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

### 2. Save the token from response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Test each endpoint with the token

#### Create a project
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "This is a test project",
    "deadline": "2025-12-31T23:59:59.999Z",
    "tags": ["Test"],
    "priority": "medium"
  }'
```

#### Get all projects
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

#### Get single project (replace PROJECT_ID)
```bash
PROJECT_ID="6547abc123def456789"

curl -X GET http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Update project
```bash
curl -X PUT http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "priority": "high"
  }'
```

#### Delete project
```bash
curl -X DELETE http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Postman Collection

### Import into Postman

1. Create a new Collection named "Project Management API"
2. Add environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: `<your_jwt_token>`

3. Create requests for each endpoint using `{{base_url}}` and `{{token}}`

### Pre-request Script (for automatic token)
```javascript
// Add this to collection pre-request script
pm.sendRequest({
    url: pm.environment.get("base_url") + "/auth/login",
    method: "POST",
    header: {
        "Content-Type": "application/json"
    },
    body: {
        mode: "raw",
        raw: JSON.stringify({
            email: "testuser@example.com",
            password: "password123"
        })
    }
}, function (err, res) {
    if (!err && res.json().token) {
        pm.environment.set("token", res.json().token);
    }
});
```

---

## Common Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

---

## Notes

1. **Authentication Required**: All endpoints require a valid JWT token
2. **Owner Permissions**: Only project owners can update, delete, or manage members
3. **Member Access**: Both owners and members can view project details
4. **Cascade Delete**: Deleting a project also deletes all associated tasks
5. **Pagination**: GET /api/projects supports pagination with `page` and `limit` parameters
6. **Filtering**: Supports filtering by status and priority
7. **Search**: Full-text search across project names, descriptions, and tags

---

## MongoDB Connection Issue

If you see MongoDB connection errors, ensure:
1. Your IP is whitelisted in MongoDB Atlas
2. Connection string is correct in `.env` file
3. Database user has proper permissions

To whitelist your IP:
1. Go to MongoDB Atlas Dashboard
2. Network Access → Add IP Address
3. Add your current IP or use 0.0.0.0/0 for development (allows all IPs)
