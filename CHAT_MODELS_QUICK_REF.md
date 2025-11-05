# Chat & Message Models - Quick Reference

## 🏗️ Architecture

```
Chat (Room)                    Message (Individual)
├── project (ref)             ├── chat (ref)
├── participants []           ├── sender (ref)
├── lastMessage (ref)         ├── text (5000 chars)
├── messageCount              ├── attachments [] (max 10)
└── settings                  ├── readBy []
                              ├── reactions []
                              ├── replyTo (ref)
                              ├── edited/editedAt
                              └── deleted/deletedAt
```

## 📝 Message Model

**File**: `server/models/Message.js`

### Create Message
```javascript
const message = await Message.create({
  chat: chatId,
  sender: userId,
  text: 'Hello world',
  attachments: [{ url: '...', filename: 'file.pdf', fileType: 'document' }]
});
```

### Methods
```javascript
// Edit
await message.editMessage('New text');

// Soft delete
await message.softDelete(userId);

// Mark as read
await message.markAsRead(userId);

// Add/remove reaction
await message.addReaction(userId, '👍');
await message.removeReaction(userId);

// Add attachment
await message.addAttachment({ url, filename, fileType, fileSize });

// Safe object (hides deleted content)
const safe = message.toSafeObject();
```

### Static Methods
```javascript
// Get paginated messages
const { messages, pagination } = await Message.getMessagesPaginated(chatId, page, limit);

// Get unread count
const count = await Message.getUnreadCount(chatId, userId);

// Mark all as read
await Message.markAllAsRead(chatId, userId);
```

---

## 💬 Chat Model

**File**: `server/models/Chat.js`

### Create/Get Chat
```javascript
// Get or create for project
const chat = await Chat.getOrCreateForProject(projectId);

// Get with details
const chat = await Chat.getChatWithDetails(projectId);
```

### Methods
```javascript
// Participant management
await chat.addParticipant(userId);
await chat.removeParticipant(userId);
const isParticipant = chat.isParticipant(userId);

// Read status
await chat.updateLastRead(userId);
const unreadCount = await chat.getUnreadCount(userId);

// Archive
await chat.archiveChat();
await chat.unarchiveChat();

// Update last message
await chat.updateLastMessage(messageId);
await chat.decrementMessageCount(); // When message deleted
```

### Static Methods
```javascript
// Get user's chats with pagination
const { chats, pagination } = await Chat.getUserChats(userId, page, limit);

// Sync with project members
await Chat.syncParticipantsWithProject(projectId);
```

---

## 🚀 Common Patterns

### 1. Send Message Flow
```javascript
const chat = await Chat.findById(chatId);
if (!chat.isParticipant(userId)) throw new Error('Not authorized');

const message = await Message.create({ chat: chatId, sender: userId, text });
await chat.updateLastMessage(message._id);
```

### 2. Get Messages Flow
```javascript
const { messages, pagination } = await Message.getMessagesPaginated(chatId, 1, 50);
```

### 3. Mark as Read Flow
```javascript
await Message.markAllAsRead(chatId, userId);
await chat.updateLastRead(userId);
```

### 4. Delete Message Flow
```javascript
await message.softDelete(userId);
await chat.decrementMessageCount();
```

### 5. Sync Participants Flow
```javascript
// When project member added/removed
await Chat.syncParticipantsWithProject(projectId);
```

---

## ✅ Validation

### Message
- Text OR attachments required (at least one)
- Text max 5000 chars
- Max 10 attachments per message
- Cannot edit deleted messages

### Chat
- One chat per project (unique)
- No duplicate participants
- Max attachment size: 10MB (configurable)

---

## 📊 Indexes

### Message
- `{ chat: 1, createdAt: -1 }` - History queries
- `{ sender: 1, createdAt: -1 }` - User messages
- `{ deleted: 1 }` - Filter deleted

### Chat
- `{ project: 1 }` - Fast lookup
- `{ 'participants.user': 1 }` - User's chats
- `{ lastMessageAt: -1 }` - Recent activity
- `{ isArchived: 1 }` - Filter archived

---

## 🎯 Key Features

### Message Model
✅ Rich text (5000 chars)
✅ Multiple attachments
✅ Edit tracking
✅ Soft delete
✅ Read receipts
✅ Reactions (emoji)
✅ Reply/thread support
✅ Pagination

### Chat Model
✅ One room per project
✅ Participant management
✅ Join/leave tracking
✅ Last read tracking
✅ Archive functionality
✅ Unread counts
✅ Auto-sync with project members
✅ Configurable settings

---

## 📦 Files

- `server/models/Message.js` (271 lines)
- `server/models/Chat.js` (296 lines)
- `CHAT_MODELS_GUIDE.md` (Full documentation)
- `CHAT_MODELS_QUICK_REF.md` (This file)

---

## 🔗 Next Steps

1. Create routes (`server/routes/chats.js`)
2. Add WebSocket integration (Socket.IO)
3. Implement file upload (S3/CloudFlare)
4. Create frontend components

See **CHAT_MODELS_GUIDE.md** for detailed examples!
