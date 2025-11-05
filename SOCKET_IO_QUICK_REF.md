# Socket.IO Quick Reference

## 🔌 Connection Setup

```javascript
// Frontend
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});
```

## 📡 Events Cheat Sheet

### Server Events (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `join-project` | `{ projectId }` | Join project room |
| `leave-project` | `{ projectId }` | Leave project room |
| `send-message` | `{ projectId, text, attachments?, replyTo? }` | Send message |
| `edit-message` | `{ messageId, text, projectId }` | Edit own message |
| `delete-message` | `{ messageId, projectId }` | Delete own message |
| `add-reaction` | `{ messageId, emoji, projectId }` | React to message |
| `typing` | `{ projectId }` | Start typing |
| `stop-typing` | `{ projectId }` | Stop typing |
| `mark-messages-read` | `{ projectId }` | Mark all as read |
| `get-online-users` | `{ projectId }` | Get online users |

### Client Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `joined-project` | `{ projectId, projectName, onlineUsers }` | Room joined |
| `left-project` | `{ projectId }` | Room left |
| `user-joined` | `{ userId, userName, timestamp }` | User joined room |
| `user-left` | `{ userId, userName, timestamp }` | User left room |
| `new-message` | `{ message, projectId, timestamp }` | New message |
| `message-edited` | `{ message, projectId, timestamp }` | Message edited |
| `message-deleted` | `{ messageId, projectId, timestamp }` | Message deleted |
| `reaction-added` | `{ messageId, userId, emoji, ... }` | Reaction added |
| `user-typing` | `{ userId, userName, projectId }` | User typing |
| `user-stopped-typing` | `{ userId, userName, projectId }` | User stopped |
| `online-users` | `{ projectId, users: [] }` | Online users list |
| `messages-marked-read` | `{ projectId, timestamp }` | Read confirmed |
| `error` | `{ message, error? }` | Error occurred |

## 🚀 Quick Start

### 1. Join Project
```javascript
socket.emit('join-project', { projectId: '64abc...' });

socket.on('joined-project', (data) => {
  console.log('Joined:', data.projectName);
  console.log('Online:', data.onlineUsers);
});
```

### 2. Send Message
```javascript
socket.emit('send-message', {
  projectId: '64abc...',
  text: 'Hello!'
});

socket.on('new-message', (data) => {
  addMessage(data.message);
});
```

### 3. Typing Indicator
```javascript
// Start typing
socket.emit('typing', { projectId });

// Stop typing (after 3s inactivity)
setTimeout(() => {
  socket.emit('stop-typing', { projectId });
}, 3000);

// Listen
socket.on('user-typing', ({ userName }) => {
  showTyping(userName);
});
```

### 4. Edit Message
```javascript
socket.emit('edit-message', {
  messageId: '64def...',
  text: 'Updated!',
  projectId: '64abc...'
});

socket.on('message-edited', ({ message }) => {
  updateMessage(message);
});
```

### 5. Add Reaction
```javascript
socket.emit('add-reaction', {
  messageId: '64def...',
  emoji: '👍',
  projectId: '64abc...'
});

socket.on('reaction-added', (data) => {
  updateReactions(data);
});
```

### 6. Online Users
```javascript
socket.emit('get-online-users', { projectId });

socket.on('online-users', ({ users }) => {
  setOnlineUsers(users);
});
```

## 🔐 Authentication

Token required in connection:
```javascript
const socket = io(SERVER_URL, {
  auth: { token: 'your-jwt-token' }
});
```

## 🛠️ Error Handling

```javascript
socket.on('error', (error) => {
  console.error(error.message);
  toast.error(error.message);
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

## 🧹 Cleanup

```javascript
useEffect(() => {
  socket.emit('join-project', { projectId });
  
  // Add listeners
  socket.on('new-message', handleMessage);
  socket.on('user-typing', handleTyping);
  
  // Cleanup
  return () => {
    socket.emit('leave-project', { projectId });
    socket.off('new-message');
    socket.off('user-typing');
  };
}, [projectId]);
```

## 📦 Files

- `server/socket/socketHandler.js` (520 lines)
- `SOCKET_IO_IMPLEMENTATION.md` (Full docs)
- `SOCKET_IO_QUICK_REF.md` (This file)

## 🔗 See Full Docs

For complete implementation guide with examples, see:
**`SOCKET_IO_IMPLEMENTATION.md`**
