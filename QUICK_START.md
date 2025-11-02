# 🚀 QUICK START GUIDE

## What's Been Created

✅ **Complete Backend Foundation** including:
- Package.json with all dependencies (installed)
- MongoDB schemas (User, Project, Task, Chat, Submission, Notification)
- Authentication middleware with JWT
- AI Service (OpenAI integration)
- Email Service (Nodemailer)
- Error handling middleware
- Main server file with Socket.IO
- Authentication routes and controller
- Environment configuration template

## ⚡ Get Started in 3 Steps

### Step 1: Configure Environment Variables

Edit the `.env` file that was created:

```bash
cd server
nano .env   # or use your preferred editor
```

**Required variables:**
```env
MONGODB_URI=mongodb://localhost:27017/project-management
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project-management

JWT_SECRET=your_secret_here
GEMINI_API_KEY=your_gemini_key_here
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 2: Start MongoDB

**Option A - Local MongoDB:**
```bash
sudo systemctl start mongod
```

**Option B - MongoDB Atlas:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to .env

### Step 3: Start the Server

```bash
cd server
npm run dev
```

You should see:
```
================================================
🚀 Server running in development mode
📡 API Server: http://localhost:5000
🔌 Socket.IO: ws://localhost:5000
================================================
✅ MongoDB Connected: localhost
```

## 🧪 Test Your Setup

Open a new terminal and test:

```bash
# 1. Health Check
curl http://localhost:5000/api/health

# 2. Register a User
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📁 What You Have Now

```
✅ server/
   ✅ config/db.js                 # MongoDB connection
   ✅ models/                      # All 6 database models
   ✅ controllers/authController.js # Authentication logic
   ✅ routes/auth.js               # Auth API endpoints
   ✅ middleware/
      ✅ auth.js                   # JWT protection
      ✅ errorHandler.js           # Error handling
   ✅ services/
      ✅ aiService.js              # OpenAI integration
      ✅ emailService.js           # Email notifications
   ✅ server.js                    # Main server
   ✅ package.json                 # Dependencies (installed)
   ✅ .env                         # Your configuration
```

## 🎯 Next Steps to Complete the Application

### Backend (Remaining Tasks)

1. **Create More Controllers** (optional - core is ready):
   - `projectController.js` - Project CRUD
   - `taskController.js` - Task management
   - `chatController.js` - Chat functionality
   - `aiController.js` - AI endpoints

2. **Create More Routes** (optional):
   - `projects.js` - Project endpoints
   - `tasks.js` - Task endpoints
   - `chat.js` - Chat endpoints
   - `ai.js` - AI endpoints

3. **Enhanced Socket.IO Handler** (optional):
   - Dedicated `socket/socketHandler.js`

### Frontend Setup

1. **Create React App:**
   ```bash
   cd ..
   npm create vite@latest client -- --template react
   cd client
   npm install
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install axios socket.io-client react-router-dom
   npm install chart.js react-chartjs-2
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **Configure Tailwind CSS:**
   Edit `tailwind.config.js`:
   ```js
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {
         colors: {
           primary: '#1E40AF',
           secondary: '#0891B2',
           success: '#16A34A',
           warning: '#D97706',
           danger: '#DC2626',
         }
       },
     },
     plugins: [],
   }
   ```

4. **Add to `src/index.css`:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

## 🚀 Running Full Stack

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 📝 Environment Variables Guide

### Minimal Setup (to get started):
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/project-management
JWT_SECRET=your_generated_secret
```

### Full Setup (for all features):
```env
# Add these for complete functionality
GEMINI_API_KEY=...                       # For AI features (get from https://makersuite.google.com/app/apikey)
GOOGLE_CLIENT_ID=...                     # For Google OAuth
GOOGLE_CLIENT_SECRET=...                 # For Google OAuth
EMAIL_HOST=smtp.gmail.com                # For emails
EMAIL_USER=your-email@gmail.com          # Your email
EMAIL_PASSWORD=your-app-password         # Gmail app password
```

## 🔥 Features Ready to Use

1. ✅ **User Authentication**
   - Register with email/password
   - Login and get JWT token
   - Protected routes
   - Role-based access (student, team-lead, mentor)

2. ✅ **Database Models**
   - Users with profiles and roles
   - Projects with team members
   - Tasks with assignments and deadlines
   - Real-time chat messages
   - Submissions and reviews
   - Notifications system

3. ✅ **AI Integration (Google Gemini)**
   - Chat analysis
   - Risk detection
   - Participation tracking
   - Smart suggestions
   - Deadline predictions

4. ✅ **Real-Time Features**
   - Socket.IO configured
   - Ready for live chat
   - Real-time notifications

5. ✅ **Email Notifications**
   - Welcome emails
   - Task assignments
   - Deadline reminders
   - Mentor feedback

## 🐛 Common Issues & Solutions

### Issue: MongoDB Connection Failed
```bash
# Solution 1: Start MongoDB locally
sudo systemctl start mongod

# Solution 2: Use MongoDB Atlas
# Get connection string from MongoDB Atlas and update .env
```

### Issue: Port 5000 Already in Use
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
PORT=5001
```

### Issue: JWT_SECRET Not Set
```bash
# Generate a new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output to .env
```

### Issue: Gemini API Errors
```bash
# AI features will use fallback logic if API fails
# Add valid GEMINI_API_KEY to .env for full AI functionality
# Get your key from: https://makersuite.google.com/app/apikey
```

## 📊 Project Timeline

**Week 1 Progress:**
- ✅ Day 1-2: Backend setup (COMPLETE!)
- ⏳ Day 3-4: Controllers & routes
- ⏳ Day 5-6: Frontend React app
- ⏳ Day 7: Testing & deployment

## 🎓 Learning Resources

- [MongoDB Tutorial](https://www.mongodb.com/docs/manual/tutorial/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Authentication](https://jwt.io/introduction)
- [Socket.IO Guide](https://socket.io/docs/v4/tutorial/introduction)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💡 Pro Tips

1. **Use Postman** for API testing (import routes as collection)
2. **MongoDB Compass** for database visualization
3. **VS Code REST Client** extension for quick API tests
4. **Keep .env secure** - never commit to git (already in .gitignore)
5. **Check server logs** for detailed error messages

## 🎉 You're All Set!

Your backend is ready. Start the server and begin testing:

```bash
cd server
npm run dev
```

Visit: http://localhost:5000/api/health

Happy coding! 🚀
