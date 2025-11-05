# 🔧 PERMANENT FIX: Backend Server Connection

## ❌ Problem
```bash
curl: (7) Failed to connect to localhost port 5000 after 0 ms: Couldn't connect to server
```

**Root Cause:** Backend server is not running or was stopped.

---

## ✅ PERMANENT SOLUTIONS

### Solution 1: Use Dedicated Terminal (RECOMMENDED)

#### Step 1: Open a New Terminal
Open a **separate terminal window** dedicated to the backend server.

#### Step 2: Start Backend
```bash
cd /home/abhishek/MINIPROJECT/server
npm run dev
```

#### Step 3: Leave It Running
**IMPORTANT:** 
- ✅ **DO NOT** press Ctrl+C
- ✅ **DO NOT** close this terminal
- ✅ Keep this terminal open and running
- ✅ Use other terminals for testing/commands

#### Step 4: Test in Another Terminal
Open a **new terminal** for testing:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}'
```

---

### Solution 2: Use Background Process with nohup

#### Start Server in Background
```bash
cd /home/abhishek/MINIPROJECT/server
nohup npm run dev > server.log 2>&1 &
```

#### Check If Running
```bash
lsof -ti:5000
# Should show a process ID
```

#### View Logs
```bash
tail -f /home/abhishek/MINIPROJECT/server/server.log
```

#### Stop Server When Needed
```bash
kill $(lsof -ti:5000)
```

---

### Solution 3: Use PM2 (Production-Grade)

#### Install PM2 Globally
```bash
npm install -g pm2
```

#### Start Server with PM2
```bash
cd /home/abhishek/MINIPROJECT/server
pm2 start npm --name "backend" -- run dev
```

#### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs backend

# Stop server
pm2 stop backend

# Restart server
pm2 restart backend

# Delete from PM2
pm2 delete backend

# Start on system boot (optional)
pm2 startup
pm2 save
```

---

### Solution 4: Use tmux/screen (Keep Running After Logout)

#### Using tmux
```bash
# Install tmux if not installed
sudo apt install tmux

# Start tmux session
tmux new -s backend

# Inside tmux, start server
cd /home/abhishek/MINIPROJECT/server
npm run dev

# Detach from tmux: Press Ctrl+B, then D
# Server keeps running!

# Reattach later
tmux attach -t backend

# Kill tmux session
tmux kill-session -t backend
```

---

## 🎯 QUICK START GUIDE

### For Development (Daily Use)

**Terminal 1 - Backend (Keep Running):**
```bash
cd /home/abhishek/MINIPROJECT/server
npm run dev
```
**Leave this terminal open!**

**Terminal 2 - Frontend (Keep Running):**
```bash
cd /home/abhishek/MINIPROJECT/client
npm run dev
```
**Leave this terminal open!**

**Terminal 3 - Testing/Commands:**
```bash
# Use this terminal for curl commands, git, etc.
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}'
```

---

## 🔍 Troubleshooting

### Check If Server Is Running
```bash
lsof -ti:5000
```
- **If output shows a number:** Server is running ✅
- **If no output:** Server is not running ❌

### Check MongoDB Connection
```bash
curl http://localhost:5000/api/health
```
Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "...",
  "environment": "development"
}
```

### View Server Logs
If using nohup:
```bash
tail -f /home/abhishek/MINIPROJECT/server/server.log
```

If using PM2:
```bash
pm2 logs backend
```

### Kill Stuck Processes
```bash
# Find process on port 5000
lsof -ti:5000

# Kill it
kill -9 $(lsof -ti:5000)

# Then restart
cd /home/abhishek/MINIPROJECT/server
npm run dev
```

---

## ⚙️ VS Code Setup (Recommended)

### Use Integrated Terminal

1. **Open VS Code**
2. **Open Terminal:** View → Terminal (or Ctrl+`)
3. **Split Terminal:** Click the split icon
4. **Terminal 1 (Left):** Backend
   ```bash
   cd server
   npm run dev
   ```
5. **Terminal 2 (Right):** Frontend or testing
   ```bash
   cd client
   npm run dev
   ```

**Advantages:**
- ✅ Both servers visible
- ✅ Easy to monitor
- ✅ No need to switch windows

---

## 🚀 Automated Startup Script

### Use the Provided Script

```bash
# Start backend
/home/abhishek/MINIPROJECT/start_backend.sh
```

Or create `start_all.sh` for both frontend and backend:

```bash
#!/bin/bash
# Start both servers

# Start backend in background
cd /home/abhishek/MINIPROJECT/server
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend in background
cd /home/abhishek/MINIPROJECT/client
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "Servers are running!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "To stop servers:"
echo "kill $BACKEND_PID $FRONTEND_PID"
```

---

## 📊 Status Check Script

Create `check_servers.sh`:

```bash
#!/bin/bash

echo "🔍 Checking Server Status..."
echo ""

# Check backend
if lsof -ti:5000 > /dev/null; then
    echo "✅ Backend: Running on port 5000"
else
    echo "❌ Backend: Not running"
fi

# Check frontend
if lsof -ti:5173 > /dev/null; then
    echo "✅ Frontend: Running on port 5173"
else
    echo "❌ Frontend: Not running"
fi

# Test backend API
echo ""
echo "🧪 Testing Backend API..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Backend API: Responding"
else
    echo "❌ Backend API: Not responding"
fi
```

---

## 🎯 Best Practices

### ✅ DO:
1. **Keep backend terminal open** - Don't close it
2. **Use separate terminals** - One for backend, one for testing
3. **Check server status** before testing - Use `lsof -ti:5000`
4. **Monitor logs** - Watch for errors
5. **Use PM2 for production** - More reliable

### ❌ DON'T:
1. **Don't press Ctrl+C** in backend terminal (stops server)
2. **Don't close backend terminal** (stops server)
3. **Don't run tests in backend terminal** (might interrupt server)
4. **Don't forget to check MongoDB connection** (server won't work without it)

---

## 🔧 Environment Variables

Make sure `.env` is properly configured:

```bash
# Server
PORT=5000

# MongoDB (Already working)
MONGODB_URI=mongodb+srv://abhishekforcollege_db_user:Abhishek12321@cluster0.ejewyi9.mongodb.net/project-management?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_SECRET=6f48f55bcaed1ec7c76d0bca05092f6b874937b6b350c06c3fa67591f96aa36b60ecd2d30a977d38fa25fec9632e59d8e00ca9691d56cfc4f37c0fc5a50fefbf
JWT_EXPIRE=7d

# Client
CLIENT_URL=http://localhost:5173
```

---

## ✅ CURRENT STATUS

After following any solution above:

```bash
# Check backend is running
curl http://localhost:5000/api/health

# Should return:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-03T...",
  "environment": "development"
}
```

---

## 🎉 Summary

**Problem:** Server stops when terminal closes or Ctrl+C is pressed

**Solutions:**
1. **Simplest:** Keep backend terminal open (recommended for development)
2. **Background:** Use `nohup` or `&` to run in background
3. **Production:** Use PM2 for automatic restart and monitoring
4. **Persistent:** Use tmux/screen to keep running after logout

**Choose Solution 1** for daily development - just keep the terminal open!

---

## 📞 Quick Reference

```bash
# Start backend (keep terminal open)
cd /home/abhishek/MINIPROJECT/server && npm run dev

# Check if running
lsof -ti:5000

# Test API
curl http://localhost:5000/api/health

# Stop (if needed)
kill $(lsof -ti:5000)
```

**Remember: Keep the backend terminal open and don't press Ctrl+C!** ✅
