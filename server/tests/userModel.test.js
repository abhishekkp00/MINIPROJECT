/**
 * User Model Test Suite
 * Tests for User schema validation, methods, and hooks
 * 
 * Run with: node server/tests/userModel.test.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

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
  header: (msg) => console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}\n${msg}\n${colors.blue}${'='.repeat(60)}${colors.reset}`),
  subheader: (msg) => console.log(`\n${colors.gray}${'-'.repeat(60)}${colors.reset}\n${msg}${colors.gray}${'-'.repeat(60)}${colors.reset}`)
};

// Test counter
let testsPassed = 0;
let testsFailed = 0;

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
    await User.deleteMany({});
    log.info('Test data cleaned up');
  } catch (error) {
    log.warn('Cleanup failed: ' + error.message);
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

// Test 1: Create valid user
async function testCreateValidUser() {
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'student'
  };
  
  const user = await User.create(userData);
  
  if (!user) throw new Error('User not created');
  if (user.name !== userData.name) throw new Error('Name mismatch');
  if (user.email !== userData.email) throw new Error('Email mismatch');
  if (user.role !== userData.role) throw new Error('Role mismatch');
  if (user.password === userData.password) throw new Error('Password not hashed');
  if (!user.createdAt) throw new Error('createdAt not set');
  if (!user.updatedAt) throw new Error('updatedAt not set');
}

// Test 2: Validate required fields
async function testRequiredFields() {
  try {
    await User.create({});
    throw new Error('Should have failed validation');
  } catch (error) {
    if (!error.message.includes('required')) {
      throw new Error('Validation error not for required fields');
    }
  }
}

// Test 3: Validate email format
async function testEmailValidation() {
  try {
    await User.create({
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123'
    });
    throw new Error('Should have failed email validation');
  } catch (error) {
    if (!error.message.includes('valid email')) {
      throw new Error('Email validation not triggered');
    }
  }
}

// Test 4: Validate unique email
async function testUniqueEmail() {
  const userData = {
    name: 'User One',
    email: 'unique@example.com',
    password: 'password123'
  };
  
  await User.create(userData);
  
  try {
    await User.create({
      name: 'User Two',
      email: 'unique@example.com',
      password: 'password456'
    });
    throw new Error('Should have failed unique constraint');
  } catch (error) {
    if (!error.message.includes('duplicate') && !error.code === 11000) {
      throw new Error('Unique constraint not enforced');
    }
  }
}

// Test 5: Validate role enum
async function testRoleEnum() {
  try {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'invalid-role'
    });
    throw new Error('Should have failed role validation');
  } catch (error) {
    if (!error.message.includes('not a valid role')) {
      throw new Error('Role enum validation not triggered');
    }
  }
}

// Test 6: Test password hashing (pre-save hook)
async function testPasswordHashing() {
  const plainPassword = 'mySecretPassword123';
  const user = await User.create({
    name: 'Hash Test',
    email: 'hash@example.com',
    password: plainPassword
  });
  
  if (user.password === plainPassword) {
    throw new Error('Password was not hashed');
  }
  
  // Fetch user with password field
  const userWithPassword = await User.findById(user._id).select('+password');
  if (!userWithPassword.password.startsWith('$2')) {
    throw new Error('Password not hashed with bcrypt');
  }
}

// Test 7: Test password not hashed if not modified
async function testPasswordNotHashedIfNotModified() {
  const user = await User.create({
    name: 'No Rehash Test',
    email: 'norehash@example.com',
    password: 'password123'
  });
  
  const userWithPassword = await User.findById(user._id).select('+password');
  const hashedPassword = userWithPassword.password;
  
  // Update user without modifying password
  userWithPassword.name = 'Updated Name';
  await userWithPassword.save();
  
  const updatedUser = await User.findById(user._id).select('+password');
  
  if (updatedUser.password !== hashedPassword) {
    throw new Error('Password was rehashed when it should not have been');
  }
}

// Test 8: Test comparePassword method
async function testComparePassword() {
  const plainPassword = 'testPassword456';
  const user = await User.create({
    name: 'Compare Test',
    email: 'compare@example.com',
    password: plainPassword
  });
  
  const userWithPassword = await User.findById(user._id).select('+password');
  
  // Test correct password
  const isMatch = await userWithPassword.comparePassword(plainPassword);
  if (!isMatch) {
    throw new Error('Correct password not matched');
  }
  
  // Test incorrect password
  const isNotMatch = await userWithPassword.comparePassword('wrongPassword');
  if (isNotMatch) {
    throw new Error('Incorrect password matched');
  }
}

// Test 9: Test generateAuthToken method
async function testGenerateAuthToken() {
  const user = await User.create({
    name: 'Token Test',
    email: 'token@example.com',
    password: 'password123'
  });
  
  const token = user.generateAuthToken();
  
  if (!token) {
    throw new Error('Token not generated');
  }
  
  if (typeof token !== 'string') {
    throw new Error('Token is not a string');
  }
  
  // Token should have 3 parts (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
}

// Test 10: Test generateRefreshToken method
async function testGenerateRefreshToken() {
  const user = await User.create({
    name: 'Refresh Test',
    email: 'refresh@example.com',
    password: 'password123'
  });
  
  const refreshToken = user.generateRefreshToken();
  
  if (!refreshToken) {
    throw new Error('Refresh token not generated');
  }
  
  if (typeof refreshToken !== 'string') {
    throw new Error('Refresh token is not a string');
  }
}

// Test 11: Test password not returned by default
async function testPasswordNotReturned() {
  const user = await User.create({
    name: 'Privacy Test',
    email: 'privacy@example.com',
    password: 'password123'
  });
  
  const foundUser = await User.findById(user._id);
  
  if (foundUser.password !== undefined) {
    throw new Error('Password field should not be included by default');
  }
}

// Test 12: Test getPublicProfile method
async function testGetPublicProfile() {
  const user = await User.create({
    name: 'Profile Test',
    email: 'profile@example.com',
    password: 'password123',
    bio: 'Test bio',
    skills: ['JavaScript', 'Node.js']
  });
  
  const profile = user.getPublicProfile();
  
  if (!profile._id) throw new Error('Profile missing _id');
  if (!profile.name) throw new Error('Profile missing name');
  if (!profile.email) throw new Error('Profile missing email');
  if (profile.password) throw new Error('Profile should not include password');
  if (profile.resetPasswordToken) throw new Error('Profile should not include sensitive data');
}

// Test 13: Test findByCredentials static method
async function testFindByCredentials() {
  const email = 'credentials@example.com';
  const password = 'password123';
  
  await User.create({
    name: 'Credentials Test',
    email: email,
    password: password
  });
  
  // Test with correct credentials
  const user = await User.findByCredentials(email, password);
  if (!user) {
    throw new Error('User not found with correct credentials');
  }
  
  // Test with incorrect password
  try {
    await User.findByCredentials(email, 'wrongPassword');
    throw new Error('Should have failed with incorrect password');
  } catch (error) {
    if (!error.message.includes('Invalid login credentials')) {
      throw new Error('Wrong error message for invalid credentials');
    }
  }
  
  // Test with non-existent email
  try {
    await User.findByCredentials('nonexistent@example.com', password);
    throw new Error('Should have failed with non-existent email');
  } catch (error) {
    if (!error.message.includes('Invalid login credentials')) {
      throw new Error('Wrong error message for non-existent user');
    }
  }
}

// Test 14: Test default values
async function testDefaultValues() {
  const user = await User.create({
    name: 'Defaults Test',
    email: 'defaults@example.com',
    password: 'password123'
  });
  
  if (user.role !== 'student') throw new Error('Default role not set');
  if (!user.avatar.includes('placeholder')) throw new Error('Default avatar not set');
  if (!user.isActive) throw new Error('Default isActive not set');
  if (user.isVerified !== false) throw new Error('Default isVerified should be false');
  if (user.isOnline !== false) throw new Error('Default isOnline should be false');
  if (!user.notifications.email) throw new Error('Default email notifications not enabled');
}

// Test 15: Test projectCount virtual
async function testProjectCountVirtual() {
  const user = await User.create({
    name: 'Virtual Test',
    email: 'virtual@example.com',
    password: 'password123',
    projects: []
  });
  
  if (user.projectCount !== 0) {
    throw new Error('projectCount virtual not working for empty array');
  }
}

// Test 16: Test optional fields
async function testOptionalFields() {
  const user = await User.create({
    name: 'Optional Test',
    email: 'optional@example.com',
    password: 'password123',
    bio: 'This is a bio',
    skills: ['React', 'MongoDB'],
    department: 'Computer Science',
    rollNumber: 'CS2021001'
  });
  
  if (user.bio !== 'This is a bio') throw new Error('Bio not saved');
  if (user.skills.length !== 2) throw new Error('Skills not saved');
  if (user.department !== 'Computer Science') throw new Error('Department not saved');
  if (user.rollNumber !== 'CS2021001') throw new Error('Roll number not saved');
}

// Test 17: Test all three roles
async function testAllRoles() {
  const roles = ['student', 'team-lead', 'mentor'];
  
  for (const role of roles) {
    const user = await User.create({
      name: `${role} Test`,
      email: `${role}@example.com`,
      password: 'password123',
      role: role
    });
    
    if (user.role !== role) {
      throw new Error(`Role ${role} not set correctly`);
    }
  }
}

// Test 18: Test timestamps
async function testTimestamps() {
  const user = await User.create({
    name: 'Timestamp Test',
    email: 'timestamp@example.com',
    password: 'password123'
  });
  
  if (!user.createdAt) throw new Error('createdAt not set');
  if (!user.updatedAt) throw new Error('updatedAt not set');
  
  const createdAt = user.createdAt;
  
  // Wait a moment and update
  await new Promise(resolve => setTimeout(resolve, 100));
  user.name = 'Updated Name';
  await user.save();
  
  if (user.updatedAt.getTime() <= createdAt.getTime()) {
    throw new Error('updatedAt not updated on save');
  }
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function runAllTests() {
  log.header('🧪 USER MODEL TEST SUITE');
  
  await connectDB();
  
  log.subheader('🔧 Schema Validation Tests');
  await runTest('1. Create valid user', testCreateValidUser);
  await cleanupDB();
  await runTest('2. Validate required fields', testRequiredFields);
  await cleanupDB();
  await runTest('3. Validate email format', testEmailValidation);
  await cleanupDB();
  await runTest('4. Validate unique email', testUniqueEmail);
  await cleanupDB();
  await runTest('5. Validate role enum', testRoleEnum);
  await cleanupDB();
  
  log.subheader('🔐 Password & Authentication Tests');
  await runTest('6. Password hashing on create', testPasswordHashing);
  await cleanupDB();
  await runTest('7. Password not rehashed if not modified', testPasswordNotHashedIfNotModified);
  await cleanupDB();
  await runTest('8. Compare password method', testComparePassword);
  await cleanupDB();
  await runTest('9. Generate auth token', testGenerateAuthToken);
  await cleanupDB();
  await runTest('10. Generate refresh token', testGenerateRefreshToken);
  await cleanupDB();
  await runTest('11. Password not returned by default', testPasswordNotReturned);
  await cleanupDB();
  
  log.subheader('👤 User Methods Tests');
  await runTest('12. Get public profile method', testGetPublicProfile);
  await cleanupDB();
  await runTest('13. Find by credentials static method', testFindByCredentials);
  await cleanupDB();
  
  log.subheader('⚙️  Default Values & Optional Fields Tests');
  await runTest('14. Test default values', testDefaultValues);
  await cleanupDB();
  await runTest('15. Test projectCount virtual', testProjectCountVirtual);
  await cleanupDB();
  await runTest('16. Test optional fields', testOptionalFields);
  await cleanupDB();
  await runTest('17. Test all roles', testAllRoles);
  await cleanupDB();
  await runTest('18. Test timestamps', testTimestamps);
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
