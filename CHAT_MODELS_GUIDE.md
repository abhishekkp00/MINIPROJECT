# Chat & Message Models - Usage Guide

## Architecture Overview

The chat system uses a **two-model approach** for better scalability:

- **Chat Model** (`server/models/Chat.js`): Represents a chat room for each project
- **Message Model** (`server/models/Message.js`): Represents individual messages within a chat

## Why Two Models?

✅ **Better Performance**: Messages can be queried independently
✅ **Scalability**: Large message histories don't bloat the Chat document
✅ **Flexibility**: Easy pagination, filtering, and search on messages
✅ **Cleaner Code**: Separation of concerns (room management vs message handling)

---

## Chat Model

### Purpose
Manages the chat room for each project, including participants and settings.

### Key Features
- One chat room per project (unique constraint)
- Participant management with join/leave tracking
- Last message tracking for quick previews
- Archive functionality
- Configurable settings (attachments, file types, notifications)

### Schema Fields

```javascript
{
  project: ObjectId (ref: Project, unique),
  participants: [{
    user: ObjectId (ref: User),
    joinedAt: Date,
    leftAt: Date,
    isActive: Boolean,
    lastReadAt: Date
  }],
  lastMessage: ObjectId (ref: Message),
  lastMessageAt: Date,
  messageCount: Number,
  isArchived: Boolean,
  archivedAt: Date,
  settings: {
    allowAttachments: Boolean,
    maxAttachmentSize: Number,
    allowedFileTypes: [String],
    muteNotifications: Boolean
  }
}
```

### Instance Methods

#### `addParticipant(userId)`
Adds a user to the chat (reactivates if previously left)

```javascript
const chat = await Chat.findOne({ project: projectId });
await chat.addParticipant(userId);
```

#### `removeParticipant(userId)`
Marks a participant as inactive (soft delete)

```javascript
await chat.removeParticipant(userId);
```

#### `updateLastRead(userId)`
Updates the last read timestamp for a user

```javascript
await chat.updateLastRead(req.user.id);
```

#### `isParticipant(userId)`
Checks if a user is an active participant

```javascript
if (!chat.isParticipant(userId)) {
  return res.status(403).json({ error: 'Not a participant' });
}
```

#### `archiveChat()` / `unarchiveChat()`
Archive or unarchive the chat

```javascript
await chat.archiveChat();
await chat.unarchiveChat();
```

#### `updateLastMessage(messageId)`
Updates last message reference and increments count

```javascript
const message = await Message.create({ ... });
await chat.updateLastMessage(message._id);
```

#### `getUnreadCount(userId)`
Returns unread message count for a user

```javascript
const unreadCount = await chat.getUnreadCount(userId);
```

### Static Methods

#### `getOrCreateForProject(projectId)`
Gets existing chat or creates new one for a project

```javascript
const chat = await Chat.getOrCreateForProject(projectId);
```

#### `getChatWithDetails(projectId)`
Gets chat with all populated references

```javascript
const chat = await Chat.getChatWithDetails(projectId);
```

#### `getUserChats(userId, page, limit)`
Gets all chats for a user with pagination

```javascript
const { chats, pagination } = await Chat.getUserChats(userId, 1, 20);
```

#### `syncParticipantsWithProject(projectId)`
Syncs chat participants with project members

```javascript
await Chat.syncParticipantsWithProject(projectId);
```

---

## Message Model

### Purpose
Stores individual messages within a chat room.

### Key Features
- Rich text messages with 5000 char limit
- Multiple file attachments (max 10 per message)
- Reply/thread support
- Read receipts
- Reactions (emoji)
- Soft delete functionality
- Edit tracking

### Schema Fields

```javascript
{
  chat: ObjectId (ref: Chat, required, indexed),
  sender: ObjectId (ref: User, required, indexed),
  text: String (max 5000 chars),
  attachments: [{
    url: String,
    filename: String,
    fileType: String (enum: image/document/video/audio/other),
    fileSize: Number
  }],
  edited: Boolean,
  editedAt: Date,
  deleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId (ref: User),
  readBy: [{
    user: ObjectId (ref: User),
    readAt: Date
  }],
  replyTo: ObjectId (ref: Message),
  reactions: [{
    user: ObjectId (ref: User),
    emoji: String,
    createdAt: Date
  }]
}
```

### Instance Methods

#### `softDelete(userId)`
Soft deletes the message

```javascript
await message.softDelete(req.user.id);
```

#### `editMessage(newText)`
Edits message text and marks as edited

```javascript
await message.editMessage('Updated message text');
```

#### `addAttachment(attachment)`
Adds a file attachment (max 10)

```javascript
await message.addAttachment({
  url: 's3://bucket/file.pdf',
  filename: 'document.pdf',
  fileType: 'document',
  fileSize: 1024000
});
```

#### `markAsRead(userId)`
Marks message as read by a user

```javascript
await message.markAsRead(userId);
```

#### `addReaction(userId, emoji)`
Adds or updates user's reaction

```javascript
await message.addReaction(userId, '👍');
```

#### `removeReaction(userId)`
Removes user's reaction

```javascript
await message.removeReaction(userId);
```

#### `toSafeObject()`
Returns safe representation (hides deleted message content)

```javascript
const safeMessage = message.toSafeObject();
// Deleted messages return: { text: '[Message deleted]', ... }
```

### Static Methods

#### `getMessagesPaginated(chatId, page, limit, includeDeleted)`
Gets messages with pagination

```javascript
const { messages, pagination } = await Message.getMessagesPaginated(
  chatId,
  1,    // page
  50,   // limit
  false // includeDeleted
);

// Returns:
// {
//   messages: [...],
//   pagination: {
//     currentPage: 1,
//     totalPages: 5,
//     totalMessages: 230,
//     hasNextPage: true,
//     hasPrevPage: false
//   }
// }
```

#### `getUnreadCount(chatId, userId)`
Gets unread message count for a user

```javascript
const unreadCount = await Message.getUnreadCount(chatId, userId);
```

#### `markAllAsRead(chatId, userId)`
Marks all messages as read for a user

```javascript
await Message.markAllAsRead(chatId, userId);
```

---

## Usage Examples

### 1. Initialize Chat for a Project

```javascript
// When a project is created, create its chat room
router.post('/projects', auth, async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      owner: req.user.id,
      // ... other fields
    });
    
    // Create chat and add owner as participant
    const chat = await Chat.create({ project: project._id });
    await chat.addParticipant(req.user.id);
    
    res.status(201).json({ project, chat });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 2. Send a Message

```javascript
router.post('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Not a participant' });
    }
    
    const message = await Message.create({
      chat: chat._id,
      sender: req.user.id,
      text: req.body.text,
      attachments: req.body.attachments || []
    });
    
    // Update chat's last message
    await chat.updateLastMessage(message._id);
    
    // Populate sender details
    await message.populate('sender', 'name email profilePicture');
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 3. Get Chat History with Pagination

```javascript
router.get('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Not a participant' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await Message.getMessagesPaginated(
      chat._id,
      page,
      limit,
      false // Don't include deleted messages
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 4. Edit a Message

```javascript
router.put('/messages/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await message.editMessage(req.body.text);
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 5. Delete a Message

```javascript
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await message.softDelete(req.user.id);
    
    const chat = await Chat.findById(message.chat);
    await chat.decrementMessageCount();
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 6. Add Reaction

```javascript
router.post('/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    await message.addReaction(req.user.id, req.body.emoji);
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 7. Mark Messages as Read

```javascript
router.post('/chats/:chatId/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    
    // Mark all messages as read
    await Message.markAllAsRead(chat._id, req.user.id);
    
    // Update participant's lastReadAt
    await chat.updateLastRead(req.user.id);
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 8. Get Unread Count

```javascript
router.get('/chats/:chatId/unread', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    const unreadCount = await chat.getUnreadCount(req.user.id);
    
    res.json({ unreadCount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 9. Sync Chat Participants with Project Members

```javascript
// Call this when project members are added/removed
router.post('/projects/:projectId/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    // Add member to project
    project.members.push({ user: req.body.userId });
    await project.save();
    
    // Sync chat participants
    await Chat.syncParticipantsWithProject(project._id);
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 10. Get User's All Chats

```javascript
router.get('/my-chats', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await Chat.getUserChats(req.user.id, page, limit);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## Validation Rules

### Message Model
- ✅ Text required OR attachments required (at least one)
- ✅ Text max 5000 characters
- ✅ Max 10 attachments per message
- ✅ Cannot edit deleted messages
- ✅ Sender required for all messages

### Chat Model
- ✅ One chat per project (unique constraint)
- ✅ No duplicate participants
- ✅ Max attachment size configurable (default 10MB)
- ✅ Allowed file types configurable

---

## Indexes

### Message Model
- `{ chat: 1, createdAt: -1 }` - Fast message history queries
- `{ sender: 1, createdAt: -1 }` - User message queries
- `{ deleted: 1 }` - Filter deleted messages

### Chat Model
- `{ project: 1 }` - Fast chat lookup by project
- `{ 'participants.user': 1 }` - User's chats queries
- `{ lastMessageAt: -1 }` - Sort chats by recent activity
- `{ isArchived: 1 }` - Filter archived chats

---

## Best Practices

1. **Always check participant access** before allowing message operations
2. **Use soft delete** instead of hard delete for messages
3. **Update chat.lastMessage** whenever a new message is sent
4. **Sync participants** when project members change
5. **Use pagination** for message history (default 50 per page)
6. **Mark messages as read** when user views them
7. **Populate sender details** when returning messages
8. **Use `toSafeObject()`** for deleted messages to hide content
9. **Validate file types and sizes** before allowing attachments
10. **Consider WebSocket integration** for real-time updates

---

## Next Steps

To complete the chat system:

1. **Create Chat Routes** (`server/routes/chats.js`)
   - POST `/chats/:chatId/messages` - Send message
   - GET `/chats/:chatId/messages` - Get messages
   - PUT `/messages/:messageId` - Edit message
   - DELETE `/messages/:messageId` - Delete message
   - POST `/messages/:messageId/reactions` - Add reaction

2. **Integrate with WebSocket** (Socket.IO)
   - Real-time message delivery
   - Typing indicators
   - Online status
   - Read receipts

3. **Add File Upload**
   - S3/CloudFlare integration
   - Image compression
   - File type validation

4. **Create Frontend Components**
   - ChatWindow.jsx
   - MessageList.jsx
   - MessageInput.jsx
   - EmojiPicker.jsx

---

## Model Files Created

✅ **server/models/Message.js** - Individual messages (271 lines)
✅ **server/models/Chat.js** - Chat rooms (296 lines)

Both models are ready to use!
