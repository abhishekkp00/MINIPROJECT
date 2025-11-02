/**
 * Chat Model
 * Schema for real-time chat messages in project discussions
 */

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender reference is required']
  },
  
  // Message content
  message: {
    type: String,
    required: function() {
      // Message required if no file attachment
      return !this.fileAttachment;
    },
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Message type
  type: {
    type: String,
    enum: ['text', 'file', 'system', 'task-update', 'project-update'],
    default: 'text'
  },
  
  // File attachment (optional)
  fileAttachment: {
    fileName: String,
    filePath: String,
    fileSize: Number,
    fileType: String,
    fileUrl: String
  },
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  
  // Mentioned users
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Message status
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata for system messages
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
chatSchema.index({ project: 1, createdAt: -1 });
chatSchema.index({ sender: 1 });
chatSchema.index({ project: 1, type: 1 });

// Virtual for unread count
chatSchema.virtual('unreadCount').get(function() {
  // This would be calculated per user in the controller
  return 0;
});

// Pre-save middleware
chatSchema.pre('save', function(next) {
  // Set editedAt when message is edited
  if (this.isModified('message') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  
  next();
});

// Method to mark as read by user
chatSchema.methods.markAsRead = async function(userId) {
  // Check if already read by user
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    await this.save();
  }
  
  return this;
};

// Method to add reaction
chatSchema.methods.addReaction = async function(userId, emoji) {
  // Check if user already reacted with same emoji
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (existingReaction) {
    // Remove reaction (toggle)
    this.reactions = this.reactions.filter(
      r => !(r.user.toString() === userId.toString() && r.emoji === emoji)
    );
  } else {
    // Add new reaction
    this.reactions.push({
      user: userId,
      emoji: emoji,
      addedAt: new Date()
    });
  }
  
  await this.save();
  return this;
};

// Method to soft delete message
chatSchema.methods.deleteMessage = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.message = 'This message has been deleted';
  await this.save();
  return this;
};

// Static method to get chat history
chatSchema.statics.getChatHistory = async function(projectId, limit = 50, before = null) {
  const query = {
    project: projectId,
    isDeleted: false
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .populate('sender', 'name email avatar role isOnline')
    .populate('replyTo', 'message sender')
    .populate('mentions', 'name email')
    .sort('-createdAt')
    .limit(limit);
};

// Static method to get unread messages for user
chatSchema.statics.getUnreadMessages = async function(projectId, userId) {
  return this.find({
    project: projectId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId },
    isDeleted: false
  })
  .populate('sender', 'name email avatar')
  .sort('createdAt');
};

// Static method to create system message
chatSchema.statics.createSystemMessage = async function(projectId, message, metadata = {}) {
  return this.create({
    project: projectId,
    message: message,
    type: 'system',
    metadata: metadata,
    sender: null // System messages don't have a sender
  });
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
