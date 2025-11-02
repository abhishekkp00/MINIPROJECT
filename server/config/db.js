/**
 * MongoDB Database Connection Configuration
 * Establishes connection to MongoDB using Mongoose ODM
 * Supports both local MongoDB and MongoDB Atlas
 * Includes retry logic and comprehensive error handling
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB database with retry logic
 * @param {number} retries - Number of retry attempts (default: 5)
 * @returns {Promise<void>}
 */
const connectDB = async (retries = 5) => {
  // Connection options for better stability
  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2, // Minimum number of connections in the pool
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Validate MongoDB URI
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      console.log(`🔄 Connecting to MongoDB (Attempt ${attempt}/${retries})...`);

      // Connect to MongoDB
      const conn = await mongoose.connect(process.env.MONGODB_URI, options);

      console.log('\n================================================');
      console.log('✅ MongoDB Connected Successfully!');
      console.log(`📡 Host: ${conn.connection.host}`);
      console.log(`📁 Database: ${conn.connection.name}`);
      console.log(`🔢 Port: ${conn.connection.port || 'N/A'}`);
      console.log(`🏷️  Connection Type: ${process.env.MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
      console.log('================================================\n');

      // Setup connection event listeners
      setupConnectionListeners();

      // Setup graceful shutdown handlers
      setupGracefulShutdown();

      return; // Exit on successful connection

    } catch (error) {
      console.error(`\n❌ MongoDB Connection Failed (Attempt ${attempt}/${retries})`);
      console.error(`📋 Error: ${error.message}`);

      // If it's the last attempt, exit the process
      if (attempt === retries) {
        console.error('\n================================================');
        console.error('❌ FATAL: Could not connect to MongoDB');
        console.error('================================================');
        console.error('Troubleshooting steps:');
        console.error('1. Check MONGODB_URI in .env file');
        console.error('2. Ensure MongoDB is running (local) or accessible (Atlas)');
        console.error('3. Verify network connectivity');
        console.error('4. Check MongoDB Atlas IP whitelist (if using Atlas)');
        console.error('5. Verify username/password are correct');
        console.error('================================================\n');
        process.exit(1);
      }

      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying in ${waitTime / 1000} seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

/**
 * Setup connection event listeners
 */
const setupConnectionListeners = () => {
  // Connection error handler
  mongoose.connection.on('error', (err) => {
    console.error(`\n❌ MongoDB Runtime Error: ${err.message}`);
  });

  // Disconnection handler
  mongoose.connection.on('disconnected', () => {
    console.warn('\n⚠️  MongoDB Disconnected. Attempting to reconnect...');
  });

  // Reconnection handler
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB Reconnected Successfully');
  });

  // Connection lost handler
  mongoose.connection.on('close', () => {
    console.log('🔌 MongoDB Connection Closed');
  });
};

/**
 * Setup graceful shutdown handlers
 */
const setupGracefulShutdown = () => {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    await gracefulShutdown('SIGINT');
  });

  // Handle SIGTERM (kill command)
  process.on('SIGTERM', async () => {
    await gracefulShutdown('SIGTERM');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('\n❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.name, error.message);
    await gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('\n❌ UNHANDLED REJECTION! Shutting down...');
    console.error('Reason:', reason);
    await gracefulShutdown('unhandledRejection');
  });
};

/**
 * Gracefully close MongoDB connection
 * @param {string} signal - Signal that triggered the shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n👋 ${signal} received. Shutting down gracefully...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed successfully');
    console.log('✅ Process terminated\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

/**
 * Check database connection status
 * @returns {boolean} - True if connected, false otherwise
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get connection state string
 * @returns {string} - Connection state description
 */
export const getConnectionState = () => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
    99: 'Uninitialized'
  };
  return states[mongoose.connection.readyState] || 'Unknown';
};

export default connectDB;
