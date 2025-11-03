# User Registration Endpoint Documentation

## Overview
Complete user registration endpoint with validation, error handling, and JWT authentication.

**Endpoint:** `POST /api/auth/register`  
**Access:** Public  
**File:** `server/routes/auth.js` → `server/controllers/authController.js`

---

## Request

### URL
```
POST http://localhost:5000/api/auth/register
```

### Headers
```
Content-Type: application/json
```

### Body Parameters

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | String | ✅ Yes | Not empty, trimmed | User's full name |
| `email` | String | ✅ Yes | Valid email format | User's email (unique) |
| `password` | String | ✅ Yes | Min 6 characters | User's password (will be hashed) |
| `role` | String | ❌ No | One of: 'student', 'team-lead', 'mentor' | User role (default: 'student') |
| `department` | String | ❌ No | - | Academic department |
| `rollNumber` | String | ❌ No | - | Student roll number |

### Request Example

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "student",
  "department": "Computer Science",
  "rollNumber": "CS2021001"
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "690827209dd445b4a827a47c",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "student",
      "avatar": "https://via.placeholder.com/150",
      "bio": "",
      "skills": [],
      "department": "Computer Science",
      "isOnline": false,
      "lastActive": "2025-11-03T03:53:04.332Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| `success` | Boolean indicating success |
| `message` | Success message |
| `data.user` | User object (password excluded) |
| `data.token` | JWT access token (7 days expiry) |
| `data.refreshToken` | JWT refresh token (30 days expiry) |

**Note:** A secure HTTP-only cookie is also set with the token.

---

## Error Responses

### 1. Duplicate Email (400 Bad Request)

**Scenario:** Email already registered

```json
{
  "success": false,
  "status": "fail",
  "error": {
    "statusCode": 400,
    "status": "fail",
    "isOperational": true
  },
  "message": "Email already registered"
}
```

---

### 2. Invalid Email Format (500 Internal Server Error)

**Scenario:** Email doesn't match format (handled by Mongoose)

```json
{
  "success": false,
  "status": "error",
  "message": "User validation failed: email: Please provide a valid email address"
}
```

---

### 3. Password Too Short (500 Internal Server Error)

**Scenario:** Password less than 6 characters (handled by Mongoose)

```json
{
  "success": false,
  "status": "error",
  "message": "User validation failed: password: Password must be at least 6 characters"
}
```

---

### 4. Name Required (500 Internal Server Error)

**Scenario:** Name is empty or not provided (handled by Mongoose)

```json
{
  "success": false,
  "status": "error",
  "message": "User validation failed: name: Name is required"
}
```

---

### 5. Validation Errors (400 Bad Request)

**Scenario:** Express-validator catches errors before Mongoose

```json
{
  "success": false,
  "status": "fail",
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Valid email is required",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 6 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

---

## Validation Rules

### Name Validation
- ✅ Required
- ✅ Trimmed (whitespace removed)
- ✅ Not empty
- ✅ Min length: 2 characters (Mongoose)
- ✅ Max length: 50 characters (Mongoose)

### Email Validation
- ✅ Required
- ✅ Valid email format (RFC 5322)
- ✅ Unique (no duplicates)
- ✅ Converted to lowercase
- ✅ Trimmed

### Password Validation
- ✅ Required
- ✅ Minimum 6 characters
- ✅ Automatically hashed (bcrypt with 10 rounds)
- ✅ Never returned in responses

### Role Validation
- ✅ Optional (defaults to 'student')
- ✅ Must be one of: 'student', 'team-lead', 'mentor'
- ✅ Case-sensitive

---

## Features

### 1. Automatic Password Hashing
- Uses bcrypt with 10 salt rounds
- Handled by User model pre-save hook
- Original password never stored

### 2. Duplicate Email Check
- Checks database before creating user
- Returns 400 error if email exists
- Case-insensitive check (emails stored lowercase)

### 3. Token Generation
- **Access Token**: JWT with 7-day expiry
- **Refresh Token**: JWT with 30-day expiry
- Both returned in response
- Access token also set in HTTP-only cookie

### 4. Welcome Email
- Sent asynchronously (doesn't block response)
- Fails silently if email service unavailable
- Contains welcome message and getting started info

### 5. Public Profile
- Password excluded from response
- Uses `getPublicProfile()` method
- Returns safe user data for client

---

## Testing with cURL

### Valid Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "student"
  }'
```

### Test Duplicate Email
```bash
# First registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User One",
    "email": "duplicate@example.com",
    "password": "password123"
  }'

# Second registration (should fail)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Two",
    "email": "duplicate@example.com",
    "password": "password456"
  }'
```

### Test Invalid Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Email",
    "email": "notanemail",
    "password": "password123"
  }'
```

### Test Short Password
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Short Pass",
    "email": "shortpass@example.com",
    "password": "12345"
  }'
```

### Test Empty Name
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "emptyname@example.com",
    "password": "password123"
  }'
```

### Test with Optional Fields
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Registration",
    "email": "full@example.com",
    "password": "password123",
    "role": "team-lead",
    "department": "Computer Science",
    "rollNumber": "CS2021001"
  }'
```

---

## Testing with Postman

### Setup
1. Create new request
2. Method: `POST`
3. URL: `http://localhost:5000/api/auth/register`
4. Headers: `Content-Type: application/json`

### Test Case 1: Successful Registration
**Body (raw JSON):**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "securePassword123",
  "role": "student"
}
```

**Expected:** 201 Created with user data and tokens

---

### Test Case 2: Duplicate Email
**Body (raw JSON):**
```json
{
  "name": "Bob Smith",
  "email": "alice@example.com",
  "password": "password123"
}
```

**Expected:** 400 Bad Request - "Email already registered"

---

### Test Case 3: Invalid Data
**Body (raw JSON):**
```json
{
  "name": "",
  "email": "invalid-email",
  "password": "123"
}
```

**Expected:** 500 or 400 with validation errors

---

### Test Case 4: Team Lead Registration
**Body (raw JSON):**
```json
{
  "name": "Team Lead User",
  "email": "teamlead@example.com",
  "password": "password123",
  "role": "team-lead",
  "department": "Engineering"
}
```

**Expected:** 201 Created with role 'team-lead'

---

### Test Case 5: Mentor Registration
**Body (raw JSON):**
```json
{
  "name": "Dr. Mentor",
  "email": "mentor@example.com",
  "password": "password123",
  "role": "mentor",
  "department": "Computer Science"
}
```

**Expected:** 201 Created with role 'mentor'

---

## Code Flow

```
1. Request received → POST /api/auth/register
   ↓
2. Express-validator validation middleware
   • Validates name, email, password, role
   • Returns 400 if validation fails
   ↓
3. Auth Controller: register()
   • Check validationResult
   • Extract request body
   ↓
4. Check duplicate email
   • Query: User.findOne({ email })
   • Return 400 if exists
   ↓
5. Create user
   • User.create({ name, email, password, role, ... })
   • Pre-save hook hashes password
   • Mongoose validates schema
   ↓
6. Generate tokens
   • generateToken(user._id) → access token
   • generateRefreshToken(user._id) → refresh token
   ↓
7. Save refresh token to user
   • user.refreshToken = refreshToken
   • user.save()
   ↓
8. Set HTTP-only cookie
   • setTokenCookie(res, token)
   ↓
9. Send welcome email (async, non-blocking)
   • sendWelcomeEmail(user)
   ↓
10. Return response
    • 201 status
    • user (without password)
    • token
    • refreshToken
```

---

## Security Features

✅ **Password Hashing** - Bcrypt with 10 rounds  
✅ **HTTP-Only Cookies** - Prevents XSS attacks  
✅ **Input Validation** - Express-validator + Mongoose  
✅ **Duplicate Prevention** - Unique email constraint  
✅ **Password Exclusion** - Never returned in responses  
✅ **Token Expiration** - Access (7d), Refresh (30d)  
✅ **Email Normalization** - Lowercase, trimmed  
✅ **Error Messages** - No sensitive info leaked  

---

## Database Changes

After registration, the following is created:

```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john.doe@example.com",  // lowercase
  password: "$2a$10$...",           // hashed
  role: "student",
  avatar: "https://via.placeholder.com/150",
  bio: "",
  skills: [],
  department: "Computer Science",
  rollNumber: "CS2021001",
  isActive: true,
  isVerified: false,
  isOnline: false,
  lastActive: ISODate("..."),
  refreshToken: "eyJ...",
  notifications: {
    email: true,
    push: true,
    taskAssigned: true,
    projectUpdate: true,
    mentorFeedback: true
  },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## Next Steps After Registration

1. **Save tokens** on client side (localStorage or secure storage)
2. **Include token** in subsequent API requests:
   ```
   Authorization: Bearer <token>
   ```
3. **Use refresh token** when access token expires
4. **Access protected routes** with authentication

---

## Related Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/password` - Change password (protected)

---

## Status

✅ **Implemented**  
✅ **Tested**  
✅ **Documented**  
✅ **Production Ready**

**Test Results:**
- ✅ Valid registration: Success
- ✅ Duplicate email: Properly rejected
- ✅ Invalid email: Validation error
- ✅ Short password: Validation error
- ✅ Empty name: Validation error
- ✅ Optional fields: Working

---

**Last Updated:** November 3, 2025  
**Version:** 1.0.0  
**Endpoint:** `/api/auth/register`
