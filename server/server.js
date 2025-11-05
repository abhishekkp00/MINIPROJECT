/**
 * Main Server File
 * Express application with Socket.IO, middleware, and routes
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import chatRoutes from './routes/chat.js';
import aiRoutes from './routes/ai.js';

// Import models to register them with Mongoose
import './models/User.js';
import './models/Project.js';
import './models/Task.js';
import './models/Chat.js';
import './models/Message.js';

// Import Socket.IO handler
import socketHandler from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with enhanced configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  // Connection settings
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  connectTimeout: 45000, // 45 seconds
  // Max HTTP buffer size for large file uploads
  maxHttpBufferSize: 1e8, // 100MB
  // Allow upgrades from long-polling to WebSocket
  allowUpgrades: true,
  // Transport methods
  transports: ['websocket', 'polling'],
  // Cookie settings
  cookie: {
    name: 'io',
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  }
});

// Make io accessible in routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// ==================== MIDDLEWARE ====================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

// ==================== SOCKET.IO ====================

// Socket.IO connection monitoring
io.engine.on('connection_error', (err) => {
  console.error('🔴 Socket.IO Connection Error:', {
    message: err.message,
    code: err.code,
    type: err.type
  });
});

// Initialize Socket.IO handler with authentication and full features
socketHandler(io);

console.log('🔌 Socket.IO initialized with the following:');
console.log('   - Authentication: JWT required');
console.log('   - Transports: WebSocket, Polling');
console.log('   - Ping Timeout: 60s');
console.log('   - Max Buffer: 100MB');

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log('');
  console.log('================================================');
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 API Server: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log('================================================');
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  httpServer.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Process terminated');
  });
});

export default app;
