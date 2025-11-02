# AI-Integrated Project Management - Backend

## 📁 Project Structure

```
server/
├── config/              # Configuration files
│   └── db.js           # MongoDB connection setup
│
├── models/             # Mongoose database models
│   ├── User.js         # User schema with roles (Student, Team Lead, Mentor)
│   ├── Project.js      # Project schema with team members and deadlines
│   ├── Task.js         # Task schema with assignments and status tracking
│   ├── Chat.js         # Chat message schema for real-time communication
│   ├── Submission.js   # Task submission and deliverables schema
│   └── Notification.js # Notification schema for alerts
│
├── controllers/        # Business logic and request handlers
│   ├── authController.js    # Authentication (login, register, OAuth)
│   ├── projectController.js # Project CRUD operations
│   ├── taskController.js    # Task management and assignment
│   ├── chatController.js    # Chat history and file sharing
│   └── aiController.js      # AI analysis and suggestions
│
├── routes/             # API route definitions
│   ├── auth.js         # /api/auth/* - Authentication endpoints
│   ├── projects.js     # /api/projects/* - Project endpoints
│   ├── tasks.js        # /api/tasks/* - Task endpoints
│   ├── chat.js         # /api/chat/* - Chat endpoints
│   └── ai.js           # /api/ai/* - AI feature endpoints
│
├── middleware/         # Custom middleware functions
│   ├── auth.js         # JWT verification and role-based access
│   └── errorHandler.js # Global error handling
│
├── services/           # External service integrations
│   ├── aiService.js    # OpenAI API integration
│   └── emailService.js # Email notification service
│
├── socket/             # WebSocket configuration
│   └── socketHandler.js # Socket.IO event handlers
│
├── uploads/            # File upload directory (auto-created)
├── .env               # Environment variables (create from .env.example)
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies and scripts
└── server.js          # Main application entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm >= 9.0.0

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your values:
   - MongoDB connection string
   - JWT secret keys
   - Google OAuth credentials
   - OpenAI API key
   - Email configuration (optional)

3. **Create Upload Directory**
   ```bash
   mkdir uploads
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The server will start on http://localhost:5000

5. **Start Production Server**
   ```bash
   npm start
   ```

## 📦 Dependencies Explained

### Core Framework
- **express** (^4.18.2) - Fast, minimalist web framework for Node.js
- **mongoose** (^8.0.0) - MongoDB object modeling tool with schema validation

### Authentication & Security
- **bcryptjs** (^2.4.3) - Password hashing library
- **jsonwebtoken** (^9.0.2) - JWT token generation and verification
- **passport** (^0.7.0) - Authentication middleware
- **passport-google-oauth20** (^2.0.0) - Google OAuth 2.0 strategy
- **helmet** (^7.1.0) - Secure HTTP headers
- **express-rate-limit** (^7.1.5) - Rate limiting middleware

### Real-Time Communication
- **socket.io** (^4.6.1) - Real-time bidirectional event-based communication

### File Handling
- **multer** (^1.4.5-lts.1) - Multipart/form-data handling for file uploads

### External APIs
- **axios** (^1.6.2) - HTTP client for external API calls
- **openai** (^4.20.1) - Official OpenAI API client

### Utilities
- **dotenv** (^16.3.1) - Load environment variables from .env file
- **cors** (^2.8.5) - Enable Cross-Origin Resource Sharing
- **cookie-parser** (^1.4.6) - Parse cookies from requests
- **express-session** (^1.17.3) - Session management
- **compression** (^1.7.4) - Gzip compression middleware
- **morgan** (^1.10.0) - HTTP request logger
- **uuid** (^9.0.1) - Generate unique IDs
- **date-fns** (^2.30.0) - Date manipulation library
- **nodemailer** (^6.9.7) - Email sending library
- **express-validator** (^7.0.1) - Request validation middleware

### Development
- **nodemon** (^3.0.2) - Auto-restart server on file changes

## 🔐 API Endpoints Overview

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login with email/password
- `GET /google` - Google OAuth login
- `GET /google/callback` - Google OAuth callback
- `GET /me` - Get current user info
- `POST /logout` - Logout user

### Project Routes (`/api/projects`)
- `GET /` - Get all projects
- `POST /` - Create new project
- `GET /:id` - Get project by ID
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project
- `POST /:id/members` - Add team member
- `DELETE /:id/members/:userId` - Remove team member

### Task Routes (`/api/tasks`)
- `GET /project/:projectId` - Get tasks by project
- `POST /` - Create new task
- `GET /:id` - Get task by ID
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task
- `POST /:id/submit` - Submit task deliverable

### Chat Routes (`/api/chat`)
- `GET /project/:projectId` - Get chat history
- `POST /` - Send message
- `POST /upload` - Upload file to chat

### AI Routes (`/api/ai`)
- `POST /analyze-chat` - Analyze project chat
- `POST /detect-risks` - Detect project risks
- `POST /participation` - Calculate participation scores
- `POST /suggestions` - Get workflow suggestions
- `POST /predict-deadline` - Predict completion date

## 🔌 Socket.IO Events

### Client -> Server
- `join-project` - Join a project room
- `leave-project` - Leave a project room
- `send-message` - Send chat message
- `typing` - User is typing

### Server -> Client
- `new-message` - Receive new message
- `user-typing` - Someone is typing
- `notification` - Real-time notification
- `project-update` - Project data updated
- `task-update` - Task status changed

## 🛡️ Security Features

1. **Password Hashing** - bcryptjs with salt rounds
2. **JWT Authentication** - Access and refresh tokens
3. **Role-Based Access Control** - Student, Team Lead, Mentor roles
4. **Rate Limiting** - Prevent API abuse
5. **Helmet** - Secure HTTP headers
6. **CORS** - Configured allowed origins
7. **Input Validation** - express-validator for all inputs
8. **File Upload Limits** - Max file size restrictions

## 🚢 Deployment

### Railway / Render Deployment

1. **Create MongoDB Atlas Database**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

2. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**
   - Go to Railway dashboard
   - Add all variables from .env.example
   - Update MongoDB URI to Atlas connection string

4. **Configure Domain**
   - Railway provides automatic HTTPS
   - Update CLIENT_URL to your frontend URL

### Environment Variables for Production
- Use strong random strings for JWT secrets
- Use MongoDB Atlas connection string
- Enable all security features
- Set NODE_ENV=production

## 📊 Database Indexes

For optimal performance, the following indexes are created:
- User: email (unique), role
- Project: createdBy, members, status
- Task: project, assignedTo, status, deadline
- Chat: project, createdAt
- Notification: user, read, createdAt

## 🧪 Testing

Test endpoints using:
- Postman - Import collection
- Thunder Client (VS Code extension)
- curl commands

Example:
```bash
# Test health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"student"}'
```

## 📝 Notes

- Default port is 5000 (configurable via PORT env variable)
- Uploaded files stored in `/uploads` directory
- JWT tokens expire after 7 days (configurable)
- File upload limit is 10MB (configurable)
- Rate limit: 100 requests per 15 minutes per IP

## 🔧 Troubleshooting

**MongoDB Connection Error**
- Check MongoDB is running
- Verify connection string in .env
- Check network access in MongoDB Atlas

**JWT Error**
- Verify JWT_SECRET is set in .env
- Check token format in Authorization header

**File Upload Error**
- Check uploads directory exists
- Verify MAX_FILE_SIZE setting
- Check file permissions

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

---

For frontend setup, see `client/README.md`
