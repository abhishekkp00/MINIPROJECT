# User Model Schema Documentation

## Overview
MongoDB Mongoose schema for user authentication and profile management in the AI-Integrated Project Management Application.

**Location:** `server/models/User.js`

---

## Schema Fields

### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `name` | String | Required, 2-50 chars, trimmed | User's full name |
| `email` | String | Required, unique, valid email format | User's email address (lowercase) |
| `password` | String | Required (except OAuth), min 6 chars, not selected by default | Hashed password |
| `role` | String | Required, enum: 'student', 'team-lead', 'mentor' | User's role in the system |

### Profile Fields

| Field | Type | Description |
|-------|------|-------------|
| `avatar` | String | Profile picture URL (default: placeholder) |
| `bio` | String | User biography (max 500 chars) |
| `skills` | Array[String] | List of user skills |
| `department` | String | Academic department |
| `rollNumber` | String | Student roll number |

### OAuth Fields

| Field | Type | Description |
|-------|------|-------------|
| `googleId` | String | Google OAuth ID (unique, sparse) |

### Activity Tracking

| Field | Type | Description |
|-------|------|-------------|
| `lastActive` | Date | Last activity timestamp |
| `isOnline` | Boolean | Current online status |

### Project Relationships

| Field | Type | Description |
|-------|------|-------------|
| `projects` | Array[ObjectId] | Projects user is part of (ref: 'Project') |
| `mentoringProjects` | Array[ObjectId] | Projects user is mentoring (ref: 'Project') |

### Notification Preferences

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `notifications.email` | Boolean | true | Email notifications enabled |
| `notifications.push` | Boolean | true | Push notifications enabled |
| `notifications.taskAssigned` | Boolean | true | Task assignment notifications |
| `notifications.projectUpdate` | Boolean | true | Project update notifications |
| `notifications.mentorFeedback` | Boolean | true | Mentor feedback notifications |

### Account Status

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isActive` | Boolean | true | Account active status |
| `isVerified` | Boolean | false | Email verification status |

### Password Reset

| Field | Type | Description |
|-------|------|-------------|
| `resetPasswordToken` | String | Password reset token |
| `resetPasswordExpire` | Date | Token expiration time |

### Authentication

| Field | Type | Description |
|-------|------|-------------|
| `refreshToken` | String | JWT refresh token |

### Timestamps

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | Date | Auto-generated creation timestamp |
| `updatedAt` | Date | Auto-generated update timestamp |

---

## Indexes

- `email` - Unique index (from schema definition)
- `googleId` - Unique, sparse index (from schema definition)
- `role` - Regular index for query optimization
- `isActive` - Regular index for query optimization

---

## Mongoose Hooks

### Pre-save Hook (Password Hashing)

```javascript
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }
  
  // Don't hash if password is undefined (OAuth users)
  if (!this.password) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Behavior:**
- ✅ Hashes password only when created or modified
- ✅ Uses bcrypt with salt rounds of 10
- ✅ Skips hashing for OAuth users (no password)
- ✅ Prevents rehashing on every save

---

## Instance Methods

### 1. comparePassword(candidatePassword)

Compares a plain text password with the hashed password.

**Parameters:**
- `candidatePassword` (String) - Plain text password to compare

**Returns:** Promise<Boolean>

**Usage:**
```javascript
const user = await User.findOne({ email }).select('+password');
const isMatch = await user.comparePassword('password123');
```

---

### 2. generateAuthToken()

Generates a JWT authentication token.

**Returns:** String (JWT token)

**Payload:**
- `id` - User's MongoDB ObjectId
- `email` - User's email
- `role` - User's role

**Expiry:** Based on `JWT_EXPIRE` env variable (default: 7 days)

**Usage:**
```javascript
const user = await User.findById(userId);
const token = user.generateAuthToken();
```

---

### 3. generateRefreshToken()

Generates a JWT refresh token for token renewal.

**Returns:** String (JWT refresh token)

**Payload:**
- `id` - User's MongoDB ObjectId

**Expiry:** Based on `JWT_REFRESH_EXPIRE` env variable (default: 30 days)

**Usage:**
```javascript
const user = await User.findById(userId);
const refreshToken = user.generateRefreshToken();
user.refreshToken = refreshToken;
await user.save();
```

---

### 4. getPublicProfile()

Returns user data without sensitive information.

**Returns:** Object with public fields only

**Returned Fields:**
- `_id`, `name`, `email`, `role`, `avatar`, `bio`, `skills`, `department`, `isOnline`, `lastActive`

**Usage:**
```javascript
const user = await User.findById(userId);
const publicProfile = user.getPublicProfile();
res.json({ user: publicProfile });
```

---

## Static Methods

### User.findByCredentials(email, password)

Finds and validates user by email and password.

**Parameters:**
- `email` (String) - User's email
- `password` (String) - Plain text password

**Returns:** Promise<User>

**Throws:** Error if credentials are invalid

**Usage:**
```javascript
try {
  const user = await User.findByCredentials('user@example.com', 'password123');
  const token = user.generateAuthToken();
  res.json({ token, user: user.getPublicProfile() });
} catch (error) {
  res.status(401).json({ error: 'Invalid credentials' });
}
```

---

## Virtual Properties

### projectCount

Returns the number of projects the user is associated with.

**Type:** Number (computed)

**Usage:**
```javascript
const user = await User.findById(userId);
console.log(user.projectCount); // 5
```

---

## Security Features

### 1. Password Protection
- ✅ Passwords are hashed using bcrypt
- ✅ Password field excluded from queries by default (`select: false`)
- ✅ Must explicitly select password: `.select('+password')`

### 2. Password Validation
- ✅ Minimum length: 6 characters
- ✅ Required for non-OAuth users
- ✅ Compared securely using bcrypt

### 3. JWT Tokens
- ✅ Access token with user info (7 days default)
- ✅ Refresh token for token renewal (30 days default)
- ✅ Signed with secure secrets from environment variables

---

## Usage Examples

### Create a New User

```javascript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePassword123',
  role: 'student',
  bio: 'Computer Science student',
  skills: ['JavaScript', 'React', 'Node.js']
});

console.log(user); // Password is hashed automatically
```

### Login User

```javascript
const user = await User.findByCredentials('john@example.com', 'securePassword123');
const token = user.generateAuthToken();
const refreshToken = user.generateRefreshToken();

user.refreshToken = refreshToken;
user.lastActive = Date.now();
user.isOnline = true;
await user.save();

res.json({
  token,
  refreshToken,
  user: user.getPublicProfile()
});
```

### Update User Profile

```javascript
const user = await User.findById(userId);
user.bio = 'Updated bio';
user.skills.push('MongoDB');
await user.save(); // Password won't be rehashed
```

### Change Password

```javascript
const user = await User.findById(userId).select('+password');

// Verify old password
const isMatch = await user.comparePassword(oldPassword);
if (!isMatch) {
  throw new Error('Current password is incorrect');
}

// Set new password
user.password = newPassword;
await user.save(); // Will be hashed by pre-save hook
```

---

## Testing

Run the comprehensive test suite:

```bash
node server/tests/userModel.test.js
```

**Test Coverage:**
- ✅ Schema validation (required fields, email format, unique constraints)
- ✅ Password hashing and comparison
- ✅ Token generation (auth & refresh)
- ✅ Instance methods (comparePassword, getPublicProfile)
- ✅ Static methods (findByCredentials)
- ✅ Virtual properties (projectCount)
- ✅ Default values
- ✅ Timestamps
- ✅ All role types

**Expected Output:**
```
🧪 USER MODEL TEST SUITE
✓ All 18 tests passed
Success Rate: 100%
```

---

## Error Handling

### Common Validation Errors

1. **Missing Required Field**
   ```javascript
   ValidationError: name: Name is required
   ```

2. **Invalid Email Format**
   ```javascript
   ValidationError: email: Please provide a valid email address
   ```

3. **Duplicate Email**
   ```javascript
   MongoServerError: E11000 duplicate key error
   ```

4. **Invalid Role**
   ```javascript
   ValidationError: role: invalid-role is not a valid role
   ```

5. **Password Too Short**
   ```javascript
   ValidationError: password: Password must be at least 6 characters
   ```

---

## Environment Variables Required

```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRE=30d
```

---

## Notes

- Password is automatically hashed before saving
- Password is excluded from query results by default
- Timestamps (createdAt, updatedAt) are automatically managed
- OAuth users (Google login) don't require a password
- All email addresses are stored in lowercase
- Use `getPublicProfile()` when sending user data to frontend
