# Chat API Endpoints - Complete Reference

## Base URL
```
http://localhost:5000/api/chat
```

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📡 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/:projectId` | Get chat messages with pagination |
| POST | `/projects/:projectId/messages` | Send a new message |
| PUT | `/messages/:messageId` | Edit your own message |
| DELETE | `/messages/:messageId` | Delete your own message |
| POST | `/messages/:messageId/reactions` | Add/remove reaction |
| GET | `/projects/:projectId/unread` | Get unread message count |
| POST | `/projects/:projectId/read` | Mark all messages as read |
| GET | `/projects/:projectId/info` | Get chat information |

---

## 1. Get Chat Messages

### **GET** `/api/chat/projects/:projectId`

Fetch paginated chat messages for a project.

#### **Parameters:**
- **Path:** `projectId` (required) - MongoDB ObjectId
- **Query:**
  - `page` (optional) - Page number, default: 1
  - `limit` (optional) - Messages per page, default: 50

#### **Response:**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "64abc123...",
      "sender": {
        "id": "64def456...",
        "name": "John Doe",
        "email": "john@example.com",
        "profilePicture": "https://..."
      },
      "text": "Hello everyone!",
      "timestamp": "2025-11-04T10:30:00.000Z",
      "attachments": [
        {
          "url": "https://...",
          "filename": "document.pdf",
          "fileType": "document",
          "fileSize": 102400
        }
      ],
      "edited": false,
      "editedAt": null,
      "reactions": [
        {
          "user": "64ghi789...",
          "emoji": "👍",
          "createdAt": "2025-11-04T10:35:00.000Z"
        }
      ],
      "replyTo": null,
      "readBy": [
        {
          "user": "64jkl012...",
          "readAt": "2025-11-04T10:32:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "total": 230,
    "page": 1,
    "pages": 5,
    "limit": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### **Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/chat/projects/64abc123?page=1&limit=50"
```

#### **Frontend (Axios):**
```javascript
const fetchMessages = async (projectId, page = 1, limit = 50) => {
  const response = await axios.get(
    `/api/chat/projects/${projectId}`,
    {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};
```

---

## 2. Send Message

### **POST** `/api/chat/projects/:projectId/messages`

Send a new message to the project chat.

#### **Parameters:**
- **Path:** `projectId` (required)
- **Body:**
```json
{
  "text": "Hello everyone!",
  "attachments": [
    {
      "url": "https://...",
      "filename": "file.pdf",
      "fileType": "document",
      "fileSize": 102400
    }
  ],
  "replyTo": "64abc123..." // Optional: message ID to reply to
}
```

#### **Response:**
```json
{
  "success": true,
  "message": {
    "_id": "64abc123...",
    "chat": "64def456...",
    "sender": {
      "_id": "64ghi789...",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://..."
    },
    "text": "Hello everyone!",
    "attachments": [...],
    "createdAt": "2025-11-04T10:30:00.000Z",
    "updatedAt": "2025-11-04T10:30:00.000Z"
  },
  "chatId": "64def456..."
}
```

#### **Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello everyone!"}' \
  "http://localhost:5000/api/chat/projects/64abc123/messages"
```

#### **Frontend (Axios):**
```javascript
const sendMessage = async (projectId, text, attachments = []) => {
  const response = await axios.post(
    `/api/chat/projects/${projectId}/messages`,
    { text, attachments },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};
```

---

## 3. Edit Message

### **PUT** `/api/chat/messages/:messageId`

Edit your own message (sender only).

#### **Parameters:**
- **Path:** `messageId` (required)
- **Body:**
```json
{
  "text": "Updated message text"
}
```

#### **Response:**
```json
{
  "success": true,
  "message": {
    "_id": "64abc123...",
    "text": "Updated message text",
    "edited": true,
    "editedAt": "2025-11-04T10:35:00.000Z",
    "sender": {
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://..."
    }
  }
}
```

#### **Example:**
```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Updated message"}' \
  "http://localhost:5000/api/chat/messages/64abc123"
```

---

## 4. Delete Message

### **DELETE** `/api/chat/messages/:messageId`

Soft delete your own message (sender only).

#### **Parameters:**
- **Path:** `messageId` (required)

#### **Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

#### **Example:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/chat/messages/64abc123"
```

---

## 5. Add/Remove Reaction

### **POST** `/api/chat/messages/:messageId/reactions`

Add or toggle a reaction (emoji) to a message.

#### **Parameters:**
- **Path:** `messageId` (required)
- **Body:**
```json
{
  "emoji": "👍"
}
```

#### **Response:**
```json
{
  "success": true,
  "reactions": [
    {
      "user": "64abc123...",
      "emoji": "👍",
      "createdAt": "2025-11-04T10:40:00.000Z"
    }
  ]
}
```

#### **Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}' \
  "http://localhost:5000/api/chat/messages/64abc123/reactions"
```

---

## 6. Get Unread Count

### **GET** `/api/chat/projects/:projectId/unread`

Get the number of unread messages for the current user in a project.

#### **Parameters:**
- **Path:** `projectId` (required)

#### **Response:**
```json
{
  "success": true,
  "unreadCount": 15
}
```

#### **Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/chat/projects/64abc123/unread"
```

---

## 7. Mark Messages as Read

### **POST** `/api/chat/projects/:projectId/read`

Mark all messages in a project as read for the current user.

#### **Parameters:**
- **Path:** `projectId` (required)

#### **Response:**
```json
{
  "success": true,
  "message": "All messages marked as read"
}
```

#### **Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/chat/projects/64abc123/read"
```

---

## 8. Get Chat Info

### **GET** `/api/chat/projects/:projectId/info`

Get detailed chat information for a project.

#### **Parameters:**
- **Path:** `projectId` (required)

#### **Response:**
```json
{
  "success": true,
  "chat": {
    "_id": "64abc123...",
    "projectId": "64def456...",
    "projectName": "AI Project Management",
    "participants": [
      {
        "user": {
          "_id": "64ghi789...",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "joinedAt": "2025-11-01T10:00:00.000Z",
        "isActive": true,
        "lastReadAt": "2025-11-04T10:30:00.000Z"
      }
    ],
    "messageCount": 230,
    "lastMessage": {
      "_id": "64jkl012...",
      "text": "Latest message",
      "createdAt": "2025-11-04T10:35:00.000Z"
    },
    "lastMessageAt": "2025-11-04T10:35:00.000Z",
    "settings": {
      "allowAttachments": true,
      "maxAttachmentSize": 10485760,
      "allowedFileTypes": ["image", "document", "video", "audio"]
    }
  }
}
```

---

## 🔒 Error Responses

All endpoints return standardized error responses:

### **400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid project ID"
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied. You are not a member of this project"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Project not found"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to fetch chat messages",
  "error": "Detailed error message"
}
```

---

## 🔔 Socket.IO Integration

All POST/PUT/DELETE operations automatically emit Socket.IO events:

- **`new-message`** - When a message is sent
- **`message-edited`** - When a message is edited
- **`message-deleted`** - When a message is deleted
- **`reaction-added`** - When a reaction is added

These events are broadcast to all users in the project room (`project-{projectId}`).

---

## 🧪 Testing with Postman

### 1. Login First
```
POST http://localhost:5000/api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
```
Copy the token from the response.

### 2. Get Messages
```
GET http://localhost:5000/api/chat/projects/{{projectId}}?page=1&limit=50
Headers: Authorization: Bearer {{token}}
```

### 3. Send Message
```
POST http://localhost:5000/api/chat/projects/{{projectId}}/messages
Headers: 
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
  "text": "Test message from Postman"
}
```

---

## 📝 Frontend Integration Example

### Complete Chat Component

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getSocket } from '../utils/socket';

const ChatComponent = ({ projectId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const socket = getSocket();

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, [projectId, page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/chat/projects/${projectId}`,
        { params: { page, limit: 50 } }
      );
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message via API
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data } = await axios.post(
        `/api/chat/projects/${projectId}/messages`,
        { text: newMessage }
      );
      setNewMessage('');
      // Message will be received via Socket.IO
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Listen to Socket.IO for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('new-message', (data) => {
        if (data.projectId === projectId) {
          setMessages(prev => [...prev, data.message]);
        }
      });

      socket.on('message-edited', (data) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.message._id ? data.message : msg
          )
        );
      });

      socket.on('message-deleted', (data) => {
        setMessages(prev => 
          prev.filter(msg => msg._id !== data.messageId)
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('new-message');
        socket.off('message-edited');
        socket.off('message-deleted');
      }
    };
  }, [socket, projectId]);

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg._id} className="message">
            <strong>{msg.sender.name}:</strong> {msg.text}
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};
```

---

## ✅ Endpoints Checklist

- [x] GET `/projects/:projectId` - Fetch messages with pagination
- [x] POST `/projects/:projectId/messages` - Send message
- [x] PUT `/messages/:messageId` - Edit message
- [x] DELETE `/messages/:messageId` - Delete message
- [x] POST `/messages/:messageId/reactions` - Add reaction
- [x] GET `/projects/:projectId/unread` - Get unread count
- [x] POST `/projects/:projectId/read` - Mark as read
- [x] GET `/projects/:projectId/info` - Get chat info

All endpoints are **production-ready** with:
- ✅ Authentication required
- ✅ Project membership verification
- ✅ Error handling
- ✅ Socket.IO integration
- ✅ Input validation
- ✅ Proper HTTP status codes

---

## 📚 Related Documentation

- **Socket.IO Events**: `SOCKET_IO_IMPLEMENTATION.md`
- **Chat Models**: `CHAT_MODELS_GUIDE.md`
- **Quick Reference**: `SOCKET_IO_QUICK_REF.md`
