# 🚀 AI-Integrated Project Management Application

## Overview

A full-stack MERN application for project management with AI-powered features, real-time collaboration, and mentor access.

### ✨ Key Features

- **Authentication**: Email/Password + Google OAuth
- **Project Management**: CRUD operations, team management, file uploads
- **Task Management**: Assignments, priorities, deadlines, mentor reviews
- **Real-Time Chat**: Socket.IO powered group chat
- **AI Features**: Risk detection, participation analysis, smart suggestions
- **Mentor Portal**: Review submissions, provide feedback, track progress
- **Notifications**: Real-time alerts and email notifications

## 🛠️ Technologies

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.IO
- Google Gemini API
- JWT Authentication
- Nodemailer

**Frontend:**
- React with Vite
- Tailwind CSS
- Socket.IO Client
- Chart.js
- Axios

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm >= 9.0.0

### Backend Setup

```bash
# Navigate to server directory
cd server

# Make setup script executable (Linux/Mac)
chmod +x setup.sh

# Run setup script
./setup.sh

# Or manually:
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Required
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key

# Optional
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

### Generate Secure Keys

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Running the Application

### Development Mode

**Backend:**
```bash
cd server
npm run dev
```

**Frontend** (to be set up):
```bash
cd client
npm run dev
```

### Production Mode

```bash
cd server
npm start
```

## 📁 Project Structure

```
MINIPROJECT/
├── server/                  # Backend application
│   ├── config/             # Configuration files
│   │   └── db.js           # MongoDB connection
│   ├── models/             # Mongoose models
│   │   ├── User.js         # User schema
│   │   ├── Project.js      # Project schema
│   │   ├── Task.js         # Task schema
│   │   ├── Chat.js         # Chat schema
│   │   ├── Submission.js   # Submission schema
│   │   └── Notification.js # Notification schema
│   ├── controllers/        # Request handlers
│   │   └── authController.js
│   ├── routes/             # API routes
│   │   └── auth.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js         # Authentication
│   │   └── errorHandler.js # Error handling
│   ├── services/           # External services
│   │   ├── aiService.js    # OpenAI integration
│   │   └── emailService.js # Email service
│   ├── .env.example        # Environment template
│   ├── package.json        # Dependencies
│   └── server.js           # Main server file
│
└── client/                 # Frontend (to be created)
    └── (React app structure)
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Health Check
- `GET /api/health` - Server health status

## 🧪 Testing

Test the API:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student"
  }'
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ HTTP security headers (Helmet)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Rate limiting (ready to implement)
- ✅ XSS protection

## 🚢 Deployment

### Backend - Railway/Render

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Connect GitHub repo
   - Add environment variables
   - Deploy automatically

3. **MongoDB Atlas**
   - Create cluster at mongodb.com
   - Get connection string
   - Add to environment variables

### Frontend - Vercel

1. **Deploy to Vercel**
   - Connect GitHub repo
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Deploy

## 📚 Additional Resources

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Google Gemini API](https://ai.google.dev/docs)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running (local)
sudo systemctl status mongod

# Test connection
mongosh "your_connection_string"
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -ti:5000

# Kill process
kill -9 $(lsof -ti:5000)
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📊 Database Schema

### User Model
- Authentication (email, password, OAuth)
- Role (student, team-lead, mentor)
- Profile (name, avatar, bio, skills)
- Activity tracking

### Project Model
- Basic info (title, description, deadline)
- Team members and roles
- Progress tracking
- AI insights
- File attachments

### Task Model
- Assignment and priority
- Status tracking
- Subtasks
- Comments and feedback
- Mentor review

### Chat Model
- Real-time messages
- File attachments
- Read receipts
- Reactions

## 🤝 Contributing

This is a mini-project for educational purposes. Feel free to fork and modify!

## 📝 License

MIT License - Feel free to use this project for learning and development.

## 👨‍💻 Author

Built with ❤️ for managing projects efficiently with AI assistance.

---

## 🎯 Development Roadmap

- [x] Backend setup and configuration
- [x] Database models
- [x] Authentication system
- [x] AI service integration
- [x] Email service
- [ ] Complete all controllers
- [ ] Complete all routes
- [ ] Socket.IO implementation
- [ ] Frontend React app
- [ ] UI components with Tailwind
- [ ] Real-time features
- [ ] Testing
- [ ] Deployment

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check server logs for errors

---

**Status:** Backend Foundation Complete ✅
**Next:** Create remaining controllers and routes, then build frontend
