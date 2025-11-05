# Socket.IO Real-Time Chat - Implementation Guide

## 🎯 Overview

Complete Socket.IO implementation for real-time project messaging with:
- ✅ JWT Authentication
- ✅ Project room management
- ✅ Real-time messaging with database persistence
- ✅ Typing indicators
- ✅ Online user tracking
- ✅ Message reactions
- ✅ Edit/Delete messages
- ✅ Read receipts

---

## 📁 Files Created/Modified

### New Files:
✅ **`server/socket/socketHandler.js`** (520 lines)
   - Complete Socket.IO event handler
   - Authentication middleware
   - All real-time features

### Modified Files:
✅ **`server/server.js`**
   - Imported socketHandler
   - Replaced basic Socket.IO with full handler
   - Added Chat and Message model imports

✅ **`server/models/Message.js`**
   - Converted to ES6 modules (`export default`)

✅ **`server/models/Chat.js`**
   - Converted to ES6 modules (`export default`)

---

## 🔌 Socket.IO Events

### Client → Server Events

#### 1. **join-project**
Join a project's chat room

**Payload:**
```javascript
{
  projectId: "64abc123..."
}
```

**Response:**
```javascript
// On success:
emit('joined-project', {
  projectId,
  projectName,
  onlineUsers: [...],
  timestamp
})

// To room:
emit('user-joined', {
  userId,
  userName,
  timestamp
})

emit('online-users', {
  projectId,
  users: [...]
})
```

#### 2. **leave-project**
Leave a project's chat room

**Payload:**
```javascript
{
  projectId: "64abc123..."
}
```

**Response:**
```javascript
emit('left-project', { projectId })
emit('user-left', { userId, userName, timestamp })
emit('online-users', { projectId, users: [...] })
```

#### 3. **send-message**
Send a message to project chat

**Payload:**
```javascript
{
  projectId: "64abc123...",
  text: "Hello everyone!",
  attachments: [
    {
      url: "https://...",
      filename: "image.jpg",
      fileType: "image",
      fileSize: 102400
    }
  ],
  replyTo: "64def456..." // Optional: message ID to reply to
}
```

**Response:**
```javascript
// To room (including sender):
emit('new-message', {
  message: {
    _id,
    chat,
    sender: { name, email, profilePicture, role },
    text,
    attachments,
    replyTo,
    createdAt,
    updatedAt
  },
  projectId,
  timestamp
})

emit('user-stopped-typing', { userId, userName, projectId })
```

#### 4. **edit-message**
Edit your own message

**Payload:**
```javascript
{
  messageId: "64def456...",
  text: "Updated message",
  projectId: "64abc123..."
}
```

**Response:**
```javascript
emit('message-edited', {
  message: { ...updated message },
  projectId,
  timestamp
})
```

#### 5. **delete-message**
Delete your own message

**Payload:**
```javascript
{
  messageId: "64def456...",
  projectId: "64abc123..."
}
```

**Response:**
```javascript
emit('message-deleted', {
  messageId,
  projectId,
  timestamp
})
```

#### 6. **add-reaction**
Add/remove emoji reaction to a message

**Payload:**
```javascript
{
  messageId: "64def456...",
  emoji: "👍",
  projectId: "64abc123..."
}
```

**Response:**
```javascript
emit('reaction-added', {
  messageId,
  userId,
  userName,
  emoji,
  projectId,
  timestamp
})
```

#### 7. **typing**
User is typing indicator

**Payload:**
```javascript
{
  projectId: "64abc123..."
}
```

**Response:**
```javascript
// To others in room (not sender):
emit('user-typing', {
  userId,
  userName,
  projectId,
  timestamp
})
```

#### 8. **stop-typing**
User stopped typing

**Payload:**
```javascript
{
  projectId: "64abc123..."
}
```

**Response:**
```javascript
emit('user-stopped-typing', {
  userId,
  userName,
  projectId
})
```

#### 9. **mark-messages-read**
Mark all messages in chat as read

**Payload:**
```javascript
{
  projectId: "64abc123..."
}
```

**Response:**
```javascript
emit('messages-marked-read', {
  projectId,
  timestamp
})
```

#### 10. **get-online-users**
Get list of online users in project

**Payload:**
```javascript
{
  projectId: "64abc123..."
}
```

**Response:**
```javascript
emit('online-users', {
  projectId,
  users: ["userId1", "userId2", ...]
})
```

---

## 🔐 Authentication

### Client Setup

The client must provide a JWT token when connecting:

**Method 1: Query Parameter**
```javascript
import io from 'socket.io-client';

const token = localStorage.getItem('token');
const socket = io('http://localhost:5000', {
  query: { token }
});
```

**Method 2: Auth Object**
```javascript
const socket = io('http://localhost:5000', {
  auth: { token }
});
```

### Authentication Flow

1. Client connects with token
2. Server verifies JWT token
3. If valid: `socket.user` is populated with user data
4. If invalid: Connection rejected with error

---

## 💻 Frontend Integration Example

### 1. Initialize Socket Connection

```javascript
// src/utils/socket.js
import io from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    return socket;
  }
  
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });
  
  socket.on('error', (error) => {
    console.error('⚠️ Socket error:', error);
  });
  
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### 2. Join Project Room

```javascript
// In your ProjectDetails component
import { useEffect } from 'react';
import { getSocket } from '../utils/socket';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const socket = getSocket();
  
  useEffect(() => {
    if (socket && projectId) {
      // Join project room
      socket.emit('join-project', { projectId });
      
      // Listen for room join confirmation
      socket.on('joined-project', (data) => {
        console.log('Joined project:', data.projectName);
        console.log('Online users:', data.onlineUsers);
      });
      
      // Listen for other users joining
      socket.on('user-joined', (data) => {
        console.log(`${data.userName} joined`);
      });
      
      // Listen for online users updates
      socket.on('online-users', (data) => {
        setOnlineUsers(data.users);
      });
      
      // Cleanup: leave room on unmount
      return () => {
        socket.emit('leave-project', { projectId });
        socket.off('joined-project');
        socket.off('user-joined');
        socket.off('online-users');
      };
    }
  }, [socket, projectId]);
  
  // ... rest of component
};
```

### 3. Send Message

```javascript
const sendMessage = (text, attachments = []) => {
  const socket = getSocket();
  
  socket.emit('send-message', {
    projectId,
    text,
    attachments,
    replyTo: replyingTo?._id // Optional
  });
  
  // Clear input
  setMessageText('');
  setReplyingTo(null);
};
```

### 4. Receive Messages

```javascript
useEffect(() => {
  const socket = getSocket();
  
  socket.on('new-message', (data) => {
    // Add message to state
    setMessages(prev => [...prev, data.message]);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Play notification sound (if not from current user)
    if (data.message.sender._id !== currentUser._id) {
      playNotificationSound();
    }
  });
  
  return () => {
    socket.off('new-message');
  };
}, []);
```

### 5. Typing Indicator

```javascript
const [typingUsers, setTypingUsers] = useState(new Set());

// Send typing indicator
const handleInputChange = (e) => {
  setMessageText(e.target.value);
  
  const socket = getSocket();
  socket.emit('typing', { projectId });
  
  // Clear typing after 3 seconds of inactivity
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing', { projectId });
  }, 3000);
};

// Listen for typing indicators
useEffect(() => {
  const socket = getSocket();
  
  socket.on('user-typing', (data) => {
    setTypingUsers(prev => new Set(prev).add(data.userName));
  });
  
  socket.on('user-stopped-typing', (data) => {
    setTypingUsers(prev => {
      const updated = new Set(prev);
      updated.delete(data.userName);
      return updated;
    });
  });
  
  return () => {
    socket.off('user-typing');
    socket.off('user-stopped-typing');
  };
}, []);

// Display typing indicator
{typingUsers.size > 0 && (
  <div className="typing-indicator">
    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
  </div>
)}
```

### 6. Edit Message

```javascript
const editMessage = (messageId, newText) => {
  const socket = getSocket();
  
  socket.emit('edit-message', {
    messageId,
    text: newText,
    projectId
  });
};

// Listen for edits
socket.on('message-edited', (data) => {
  setMessages(prev => 
    prev.map(msg => 
      msg._id === data.message._id ? data.message : msg
    )
  );
});
```

### 7. Delete Message

```javascript
const deleteMessage = (messageId) => {
  const socket = getSocket();
  
  socket.emit('delete-message', {
    messageId,
    projectId
  });
};

// Listen for deletions
socket.on('message-deleted', (data) => {
  setMessages(prev => 
    prev.filter(msg => msg._id !== data.messageId)
  );
});
```

### 8. Add Reaction

```javascript
const addReaction = (messageId, emoji) => {
  const socket = getSocket();
  
  socket.emit('add-reaction', {
    messageId,
    emoji,
    projectId
  });
};

// Listen for reactions
socket.on('reaction-added', (data) => {
  // Update message in state with new reaction
  setMessages(prev => 
    prev.map(msg => {
      if (msg._id === data.messageId) {
        // Add/update reaction logic
        return { ...msg, reactions: [...] };
      }
      return msg;
    })
  );
});
```

---

## 🔒 Security Features

1. **JWT Authentication**
   - All connections require valid JWT token
   - Token verified on connection and stored in `socket.user`

2. **Project Member Verification**
   - Every action checks if user is project member
   - Prevents unauthorized access to private chats

3. **Message Ownership**
   - Edit/Delete only allowed by message sender
   - Prevents tampering with others' messages

4. **Room Isolation**
   - Messages broadcast only to project room members
   - No cross-project data leakage

---

## 📊 Features Summary

| Feature | Event | Database | Broadcast |
|---------|-------|----------|-----------|
| Join Room | `join-project` | ✅ Add participant | ✅ User joined |
| Leave Room | `leave-project` | ✅ Update participant | ✅ User left |
| Send Message | `send-message` | ✅ Save message | ✅ New message |
| Edit Message | `edit-message` | ✅ Update message | ✅ Message edited |
| Delete Message | `delete-message` | ✅ Soft delete | ✅ Message deleted |
| Reaction | `add-reaction` | ✅ Save reaction | ✅ Reaction added |
| Typing | `typing` | ❌ No save | ✅ User typing |
| Stop Typing | `stop-typing` | ❌ No save | ✅ User stopped |
| Mark Read | `mark-messages-read` | ✅ Update read status | ❌ No broadcast |
| Online Users | `get-online-users` | ❌ In-memory | ✅ Online users list |

---

## 🧪 Testing

### Using Postman/Socket.IO Client

1. **Install socket.io-client**
```bash
npm install socket.io-client
```

2. **Test Script**
```javascript
const io = require('socket.io-client');

// Connect with token
const token = 'your-jwt-token';
const socket = io('http://localhost:5000', {
  auth: { token }
});

// Test events
socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Join project
  socket.emit('join-project', { projectId: '64abc...' });
});

socket.on('joined-project', (data) => {
  console.log('Joined:', data);
  
  // Send message
  socket.emit('send-message', {
    projectId: '64abc...',
    text: 'Test message'
  });
});

socket.on('new-message', (data) => {
  console.log('New message:', data);
});

socket.on('error', (error) => {
  console.error('Error:', error);
});
```

---

## 🚀 Next Steps

1. **Install socket.io-client in frontend:**
```bash
cd client
npm install socket.io-client
```

2. **Create React components:**
   - `ChatWindow.jsx` - Main chat container
   - `MessageList.jsx` - Display messages
   - `MessageInput.jsx` - Send messages
   - `TypingIndicator.jsx` - Show who's typing
   - `OnlineUsers.jsx` - Show online users

3. **Add notifications:**
   - Browser notifications for new messages
   - Sound effects
   - Unread badge counts

4. **Add file upload:**
   - S3/CloudFlare integration
   - Image preview
   - File type validation

---

## ✅ Implementation Complete

The Socket.IO server is now fully integrated and ready to use! 

**Files created:**
- ✅ `server/socket/socketHandler.js` (520 lines)

**Files modified:**
- ✅ `server/server.js` (integrated socketHandler)
- ✅ `server/models/Message.js` (ES6 modules)
- ✅ `server/models/Chat.js` (ES6 modules)

**All syntax validated:** ✅

Start the server and connect from your frontend!
