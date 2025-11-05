/**
 * Chat Model
 * Schema for project chat rooms (references Message model)
 * Recommended approach: Separate Chat (room) and Message models for better scalability
 */

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      unique: true // One chat per project (unique creates index automatically)
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        leftAt: {
          type: Date
        },
        isActive: {
          type: Boolean,
          default: true
        },
        lastReadAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastMessageAt: {
      type: Date
    },
    messageCount: {
      type: Number,
      default: 0
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date
    },
    settings: {
      allowAttachments: {
        type: Boolean,
        default: true
      },
      maxAttachmentSize: {
        type: Number,
        default: 10485760 // 10MB in bytes
      },
      allowedFileTypes: {
        type: [String],
        default: ['image', 'document', 'video', 'audio']
      },
      muteNotifications: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
// Note: project field already has unique index from schema definition
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ isArchived: 1 });

// Virtual to get active participants count
chatSchema.virtual('activeParticipantsCount').get(function () {
  return this.participants.filter((p) => p.isActive).length;
});

// Method to add participant
chatSchema.methods.addParticipant = async function (userId) {
  // Check if user is already a participant
  const existingParticipant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    // Reactivate if previously left
    if (!existingParticipant.isActive) {
      existingParticipant.isActive = true;
      existingParticipant.joinedAt = new Date();
      existingParticipant.leftAt = null;
    }
  } else {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      isActive: true,
      lastReadAt: new Date()
    });
  }
  
  return await this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = async function (userId) {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
  
  return await this.save();
};

// Method to update last read timestamp for a user
chatSchema.methods.updateLastRead = async function (userId) {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.lastReadAt = new Date();
    return await this.save();
  }
  
  return this;
};

// Method to check if user is participant
chatSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (p) => p.user.toString() === userId.toString() && p.isActive
  );
};

// Method to archive chat
chatSchema.methods.archiveChat = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  return await this.save();
};

// Method to unarchive chat
chatSchema.methods.unarchiveChat = async function () {
  this.isArchived = false;
  this.archivedAt = null;
  return await this.save();
};

// Method to update last message info
chatSchema.methods.updateLastMessage = async function (messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  this.messageCount += 1;
  return await this.save();
};

// Method to decrement message count (when message is deleted)
chatSchema.methods.decrementMessageCount = async function () {
  if (this.messageCount > 0) {
    this.messageCount -= 1;
    return await this.save();
  }
  return this;
};

// Method to get unread count for a user
chatSchema.methods.getUnreadCount = async function (userId) {
  const Message = mongoose.model('Message');
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    return 0;
  }
  
  return await Message.countDocuments({
    chat: this._id,
    deleted: false,
    sender: { $ne: userId },
    createdAt: { $gt: participant.lastReadAt }
  });
};

// Static method to get or create chat for a project
chatSchema.statics.getOrCreateForProject = async function (projectId) {
  let chat = await this.findOne({ project: projectId });
  
  if (!chat) {
    chat = await this.create({
      project: projectId,
      participants: []
    });
  }
  
  return chat;
};

// Static method to get chat with full details
chatSchema.statics.getChatWithDetails = async function (projectId) {
  const chat = await this.findOne({ project: projectId })
    .populate('project', 'name description owner members')
    .populate('participants.user', 'name email profilePicture role')
    .populate('lastMessage')
    .lean();
  
  return chat;
};

// Static method to get user's chats with pagination
chatSchema.statics.getUserChats = async function (userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const chats = await this.find({
    'participants.user': userId,
    'participants.isActive': true,
    isArchived: false
  })
    .populate('project', 'name description status')
    .populate('lastMessage')
    .populate('participants.user', 'name profilePicture')
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments({
    'participants.user': userId,
    'participants.isActive': true,
    isArchived: false
  });
  
  return {
    chats,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalChats: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  };
};

// Static method to sync participants with project members
chatSchema.statics.syncParticipantsWithProject = async function (projectId) {
  const Project = mongoose.model('Project');
  const chat = await this.findOne({ project: projectId });
  
  if (!chat) {
    return null;
  }
  
  const project = await Project.findById(projectId);
  
  if (!project) {
    return chat;
  }
  
  // Get all project members including owner
  const projectMembers = [
    project.owner.toString(),
    ...project.members.map((m) => m.user.toString())
  ];
  
  // Add new members to chat
  for (const memberId of projectMembers) {
    const isParticipant = chat.participants.some(
      (p) => p.user.toString() === memberId
    );
    
    if (!isParticipant) {
      await chat.addParticipant(memberId);
    }
  }
  
  // Remove participants who are no longer in project
  for (const participant of chat.participants) {
    if (!projectMembers.includes(participant.user.toString())) {
      await chat.removeParticipant(participant.user);
    }
  }
  
  return chat;
};

// Pre-save middleware to ensure data consistency
chatSchema.pre('save', function (next) {
  // Remove duplicate participants
  const uniqueParticipants = [];
  const seenUsers = new Set();
  
  for (const participant of this.participants) {
    const userId = participant.user.toString();
    if (!seenUsers.has(userId)) {
      seenUsers.add(userId);
      uniqueParticipants.push(participant);
    }
  }
  
  this.participants = uniqueParticipants;
  
  next();
});

// Post-save middleware to update project with chat reference
chatSchema.post('save', async function (doc) {
  try {
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(doc.project, { chat: doc._id });
  } catch (error) {
    console.error('Error updating project with chat reference:', error);
  }
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
