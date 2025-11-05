# Task Management API - Complete Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All task endpoints require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 TASK ENDPOINTS

### 1. GET /api/projects/:projectId/tasks
**Get all tasks for a project**

#### Request
- **Method:** GET
- **URL:** `http://localhost:5000/api/projects/:projectId/tasks`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

#### Query Parameters (Optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (pending/in-progress/in-review/completed/blocked)
- `assignee` - Filter by assignee user ID
- `priority` - Filter by priority (low/medium/high/urgent)

#### Example Requests
```bash
# Get all tasks for a project
curl -X GET http://localhost:5000/api/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get pending tasks, page 1
curl -X GET "http://localhost:5000/api/projects/PROJECT_ID/tasks?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get tasks assigned to specific user
curl -X GET "http://localhost:5000/api/projects/PROJECT_ID/tasks?assignee=USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "_id": "task123",
      "title": "Implement Authentication",
      "description": "Set up JWT authentication with login and signup",
      "project": {
        "_id": "project123",
        "name": "E-Commerce Platform",
        "status": "active"
      },
      "assignedTo": {
        "_id": "user456",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "avatar-url",
        "role": "student"
      },
      "createdBy": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "avatar-url",
        "role": "mentor"
      },
      "status": "in-progress",
      "priority": "high",
      "deadline": "2025-11-15T23:59:59.999Z",
      "progress": 50,
      "isOverdue": false,
      "daysRemaining": 12,
      "createdAt": "2025-11-01T10:00:00.000Z",
      "updatedAt": "2025-11-03T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

#### Error Responses
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
```

---

### 2. POST /api/projects/:projectId/tasks
**Create a new task in a project**

#### Request
- **Method:** POST
- **URL:** `http://localhost:5000/api/projects/:projectId/tasks`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Request Body
```json
{
  "title": "Design Database Schema",
  "description": "Create MongoDB schema for users, projects, and tasks",
  "deadline": "2025-11-20T23:59:59.999Z",
  "priority": "high",
  "assignedTo": "user456",
  "status": "pending"
}
```

#### Required Fields
- `title` - Task title (3-200 characters)
- `description` - Task description (required, max 2000 characters)
- `deadline` - Task deadline (Date, required)

#### Optional Fields
- `priority` - low/medium/high/urgent (default: medium)
- `status` - pending/in-progress/in-review/completed/blocked (default: pending)
- `assignedTo` - User ID (defaults to creator if not specified)

#### Example Request
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Setup CI/CD Pipeline",
    "description": "Configure GitHub Actions for automated testing and deployment",
    "deadline": "2025-11-25T23:59:59.999Z",
    "priority": "medium",
    "assignedTo": "user789"
  }'
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "task456",
    "title": "Setup CI/CD Pipeline",
    "description": "Configure GitHub Actions for automated testing and deployment",
    "project": {
      "_id": "project123",
      "name": "E-Commerce Platform",
      "status": "active"
    },
    "assignedTo": {
      "_id": "user789",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "avatar": "avatar-url",
      "role": "student"
    },
    "createdBy": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar-url",
      "role": "mentor"
    },
    "status": "pending",
    "priority": "medium",
    "deadline": "2025-11-25T23:59:59.999Z",
    "progress": 0,
    "createdAt": "2025-11-03T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:00:00.000Z"
  }
}
```

#### Error Responses
```json
// 400 - Missing required field
{
  "success": false,
  "message": "Task title is required"
}

// 400 - Assignee not a project member
{
  "success": false,
  "message": "Assignee must be a project member"
}

// 403 - Not a project member
{
  "success": false,
  "message": "Access denied. You are not a member of this project"
}
```

---

### 3. GET /api/tasks/:id
**Get single task details**

#### Request
- **Method:** GET
- **URL:** `http://localhost:5000/api/tasks/:id`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

#### Example Request
```bash
curl -X GET http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "task123",
    "title": "Implement Authentication",
    "description": "Set up JWT authentication with login and signup",
    "project": {
      "_id": "project123",
      "name": "E-Commerce Platform",
      "status": "active",
      "owner": "user123",
      "members": ["user123", "user456", "user789"]
    },
    "assignedTo": { /* populated user data */ },
    "createdBy": { /* populated user data */ },
    "status": "in-progress",
    "priority": "high",
    "deadline": "2025-11-15T23:59:59.999Z",
    "progress": 50,
    "comments": [
      {
        "user": {
          "_id": "user123",
          "name": "John Doe",
          "email": "john@example.com",
          "avatar": "avatar-url"
        },
        "text": "Great progress so far!",
        "createdAt": "2025-11-02T15:30:00.000Z"
      }
    ],
    "attachments": [],
    "subtasks": [],
    "isOverdue": false,
    "daysRemaining": 12,
    "createdAt": "2025-11-01T10:00:00.000Z",
    "updatedAt": "2025-11-03T14:30:00.000Z"
  }
}
```

---

### 4. PUT /api/tasks/:id
**Update task details**

#### Request
- **Method:** PUT
- **URL:** `http://localhost:5000/api/tasks/:id`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Permissions
- Project owner can update any task
- Task creator can update the task
- Task assignee can update the task

#### Request Body (All fields optional)
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "high",
  "deadline": "2025-11-30T23:59:59.999Z",
  "assignedTo": "user789"
}
```

#### Notes
- Only project owner can reassign tasks (`assignedTo` field)
- Assignee must be a project member

#### Example Request
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress",
    "priority": "high"
  }'
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    /* updated task data */
  }
}
```

#### Error Responses
```json
// 403 - No permission
{
  "success": false,
  "message": "Access denied. You do not have permission to update this task"
}

// 403 - Can't reassign
{
  "success": false,
  "message": "Only project owner can reassign tasks"
}
```

---

### 5. DELETE /api/tasks/:id
**Delete a task**

#### Request
- **Method:** DELETE
- **URL:** `http://localhost:5000/api/tasks/:id`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

#### Permissions
- Project owner can delete any task
- Task creator can delete the task

#### Example Request
```bash
curl -X DELETE http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": {
    "taskId": "task123",
    "taskTitle": "Implement Authentication"
  }
}
```

#### Error Responses
```json
// 403 - No permission
{
  "success": false,
  "message": "Access denied. Only project owner or task creator can delete this task"
}
```

---

### 6. POST /api/tasks/:id/assign
**Assign task to a user**

#### Request
- **Method:** POST
- **URL:** `http://localhost:5000/api/tasks/:id/assign`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Permissions
- Only project owner can assign tasks

#### Request Body
```json
{
  "userId": "user456"
}
```

#### Features
- Automatically adds user to project members if not already a member
- Updates task assignment
- Logs activity in task activity log

#### Example Request
```bash
curl -X POST http://localhost:5000/api/tasks/TASK_ID/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user456"}'
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Task assigned successfully",
  "data": {
    /* task data with updated assignedTo */
  }
}
```

---

### 7. POST /api/tasks/:id/comments (BONUS)
**Add comment to a task**

#### Request
- **Method:** POST
- **URL:** `http://localhost:5000/api/tasks/:id/comments`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Request Body
```json
{
  "text": "This looks good! Please add unit tests."
}
```

#### Example Request
```bash
curl -X POST http://localhost:5000/api/tasks/TASK_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Great work on this task!"}'
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    /* task data with new comment */
  }
}
```

---

### 8. PUT /api/tasks/:id/status (BONUS)
**Update task status**

#### Request
- **Method:** PUT
- **URL:** `http://localhost:5000/api/tasks/:id/status`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
  ```

#### Permissions
- Task assignee can update status
- Project owner can update status

#### Request Body
```json
{
  "status": "completed"
}
```

#### Valid Statuses
- `pending`
- `in-progress`
- `in-review`
- `completed`
- `blocked`

#### Example Request
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    /* task data with updated status */
  }
}
```

---

### 9. GET /api/tasks/user/:userId (BONUS)
**Get all tasks assigned to a user**

#### Request
- **Method:** GET
- **URL:** `http://localhost:5000/api/tasks/user/:userId`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

#### Permissions
- Users can only view their own tasks
- Mentors and admins can view any user's tasks

#### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status

#### Example Request
```bash
curl -X GET http://localhost:5000/api/tasks/user/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    /* array of tasks assigned to user */
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

---

### 10. GET /api/tasks/overdue (BONUS)
**Get overdue tasks for current user**

#### Request
- **Method:** GET
- **URL:** `http://localhost:5000/api/tasks/overdue`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```

#### Example Request
```bash
curl -X GET http://localhost:5000/api/tasks/overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    /* array of overdue tasks */
  ],
  "count": 3
}
```

---

## 🔄 Complete Testing Workflow

### Step 1: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com", "password": "password123"}'
```

### Step 2: Create a Project
```bash
TOKEN="your_token_here"

curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Project for testing tasks"
  }'
```

### Step 3: Create a Task
```bash
PROJECT_ID="project_id_here"

curl -X POST http://localhost:5000/api/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing task creation",
    "deadline": "2025-12-31T23:59:59.999Z",
    "priority": "medium"
  }'
```

### Step 4: Get All Tasks
```bash
curl -X GET http://localhost:5000/api/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Update Task
```bash
TASK_ID="task_id_here"

curl -X PUT http://localhost:5000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

### Step 6: Add Comment
```bash
curl -X POST http://localhost:5000/api/tasks/$TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Working on this task now"}'
```

### Step 7: Update Status
```bash
curl -X PUT http://localhost:5000/api/tasks/$TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Step 8: Delete Task
```bash
curl -X DELETE http://localhost:5000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/projects/:projectId/tasks` | GET | ✓ | Get all project tasks |
| `/api/projects/:projectId/tasks` | POST | ✓ | Create task |
| `/api/tasks/:id` | GET | ✓ | Get task details |
| `/api/tasks/:id` | PUT | ✓ | Update task |
| `/api/tasks/:id` | DELETE | ✓ | Delete task |
| `/api/tasks/:id/assign` | POST | ✓ | Assign task |
| `/api/tasks/:id/comments` | POST | ✓ | Add comment |
| `/api/tasks/:id/status` | PUT | ✓ | Update status |
| `/api/tasks/user/:userId` | GET | ✓ | Get user's tasks |
| `/api/tasks/overdue` | GET | ✓ | Get overdue tasks |

---

## 🎯 Permission Matrix

| Action | Project Owner | Task Creator | Task Assignee | Project Member |
|--------|---------------|--------------|---------------|----------------|
| View Tasks | ✅ | ✅ | ✅ | ✅ |
| Create Task | ✅ | ✅ | ✅ | ✅ |
| Update Task | ✅ | ✅ | ✅ | ❌ |
| Delete Task | ✅ | ✅ | ❌ | ❌ |
| Assign Task | ✅ | ❌ | ❌ | ❌ |
| Update Status | ✅ | ❌ | ✅ | ❌ |
| Add Comment | ✅ | ✅ | ✅ | ✅ |

---

## ✅ Success!

All task management endpoints are implemented with:
- ✅ Complete CRUD operations
- ✅ Role-based permissions
- ✅ Comprehensive validation
- ✅ Error handling
- ✅ Activity logging
- ✅ Comment system
- ✅ Assignment management

**Ready for production use!** 🚀
