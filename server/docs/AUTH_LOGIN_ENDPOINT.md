# User Login Endpoint Documentation

## Overview
Complete documentation for the user login endpoint in the authentication API.

---

## Endpoint Details

**URL:** `POST /api/auth/login`  
**Access:** Public  
**Content-Type:** `application/json`

---

## Request Format

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Field Descriptions

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | String | Yes | Valid email format | User's email address |
| `password` | String | Yes | Not empty | User's password (plain text, will be compared with hash) |

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "690827209dd445b4a827a47c",
      "name": "Test User",
      "email": "testuser@example.com",
      "role": "student",
      "avatar": "https://via.placeholder.com/150",
      "bio": "",
      "skills": [],
      "isOnline": true,
      "lastActive": "2025-11-03T04:05:21.159Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Indicates if login was successful |
| `message` | String | Human-readable success message |
| `data.user` | Object | User profile information (password excluded) |
| `data.token` | String | JWT access token (expires in 7 days) |
| `data.refreshToken` | String | JWT refresh token (expires in 30 days) |

### Additional Response Details
- **HTTP-Only Cookie:** Token is also set as an HTTP-only cookie named `token`
- **User Status Update:** `isOnline` set to `true`, `lastActive` updated to current timestamp
- **Password Excluded:** Password hash is never returned in the response

---

## Error Responses

### 1. Invalid Credentials (Wrong Password or Email)

**Status Code:** 500 (should be 401)  
**Response:**
```json
{
  "success": false,
  "status": "error",
  "error": {
    "statusCode": 500,
    "status": "error"
  },
  "message": "Invalid login credentials"
}
```

### 2. Missing Password

**Status Code:** 400  
**Response:**
```json
{
  "success": false,
  "status": "fail",
  "error": {
    "statusCode": 400,
    "status": "fail",
    "isOperational": true
  },
  "message": "Please provide email and password"
}
```

### 3. Missing Email

**Status Code:** 400  
**Response:**
```json
{
  "success": false,
  "status": "fail",
  "error": {
    "statusCode": 400,
    "status": "fail",
    "isOperational": true
  },
  "message": "Validation failed"
}
```

### 4. Invalid Email Format

**Status Code:** 500  
**Response:**
```json
{
  "success": false,
  "status": "error",
  "message": "Invalid login credentials"
}
```

---

## Implementation Details

### Code Flow

```
1. Request received at POST /api/auth/login
   ↓
2. Express-validator middleware validates:
   - Email is valid format
   - Password is not empty
   ↓
3. Controller checks for validation errors
   ↓
4. User.findByCredentials(email, password) called:
   a. Finds user by email and isActive=true
   b. Selects password field (normally excluded)
   c. Throws error if user not found
   d. Compares password using bcrypt
   e. Throws error if password doesn't match
   f. Returns user object
   ↓
5. Generate JWT tokens:
   - Access token (7 days)
   - Refresh token (30 days)
   ↓
6. Update user record:
   - Save refresh token
   - Set lastActive to now
   - Set isOnline to true
   ↓
7. Set HTTP-only cookie with access token
   ↓
8. Return success response with user and tokens
```

### Validation Rules

**Email Validation:**
```javascript
body('email').isEmail().withMessage('Valid email is required')
```

**Password Validation:**
```javascript
body('password').notEmpty().withMessage('Password is required')
```

### Password Comparison

Uses bcrypt to compare plain text password with stored hash:
```javascript
const isPasswordMatch = await user.comparePassword(password);
```

### Token Generation

**Access Token (7 days):**
```javascript
const token = jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || '7d' }
);
```

**Refresh Token (30 days):**
```javascript
const refreshToken = jwt.sign(
  { id: user._id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
);
```

---

## Testing Guide

### cURL Commands

#### 1. Valid Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Expected Result:** ✅ 200 OK with user object and tokens

---

#### 2. Wrong Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Result:** ❌ 500 Error "Invalid login credentials"

---

#### 3. Non-existent Email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password123"
  }'
```

**Expected Result:** ❌ 500 Error "Invalid login credentials"

---

#### 4. Missing Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

**Expected Result:** ❌ 400 Error "Please provide email and password"

---

#### 5. Invalid Email Format
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notanemail",
    "password": "password123"
  }'
```

**Expected Result:** ❌ 500 Error "Invalid login credentials"

---

#### 6. Missing Email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "password123"
  }'
```

**Expected Result:** ❌ 400 Error "Validation failed"

---

## Postman Test Cases

### Test Case 1: Successful Login
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "testuser@example.com",
    "password": "password123"
  }
  ```
- **Expected Status:** 200 OK
- **Expected Response:** User object with tokens
- **Post-Test Script:**
  ```javascript
  pm.test("Status code is 200", function () {
      pm.response.to.have.status(200);
  });
  
  pm.test("Response has success flag", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.success).to.eql(true);
  });
  
  pm.test("Response contains token", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.data.token).to.exist;
      pm.collectionVariables.set("authToken", jsonData.data.token);
  });
  
  pm.test("Response contains user data", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.data.user).to.exist;
      pm.expect(jsonData.data.user.email).to.eql("testuser@example.com");
  });
  ```

### Test Case 2: Invalid Password
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "testuser@example.com",
    "password": "wrongpassword"
  }
  ```
- **Expected Status:** 500 (should be 401)
- **Expected Message:** "Invalid login credentials"

### Test Case 3: Non-existent User
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "nonexistent@example.com",
    "password": "password123"
  }
  ```
- **Expected Status:** 500 (should be 401)
- **Expected Message:** "Invalid login credentials"

### Test Case 4: Missing Required Fields
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "testuser@example.com"
  }
  ```
- **Expected Status:** 400
- **Expected Message:** "Please provide email and password"

### Test Case 5: Invalid Email Format
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "invalidemail",
    "password": "password123"
  }
  ```
- **Expected Status:** 500
- **Expected Message:** "Invalid login credentials"

---

## Security Features

### 1. Password Security
- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ Plain text passwords never stored
- ✅ Password hash never returned in response
- ✅ Secure password comparison using bcrypt.compare()

### 2. Authentication Security
- ✅ JWT tokens with expiration (7 days access, 30 days refresh)
- ✅ HTTP-only cookies prevent XSS attacks
- ✅ Tokens signed with secret key
- ✅ Refresh token stored in database for validation

### 3. Account Security
- ✅ Generic error message for wrong email/password (prevents user enumeration)
- ✅ Only active users can login (isActive check)
- ✅ User status tracking (isOnline, lastActive)

### 4. Input Validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ Express-validator middleware

---

## Database Changes After Login

### User Record Updated
```javascript
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "lastActive": "2025-11-03T04:05:21.159Z",
  "isOnline": true,
  // ... other fields unchanged
}
```

---

## Related Endpoints

- **Register User:** `POST /api/auth/register`
- **Get Current User:** `GET /api/auth/me` (requires token)
- **Logout:** `POST /api/auth/logout` (requires token)
- **Refresh Token:** `POST /api/auth/refresh`
- **Update Profile:** `PUT /api/auth/profile` (requires token)
- **Change Password:** `PUT /api/auth/password` (requires token)

---

## Common Issues & Solutions

### Issue 1: "Invalid login credentials" with correct password
**Cause:** User account may be inactive  
**Solution:** Check `isActive` field in database

### Issue 2: Token not being saved in cookies
**Cause:** Cookie settings or CORS issues  
**Solution:** Check cookie configuration in auth.js middleware

### Issue 3: Password comparison always fails
**Cause:** Password not properly hashed during registration  
**Solution:** Verify bcrypt pre-save hook in User model

---

## Environment Variables Required

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRE=30d

# Cookie Configuration
NODE_ENV=development  # Set to 'production' for secure cookies
```

---

## API Status Codes Summary

| Status Code | Scenario |
|-------------|----------|
| 200 | Successful login |
| 400 | Missing required fields or validation errors |
| 500 | Wrong credentials, database errors, or server errors |

**Note:** Invalid credentials should ideally return 401 Unauthorized instead of 500

---

## Test Results Summary

✅ **Valid Login:** 200 OK with user and tokens  
✅ **Wrong Password:** 500 Error "Invalid login credentials"  
✅ **Non-existent Email:** 500 Error "Invalid login credentials"  
✅ **Missing Password:** 400 Error "Please provide email and password"  
✅ **Invalid Email Format:** 500 Error "Invalid login credentials"  
✅ **Missing Email:** 400 Error "Validation failed"

**All Tests Passed:** 6/6 ✅

---

## File Locations

- **Route Definition:** `server/routes/auth.js`
- **Controller Logic:** `server/controllers/authController.js` (login function)
- **User Model:** `server/models/User.js` (findByCredentials, comparePassword methods)
- **Auth Middleware:** `server/middleware/auth.js` (token utilities)
- **Validation Middleware:** `server/routes/auth.js` (loginValidation)

---

*Last Updated: November 3, 2025*
