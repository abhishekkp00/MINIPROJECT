# Backend-Frontend Connection Guide

## ✅ Connection Issues Resolved!

### Problem
Backend and frontend were not properly connected due to CORS configuration only allowing port 5173, but frontend was running on port 5174.

### Solution Applied
Updated backend CORS configuration to allow both ports 5173 and 5174.

---

## 🔧 Changes Made

### 1. **Backend CORS Configuration** (`server/server.js`)

**Before:**
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};
```

**After:**
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 2. **Socket.IO CORS Configuration** (`server/server.js`)

**Before:**
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});
```

**After:**
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST']
  }
});
```

### 3. **Connection Test Page Created** (`client/src/pages/ConnectionTest.jsx`)

Added a comprehensive test page to verify:
- Direct API connection
- Vite proxy connection
- Authentication endpoints
- Error handling

---

## 🌐 Current Setup

### **Backend Server**
- **URL:** http://localhost:5000
- **API Base:** http://localhost:5000/api
- **Status:** ✅ Running
- **CORS Enabled For:**
  - http://localhost:5173
  - http://localhost:5174 (current frontend)
  - http://localhost:3000

### **Frontend Server**
- **URL:** http://localhost:5174
- **Proxy:** Configured to proxy `/api` to backend
- **Status:** ✅ Running
- **Environment:** Development

### **API Configuration**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🧪 How to Test Connection

### **Method 1: Connection Test Page**
Visit: http://localhost:5174/test-connection

This page provides three test buttons:
1. **Test Health (Direct)** - Tests direct connection to backend
2. **Test Health (Proxy)** - Tests Vite proxy configuration
3. **Test Login** - Tests authentication endpoint

### **Method 2: Browser Console**
Open browser console (F12) and run:

```javascript
// Test health endpoint
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log('Health:', data))
  .catch(err => console.error('Error:', err));

// Test via proxy
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log('Proxy Health:', data))
  .catch(err => console.error('Error:', err));

// Test login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'testuser@example.com',
    password: 'password123'
  })
})
  .then(res => res.json())
  .then(data => console.log('Login:', data))
  .catch(err => console.error('Error:', err));
```

### **Method 3: Terminal cURL**
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}'
```

---

## 📡 API Endpoints Available

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout user

### **Health Check**
- `GET /api/health` - Server health status

---

## 🔍 How Frontend Connects to Backend

### **1. Direct API Calls**
Using the full URL from environment variable:
```javascript
const API_URL = import.meta.env.VITE_API_URL; // 'http://localhost:5000/api'
axios.get(`${API_URL}/health`);
```

### **2. Via Vite Proxy** (Recommended for development)
Using relative URLs that Vite proxies:
```javascript
// This gets proxied to http://localhost:5000/api/health
axios.get('/api/health');
```

**Vite Proxy Configuration** (`client/vite.config.js`):
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false
  }
}
```

### **3. AuthContext Integration**
The AuthContext automatically handles API calls:
```javascript
import { useAuth } from './context/AuthContext';

const { login, user, logout } = useAuth();

// Login
await login(email, password);

// Access user data
console.log(user);

// Logout
await logout();
```

---

## 🛠️ Troubleshooting

### **Issue: CORS Error**
**Error:** `Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5174' has been blocked by CORS policy`

**Solution:** ✅ Already fixed! Backend now allows port 5174.

### **Issue: Connection Refused**
**Error:** `ERR_CONNECTION_REFUSED`

**Check:**
1. Is backend running? `curl http://localhost:5000/api/health`
2. Is frontend running? Visit http://localhost:5174
3. Check terminal for errors

**Restart servers:**
```bash
# Backend
cd server && npm run dev

# Frontend (new terminal)
cd client && npm run dev
```

### **Issue: 401 Unauthorized**
**Error:** `401 Unauthorized` on protected routes

**Solution:**
1. Login first to get a token
2. Token is automatically stored in localStorage
3. AuthContext automatically adds token to requests

### **Issue: Network Error**
**Error:** `Network Error` in axios

**Check:**
1. Backend is running
2. Correct API URL in `.env`
3. CORS is properly configured
4. Firewall not blocking ports

---

## 🎯 Quick Start Guide

### **1. Start Backend**
```bash
cd /home/abhishek/MINIPROJECT/server
npm run dev
```
Should see:
```
✅ MongoDB Connected Successfully!
🚀 Server running on http://localhost:5000
```

### **2. Start Frontend**
```bash
cd /home/abhishek/MINIPROJECT/client
npm run dev
```
Should see:
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5174/
```

### **3. Test Connection**
Visit: http://localhost:5174/test-connection

Click all three test buttons. All should show green (success).

### **4. Test Login Flow**
1. Visit: http://localhost:5174/login
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `password123`
3. Click "Sign in"
4. Should redirect to dashboard

---

## 📊 Connection Flow Diagram

```
Frontend (5174)
    ↓
    ├─ Direct Call: http://localhost:5000/api/health
    │   ↓
    │   Backend (5000) checks CORS
    │   ↓
    │   ✅ Origin allowed (5174)
    │   ↓
    │   Returns response
    │
    └─ Proxy Call: /api/health
        ↓
        Vite Proxy intercepts
        ↓
        Forwards to http://localhost:5000/api/health
        ↓
        Backend (5000) checks CORS
        ↓
        ✅ Origin allowed (5174)
        ↓
        Returns response to Vite
        ↓
        Vite returns to frontend
```

---

## ✅ Verification Checklist

- [✅] Backend server running on port 5000
- [✅] Frontend server running on port 5174
- [✅] CORS configured for port 5174
- [✅] Socket.IO CORS configured
- [✅] API endpoints responding
- [✅] Connection test page created
- [✅] AuthContext configured with correct API URL
- [✅] Vite proxy configured
- [✅] Environment variables set

---

## 🚀 Next Steps

1. **Test the connection** at http://localhost:5174/test-connection
2. **Try logging in** at http://localhost:5174/login
3. **Access dashboard** after login
4. **Check browser console** for any errors
5. **Review network tab** to see API calls

---

## 📝 Files Modified

1. `/server/server.js` - Updated CORS configuration
2. `/client/src/pages/ConnectionTest.jsx` - Created test page
3. `/client/src/App.jsx` - Added test route

---

## 🎉 Connection Status: FIXED! ✅

Your backend and frontend are now properly connected!

- Backend accepts requests from port 5174
- CORS is properly configured
- Proxy is set up correctly
- Test page available for verification

**Test it now:** http://localhost:5174/test-connection
