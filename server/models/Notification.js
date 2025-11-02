/**
 * Notification Model
 * Schema for user notifications and alerts
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'task-assigned',
      'task-updated',
      'task-completed',
      'task-overdue',
      'project-created',
      'project-updated',
      'member-added',
      'member-removed',
      'deadline-reminder',
      'mentor-feedback',
      'submission-reviewed',
      'chat-mention',
      'system'
    ],
    required: true
  },
  
  // Notification content
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  
  // Reference to related entities
  references: {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission'
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  },
  
  // Action link
  actionUrl: {
    type: String,
    trim: true
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Delivery method
  deliveryMethod: {
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    }
  },
  
  // Delivery status
  deliveryStatus: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String
    }
  },
  
  // Expiration
  expiresAt: {
    type: Date
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = async function() {
  if (this.isRead) {
    this.isRead = false;
    this.readAt = null;
    await this.save();
  }
  return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = await this.create(data);
  
  // Emit socket event for real-time notification
  // This will be handled by the socket service
  
  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    isRead = null,
    type = null
  } = options;
  
  const query = { recipient: userId };
  
  if (isRead !== null) {
    query.isRead = isRead;
  }
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('sender', 'name avatar')
    .populate('references.project', 'title')
    .populate('references.task', 'title')
    .sort('-createdAt')
    .limit(limit)
    .skip(skip);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function(recipients, notificationData) {
  const notifications = recipients.map(recipientId => ({
    ...notificationData,
    recipient: recipientId
  }));
  
  return this.insertMany(notifications);
};

// Helper method to create task assignment notification
notificationSchema.statics.notifyTaskAssignment = async function(taskId, assignedToId, assignedById) {
  const Task = mongoose.model('Task');
  const task = await Task.findById(taskId).populate('project', 'title');
  
  return this.createNotification({
    recipient: assignedToId,
    sender: assignedById,
    type: 'task-assigned',
    title: 'New Task Assigned',
    message: `You have been assigned a new task: ${task.title}`,
    references: {
      task: taskId,
      project: task.project._id
    },
    actionUrl: `/projects/${task.project._id}/tasks/${taskId}`,
    priority: task.priority
  });
};

// Helper method to create deadline reminder
notificationSchema.statics.notifyDeadlineReminder = async function(taskId, userId) {
  const Task = mongoose.model('Task');
  const task = await Task.findById(taskId).populate('project', 'title');
  
  return this.createNotification({
    recipient: userId,
    type: 'deadline-reminder',
    title: 'Deadline Approaching',
    message: `Task "${task.title}" is due soon!`,
    references: {
      task: taskId,
      project: task.project._id
    },
    actionUrl: `/projects/${task.project._id}/tasks/${taskId}`,
    priority: 'high'
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
