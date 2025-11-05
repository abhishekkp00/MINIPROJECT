import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat reference is required'],
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    attachments: [
      {
        url: {
          type: String,
          required: true
        },
        filename: {
          type: String,
          required: true
        },
        fileType: {
          type: String,
          enum: ['image', 'document', 'video', 'audio', 'other'],
          default: 'other'
        },
        fileSize: {
          type: Number // in bytes
        }
      }
    ],
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        emoji: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ deleted: 1 });

// Virtual for checking if message is read by a specific user
messageSchema.virtual('isReadBy').get(function () {
  return (userId) => {
    return this.readBy.some((read) => read.user.toString() === userId.toString());
  };
});

// Method to soft delete message
messageSchema.methods.softDelete = async function (userId) {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

// Method to edit message
messageSchema.methods.editMessage = async function (newText) {
  if (this.deleted) {
    throw new Error('Cannot edit a deleted message');
  }
  
  this.text = newText;
  this.edited = true;
  this.editedAt = new Date();
  return await this.save();
};

// Method to add attachment
messageSchema.methods.addAttachment = async function (attachment) {
  if (this.attachments.length >= 10) {
    throw new Error('Maximum 10 attachments allowed per message');
  }
  
  this.attachments.push(attachment);
  return await this.save();
};

// Method to mark as read by a user
messageSchema.methods.markAsRead = async function (userId) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(
    (read) => read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return await this.save();
  }
  
  return this;
};

// Method to add reaction
messageSchema.methods.addReaction = async function (userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    (reaction) => reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji,
    createdAt: new Date()
  });
  
  return await this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = async function (userId) {
  this.reactions = this.reactions.filter(
    (reaction) => reaction.user.toString() !== userId.toString()
  );
  
  return await this.save();
};

// Static method to get messages with pagination
messageSchema.statics.getMessagesPaginated = async function (
  chatId,
  page = 1,
  limit = 50,
  includeDeleted = false
) {
  const query = { chat: chatId };
  
  if (!includeDeleted) {
    query.deleted = false;
  }
  
  const skip = (page - 1) * limit;
  
  const messages = await this.find(query)
    .populate('sender', 'name email profilePicture')
    .populate('replyTo', 'text sender')
    .populate('readBy.user', 'name profilePicture')
    .populate('reactions.user', 'name profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments(query);
  
  return {
    messages: messages.reverse(), // Reverse to get chronological order
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMessages: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  };
};

// Static method to get unread count for a user
messageSchema.statics.getUnreadCount = async function (chatId, userId) {
  return await this.countDocuments({
    chat: chatId,
    deleted: false,
    sender: { $ne: userId }, // Exclude messages sent by the user
    'readBy.user': { $ne: userId } // Not read by the user
  });
};

// Static method to mark all messages as read in a chat
messageSchema.statics.markAllAsRead = async function (chatId, userId) {
  const messages = await this.find({
    chat: chatId,
    deleted: false,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId }
  });
  
  const updatePromises = messages.map((message) => message.markAsRead(userId));
  
  return await Promise.all(updatePromises);
};

// Pre-save middleware to validate text content
messageSchema.pre('save', function (next) {
  if (this.isModified('text')) {
    // Trim whitespace
    this.text = this.text.trim();
    
    // Check if text is empty after trim
    if (!this.text && this.attachments.length === 0) {
      return next(new Error('Message must have text or attachments'));
    }
  }
  
  next();
});

// Method to get message details (excluding sensitive data for deleted messages)
messageSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  
  if (this.deleted) {
    return {
      _id: obj._id,
      chat: obj.chat,
      sender: obj.sender,
      text: '[Message deleted]',
      deleted: true,
      deletedAt: obj.deletedAt,
      createdAt: obj.createdAt
    };
  }
  
  return obj;
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
