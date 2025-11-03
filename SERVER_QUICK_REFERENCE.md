# 🚀 Server.js Quick Reference Guide

## File Overview
**Location**: `server/server.js`  
**Lines**: 173  
**Status**: ✅ Production-Ready  

---

## Quick Start

### Start Server
```bash
cd server
node server.js
```

### Development Mode (Auto-reload)
```bash
npm run dev
```

### Expected Output
```
================================================
🚀 Server running in development mode
📡 API Server: http://localhost:5000
🔌 Socket.IO: ws://localhost:5000
🌐 Client URL: http://localhost:5173
================================================

✅ MongoDB Connected Successfully!
📡 Host: localhost
📁 Database: project-management
🔢 Port: 27017
🏷️  Connection Type: Local MongoDB
```

---

## API Endpoints

### Health Check
```bash
curl http://localhost:5000/api/health
```
**Response**:
```json
{
    "success": true,
    "message": "Server is running",
    "timestamp": "2025-11-02T15:45:37.832Z",
    "environment": "development"
}
```

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

---

## Socket.IO Events

### Client → Server

#### Join Project Room
```javascript
socket.emit('join-project', projectId);
```

#### Leave Project Room
```javascript
socket.emit('leave-project', projectId);
```

#### Send Message
```javascript
socket.emit('send-message', {
  projectId: 'project123',
  message: 'Hello!',
  userId: 'user123'
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  projectId: 'project123',
  userId: 'user123',
  userName: 'John Doe'
});
```

### Server → Client

#### New Message
```javascript
socket.on('new-message', (data) => {
  console.log('New message:', data);
});
```

#### User Typing
```javascript
socket.on('user-typing', (data) => {
  console.log(`${data.userName} is typing...`);
});
```

---

## Middleware Stack

### Applied Middleware (in order)
1. **Helmet** - Security headers
2. **CORS** - Cross-origin requests
3. **express.json()** - JSON body parser (10mb limit)
4. **express.urlencoded()** - URL-encoded parser (10mb limit)
5. **cookieParser** - Cookie parsing
6. **compression** - Response compression
7. **morgan** - HTTP logging (dev mode only)

---

## Environment Variables

### Required
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-management
JWT_SECRET=your_secret_key
```

### Optional
```env
NODE_ENV=development
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Error Handling

### Handled Errors
1. ✅ 404 Not Found - Invalid routes
2. ✅ 500 Server Errors - Application errors
3. ✅ Unhandled Promise Rejections
4. ✅ Uncaught Exceptions
5. ✅ SIGTERM Signals - Graceful shutdown

### Custom Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "stack": "Stack trace (dev mode only)"
}
```

---

## Using Socket.IO in Routes

### Access Socket.IO Instance
```javascript
export const myController = async (req, res) => {
  // Get Socket.IO instance
  const io = req.app.get('io');
  
  // Emit to specific room
  io.to('project-123').emit('update', {
    message: 'Project updated!'
  });
  
  // Emit to all clients
  io.emit('notification', {
    message: 'Server maintenance in 5 minutes'
  });
  
  res.json({ success: true });
};
```

---

## Adding New Routes

### Step 1: Create Route File
```javascript
// server/routes/newRoute.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'New route works!' });
});

export default router;
```

### Step 2: Import in server.js
```javascript
import newRoutes from './routes/newRoute.js';
```

### Step 3: Use Route
```javascript
app.use('/api/new', newRoutes);
```

---

## Testing the Server

### Manual Tests
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test with verbose output
curl -v http://localhost:5000/api/health

# Test POST endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'
```

### Using Postman
1. Import collection from `docs/postman/`
2. Set environment variables
3. Run tests

---

## Debugging

### Enable Debug Logging
```bash
DEBUG=* node server.js
```

### Check MongoDB Connection
```javascript
// In any route
const mongoose = require('mongoose');
console.log('MongoDB State:', mongoose.connection.readyState);
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
```

### Socket.IO Debug
```javascript
// Client-side
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  debug: true
});
```

---

## Performance Tips

### 1. Enable Compression
Already configured in server.js:
```javascript
app.use(compression());
```

### 2. Set Proper Limits
```javascript
app.use(express.json({ limit: '10mb' })); // Adjust as needed
```

### 3. Use MongoDB Indexes
Indexes are configured in models for better query performance.

### 4. Enable HTTP/2 (Production)
```javascript
import http2 from 'http2';
const server = http2.createSecureServer(options, app);
```

---

## Security Best Practices

### Already Implemented ✅
- ✅ Helmet security headers
- ✅ CORS properly configured
- ✅ Request size limits (10mb)
- ✅ Cookie parsing for secure auth
- ✅ Environment variables for secrets
- ✅ Graceful error handling

### Additional Recommendations
1. Use rate limiting for API endpoints
2. Implement request validation
3. Use HTTPS in production
4. Regular security audits with `npm audit`

---

## Deployment

### Environment Setup
```bash
# Production environment
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
CLIENT_URL=https://your-domain.com
```

### PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name "api-server"

# Monitor
pm2 monit

# Logs
pm2 logs api-server
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :5000

# Kill process on port
kill -9 $(lsof -ti:5000)
```

### MongoDB Connection Failed
```bash
# Check MongoDB status
systemctl status mongod

# Start MongoDB
systemctl start mongod
```

### Socket.IO Not Connecting
- Check CORS settings
- Verify client URL in environment
- Check firewall settings

---

## File Structure
```
server/
├── server.js              ← Main server file
├── config/
│   └── db.js             ← MongoDB connection
├── middleware/
│   ├── auth.js           ← Authentication
│   └── errorHandler.js   ← Error handling
├── routes/
│   └── auth.js           ← Auth routes
├── models/               ← Mongoose models
├── controllers/          ← Business logic
└── services/            ← External services
```

---

## Summary

✅ **Complete Express.js Server** with:
- Modern ES6 syntax
- MongoDB integration
- Socket.IO for real-time features
- Comprehensive error handling
- Security middleware (Helmet, CORS)
- Production-ready configuration
- Well-documented code

**Status**: 🟢 Operational and tested!

---

**Last Updated**: November 2, 2025  
**Version**: 1.0.0  
**Server**: http://localhost:5000
