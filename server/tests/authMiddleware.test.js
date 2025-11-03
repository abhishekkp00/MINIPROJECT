/**
 * Authentication Middleware Test Suite
 * Tests for JWT verification and authorization
 * 
 * Run with: node server/tests/authMiddleware.test.js
 */

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { protect, authorize, optionalAuth, generateToken } from '../middleware/auth.js';

// Load environment variables
dotenv.config();

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}\n${msg}\n${colors.blue}${'='.repeat(70)}${colors.reset}`),
  subheader: (msg) => console.log(`\n${colors.gray}${'-'.repeat(70)}${colors.reset}\n${msg}${colors.gray}${'-'.repeat(70)}${colors.reset}`)
};

// Test counter
let testsPassed = 0;
let testsFailed = 0;

// Mock request and response objects
const createMockReq = (headers = {}, cookies = {}) => ({
  headers,
  cookies,
  user: null,
  params: {}
});

const createMockRes = () => {
  const res = {
    statusCode: null,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
};

const mockNext = () => {
  let called = false;
  return {
    fn: () => { called = true; },
    wasCalled: () => called
  };
};

// Test runner
async function runTest(testName, testFn) {
  try {
    await testFn();
    log.success(testName);
    testsPassed++;
    return true;
  } catch (error) {
    log.error(`${testName}: ${error.message}`);
    testsFailed++;
    return false;
  }
}

// Connect to test database
async function connectDB() {
  try {
    const testDB = process.env.MONGODB_URI.replace('project-management', 'project-management-test');
    await mongoose.connect(testDB);
    log.success('Connected to test database');
  } catch (error) {
    log.error('Database connection failed: ' + error.message);
    process.exit(1);
  }
}

// Clean up test data
async function cleanupDB() {
  try {
    await User.deleteMany({ email: { $regex: /test.*@example\.com/i } });
  } catch (error) {
    log.warn('Cleanup warning: ' + error.message);
  }
}

// Disconnect from database
async function disconnectDB() {
  try {
    await mongoose.connection.close();
    log.success('Disconnected from test database');
  } catch (error) {
    log.error('Disconnect failed: ' + error.message);
  }
}

// ========================================
// TEST SUITES
// ========================================

// Test 1: No token provided
async function testNoTokenProvided() {
  const req = createMockReq();
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (res.statusCode !== 401) {
    throw new Error(`Expected 401, got ${res.statusCode}`);
  }
  if (!res.jsonData.message.includes('Not authorized')) {
    throw new Error('Wrong error message');
  }
  if (next.wasCalled()) {
    throw new Error('next() should not be called');
  }
}

// Test 2: Invalid token format
async function testInvalidTokenFormat() {
  const req = createMockReq({
    authorization: 'InvalidFormat token123'
  });
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (res.statusCode !== 401) {
    throw new Error(`Expected 401, got ${res.statusCode}`);
  }
}

// Test 3: Invalid token
async function testInvalidToken() {
  const req = createMockReq({
    authorization: 'Bearer invalid_token_string'
  });
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (res.statusCode !== 401) {
    throw new Error(`Expected 401, got ${res.statusCode}`);
  }
  if (!res.jsonData.message.includes('Invalid token')) {
    throw new Error('Should return invalid token message');
  }
}

// Test 4: Expired token
async function testExpiredToken() {
  const expiredToken = jwt.sign(
    { id: 'test_user_id' },
    process.env.JWT_SECRET,
    { expiresIn: '0s' }
  );

  // Wait a moment to ensure token is expired
  await new Promise(resolve => setTimeout(resolve, 100));

  const req = createMockReq({
    authorization: `Bearer ${expiredToken}`
  });
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (res.statusCode !== 401) {
    throw new Error(`Expected 401, got ${res.statusCode}`);
  }
  if (!res.jsonData.message.includes('expired')) {
    throw new Error('Should return token expired message');
  }
}

// Test 5: Valid token but user not found
async function testValidTokenUserNotFound() {
  const fakeUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign(
    { id: fakeUserId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = createMockReq({
    authorization: `Bearer ${token}`
  });
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (res.statusCode !== 401) {
    throw new Error(`Expected 401, got ${res.statusCode}`);
  }
  if (!res.jsonData.message.includes('User not found')) {
    throw new Error('Should return user not found message');
  }
}

// Test 6: Valid token with valid user
async function testValidTokenValidUser() {
  // Create a test user
  const user = await User.create({
    name: 'Test Auth User',
    email: 'testauth@example.com',
    password: 'password123',
    role: 'student'
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = createMockReq({
    authorization: `Bearer ${token}`
  });
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (!next.wasCalled()) {
    throw new Error('next() should be called for valid token');
  }
  if (!req.user) {
    throw new Error('User should be attached to request');
  }
  if (req.user.email !== 'testauth@example.com') {
    throw new Error('Wrong user attached to request');
  }
  if (req.user.password) {
    throw new Error('Password should not be included');
  }

  // Cleanup
  await User.findByIdAndDelete(user._id);
}

// Test 7: Token from cookies
async function testTokenFromCookies() {
  const user = await User.create({
    name: 'Test Cookie User',
    email: 'testcookie@example.com',
    password: 'password123',
    role: 'student'
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = createMockReq({}, { token });
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (!next.wasCalled()) {
    throw new Error('next() should be called');
  }
  if (!req.user) {
    throw new Error('User should be attached from cookie token');
  }

  // Cleanup
  await User.findByIdAndDelete(user._id);
}

// Test 8: Inactive user
async function testInactiveUser() {
  const user = await User.create({
    name: 'Inactive User',
    email: 'testinactive@example.com',
    password: 'password123',
    role: 'student',
    isActive: false
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = createMockReq({
    authorization: `Bearer ${token}`
  });
  const res = createMockRes();
  const next = mockNext();

  await protect(req, res, next.fn);

  if (res.statusCode !== 401) {
    throw new Error('Inactive user should be rejected');
  }
  if (!res.jsonData.message.includes('deactivated')) {
    throw new Error('Should return deactivated message');
  }

  // Cleanup
  await User.findByIdAndDelete(user._id);
}

// Test 9: Role-based authorization - authorized
async function testAuthorizeSuccess() {
  const req = createMockReq();
  req.user = { role: 'mentor', _id: 'test_id' };
  const res = createMockRes();
  const next = mockNext();

  const authMiddleware = authorize('mentor', 'team-lead');
  authMiddleware(req, res, next.fn);

  if (!next.wasCalled()) {
    throw new Error('next() should be called for authorized role');
  }
}

// Test 10: Role-based authorization - unauthorized
async function testAuthorizeFailure() {
  const req = createMockReq();
  req.user = { role: 'student', _id: 'test_id' };
  const res = createMockRes();
  const next = mockNext();

  const authMiddleware = authorize('mentor', 'team-lead');
  authMiddleware(req, res, next.fn);

  if (res.statusCode !== 403) {
    throw new Error(`Expected 403, got ${res.statusCode}`);
  }
  if (!res.jsonData.message.includes('not authorized')) {
    throw new Error('Should return not authorized message');
  }
  if (next.wasCalled()) {
    throw new Error('next() should not be called for unauthorized role');
  }
}

// Test 11: Optional auth with valid token
async function testOptionalAuthWithToken() {
  const user = await User.create({
    name: 'Optional Auth User',
    email: 'testoptional@example.com',
    password: 'password123',
    role: 'student'
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const req = createMockReq({
    authorization: `Bearer ${token}`
  });
  const res = createMockRes();
  const next = mockNext();

  await optionalAuth(req, res, next.fn);

  if (!next.wasCalled()) {
    throw new Error('next() should always be called in optionalAuth');
  }
  if (!req.user) {
    throw new Error('User should be attached with valid token');
  }

  // Cleanup
  await User.findByIdAndDelete(user._id);
}

// Test 12: Optional auth without token
async function testOptionalAuthWithoutToken() {
  const req = createMockReq();
  const res = createMockRes();
  const next = mockNext();

  await optionalAuth(req, res, next.fn);

  if (!next.wasCalled()) {
    throw new Error('next() should be called even without token');
  }
  if (req.user) {
    throw new Error('User should not be attached without token');
  }
}

// Test 13: Generate token utility
async function testGenerateToken() {
  const userId = new mongoose.Types.ObjectId();
  const token = generateToken(userId.toString());

  if (!token) {
    throw new Error('Token should be generated');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.id !== userId.toString()) {
    throw new Error('Token should contain correct user ID');
  }
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function runAllTests() {
  log.header('🔐 AUTHENTICATION MIDDLEWARE TEST SUITE');

  await connectDB();
  await cleanupDB();

  log.subheader('🔒 Token Validation Tests');
  await runTest('1. No token provided', testNoTokenProvided);
  await runTest('2. Invalid token format', testInvalidTokenFormat);
  await runTest('3. Invalid token', testInvalidToken);
  await runTest('4. Expired token', testExpiredToken);
  await runTest('5. Valid token but user not found', testValidTokenUserNotFound);
  await runTest('6. Valid token with valid user', testValidTokenValidUser);
  await runTest('7. Token from cookies', testTokenFromCookies);
  await runTest('8. Inactive user rejected', testInactiveUser);

  log.subheader('👥 Authorization Tests');
  await runTest('9. Role-based authorization - success', testAuthorizeSuccess);
  await runTest('10. Role-based authorization - failure', testAuthorizeFailure);

  log.subheader('🔓 Optional Authentication Tests');
  await runTest('11. Optional auth with valid token', testOptionalAuthWithToken);
  await runTest('12. Optional auth without token', testOptionalAuthWithoutToken);

  log.subheader('🛠️  Utility Tests');
  await runTest('13. Generate token utility', testGenerateToken);

  await cleanupDB();
  await disconnectDB();

  // Summary
  log.header('📊 TEST SUMMARY');
  const total = testsPassed + testsFailed;
  console.log(`Total Tests: ${total}`);
  log.success(`Passed: ${testsPassed}`);
  if (testsFailed > 0) {
    log.error(`Failed: ${testsFailed}`);
  }
  console.log(`Success Rate: ${((testsPassed / total) * 100).toFixed(1)}%\n`);

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  log.error('Test suite failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
