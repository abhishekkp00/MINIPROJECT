/**
 * MongoDB Connection Usage Examples
 * How to use the enhanced db.js connection file
 * 
 * NOTE: This is a documentation file with multiple separate examples.
 * Each example is independent and should NOT be run together.
 * Copy only the specific example you need into your actual code.
 */

/* eslint-disable */
// Disable linting for this examples-only file

// ============================================
// EXAMPLE 1: Basic Usage (in server.js)
// ============================================

import connectDB from './config/db.js';

// Simple connection
await connectDB();

// ============================================
// EXAMPLE 2: With Custom Retry Count
// ============================================

import connectDB from './config/db.js';

// Connect with 3 retries instead of default 5
await connectDB(3);

// ============================================
// EXAMPLE 3: Check Connection Status
// ============================================

import { isConnected, getConnectionState } from './config/db.js';

// Check if connected
if (isConnected()) {
  console.log('✅ Database is connected');
} else {
  console.log('❌ Database is not connected');
}

// Get detailed connection state
const state = getConnectionState();
console.log(`Connection State: ${state}`);
// Outputs: "Connected" | "Disconnected" | "Connecting" | "Disconnecting" | "Uninitialized"

// ============================================
// EXAMPLE 4: Use in API Routes
// ============================================

import express from 'express';
import { isConnected } from './config/db.js';

const router = express.Router();

router.get('/database-status', (req, res) => {
  if (isConnected()) {
    res.json({
      status: 'connected',
      message: 'Database is operational'
    });
  } else {
    res.status(503).json({
      status: 'disconnected',
      message: 'Database is not available'
    });
  }
});

export default router;

// ============================================
// EXAMPLE 5: Test Connection Before Starting Server
// ============================================

import express from 'express';
import connectDB from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database first
try {
  await connectDB();
  
  // Only start server if database connected
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Failed to start server due to database connection error');
  process.exit(1);
}

// ============================================
// EXAMPLE 6: Environment Variable Configuration
// ============================================

// In your .env file:

// For Local MongoDB:
// MONGODB_URI=mongodb://localhost:27017/your-database-name

// For MongoDB Atlas:
// MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/your-database-name?retryWrites=true&w=majority

// For Docker MongoDB:
// MONGODB_URI=mongodb://host.docker.internal:27017/your-database-name

// For MongoDB with Authentication:
// MONGODB_URI=mongodb://admin:password@localhost:27017/your-database-name?authSource=admin

// ============================================
// EXAMPLE 7: Testing Connection in Development
// ============================================

import mongoose from 'mongoose';
import connectDB, { isConnected, getConnectionState } from './config/db.js';

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection...\n');
  
  // Initial state
  console.log(`Initial State: ${getConnectionState()}`);
  
  // Connect
  await connectDB();
  
  // Check connection
  console.log(`After Connect: ${getConnectionState()}`);
  console.log(`Is Connected: ${isConnected()}`);
  
  // Get database info
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(`\n📊 Collections in database:`);
  collections.forEach(col => console.log(`   - ${col.name}`));
  
  // Count documents
  const User = mongoose.model('User');
  const userCount = await User.countDocuments();
  console.log(`\n👥 Total Users: ${userCount}`);
}

// Run test
testDatabaseConnection().catch(console.error);

// ============================================
// EXAMPLE 8: Error Handling in Routes
// ============================================

import express from 'express';
import { isConnected } from './config/db.js';

const router = express.Router();

// Middleware to check database connection
const checkDatabaseConnection = (req, res, next) => {
  if (!isConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again later.'
    });
  }
  next();
};

// Use middleware on routes that need database
router.post('/api/users', checkDatabaseConnection, async (req, res) => {
  // This only runs if database is connected
  // Your route logic here
});

export default router;

// ============================================
// EXAMPLE 9: Custom Connection Events
// ============================================

import mongoose from 'mongoose';
import connectDB from './config/db.js';

// Connect to database
await connectDB();

// Add custom event listeners
mongoose.connection.on('connected', () => {
  console.log('🎉 Custom event: Database connected!');
  // Send notification, update status, etc.
});

mongoose.connection.on('error', (error) => {
  console.error('🚨 Custom error handler:', error);
  // Log to external service, send alert, etc.
});

// ============================================
// EXAMPLE 10: Connection in Tests
// ============================================

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// For testing, use in-memory MongoDB
let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Cleanup
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Your tests here
test('should create user', async () => {
  // Test logic
});

// ============================================
// TROUBLESHOOTING COMMON ISSUES
// ============================================

/*
ISSUE 1: Connection Timeout
Solution: Increase serverSelectionTimeoutMS in db.js

ISSUE 2: Too Many Connections
Solution: Adjust maxPoolSize in connection options

ISSUE 3: Authentication Failed
Solution: Check MongoDB URI format and credentials
Format: mongodb://username:password@host:port/database

ISSUE 4: MongoDB Atlas IP Whitelist
Solution: Add your IP to Atlas Network Access
Or use 0.0.0.0/0 for development (not recommended for production)

ISSUE 5: SSL/TLS Certificate Errors
Solution: Add options to connection:
{
  ssl: true,
  sslValidate: false, // Only for development
}
*/

// ============================================
// PRODUCTION BEST PRACTICES
// ============================================

/*
1. Always use connection pooling (already configured)
2. Use MongoDB Atlas for production (better reliability)
3. Enable SSL/TLS in production
4. Use environment-specific URIs
5. Monitor connection health with isConnected()
6. Implement circuit breaker pattern for critical apps
7. Set up connection alerts/monitoring
8. Use read replicas for high-traffic apps
9. Implement proper error handling and retries
10. Regular backup strategy for data safety
*/
