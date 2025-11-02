/**
 * Task Model
 * Schema for task management with assignments, priorities, and status tracking
 */

import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Project reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  
  // Task assignment
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  
  // Task properties
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'in-review', 'completed', 'blocked'],
    default: 'pending'
  },
  
  // Timeline
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: [true, 'Task deadline is required']
  },
  completedAt: {
    type: Date
  },
  
  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Task dependencies
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  // Subtasks
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  }],
  
  // File attachments
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Comments and feedback
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Mentor review
  mentorReview: {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision-required'],
      default: 'pending'
    },
    feedback: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    reviewedAt: {
      type: Date
    }
  },
  
  // Task tags
  tags: [{
    type: String,
    trim: true
  }],
  
  // Estimated time (in hours)
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  
  // Reminders
  reminders: [{
    message: String,
    sentAt: Date,
    type: {
      type: String,
      enum: ['deadline-approaching', 'overdue', 'status-update']
    }
  }],
  
  // Activity log
  activityLog: [{
    action: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String
    }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ createdBy: 1 });

// Virtual for days remaining
taskSchema.virtual('daysRemaining').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.deadline || this.status === 'completed') return false;
  return new Date() > new Date(this.deadline);
});

// Virtual for completion percentage of subtasks
taskSchema.virtual('subtaskProgress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) return 100;
  const completedCount = this.subtasks.filter(st => st.completed).length;
  return Math.round((completedCount / this.subtasks.length) * 100);
});

// Pre-save middleware to update project statistics
taskSchema.pre('save', async function(next) {
  // Update progress based on subtasks
  if (this.subtasks && this.subtasks.length > 0) {
    const completedCount = this.subtasks.filter(st => st.completed).length;
    this.progress = Math.round((completedCount / this.subtasks.length) * 100);
  }
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Post-save middleware to update project stats
taskSchema.post('save', async function(doc) {
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(doc.project);
    
    if (project) {
      await project.updateStats();
    }
  } catch (error) {
    console.error('Error updating project stats:', error);
  }
});

// Post-remove middleware to update project stats
taskSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(doc.project);
    
    if (project) {
      await project.updateStats();
    }
  } catch (error) {
    console.error('Error updating project stats:', error);
  }
});

// Method to add comment
taskSchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    user: userId,
    text: text,
    createdAt: new Date()
  });
  
  // Add to activity log
  this.activityLog.push({
    action: 'comment_added',
    user: userId,
    timestamp: new Date(),
    details: text.substring(0, 100)
  });
  
  await this.save();
  return this;
};

// Method to update status with activity log
taskSchema.methods.updateStatus = async function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to activity log
  this.activityLog.push({
    action: 'status_changed',
    user: userId,
    timestamp: new Date(),
    details: `Changed from ${oldStatus} to ${newStatus}`
  });
  
  await this.save();
  return this;
};

// Method to add mentor review
taskSchema.methods.addMentorReview = async function(reviewerId, status, feedback, rating) {
  this.mentorReview = {
    reviewer: reviewerId,
    status: status,
    feedback: feedback,
    rating: rating,
    reviewedAt: new Date()
  };
  
  // Update task status based on review
  if (status === 'approved') {
    this.status = 'completed';
  } else if (status === 'revision-required') {
    this.status = 'in-progress';
  }
  
  // Add to activity log
  this.activityLog.push({
    action: 'mentor_reviewed',
    user: reviewerId,
    timestamp: new Date(),
    details: `Review: ${status}`
  });
  
  await this.save();
  return this;
};

// Static method to get tasks by user
taskSchema.statics.getByUser = async function(userId, status = null) {
  const query = { assignedTo: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('project', 'title status priority')
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .sort('-createdAt');
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = async function(projectId = null) {
  const query = {
    deadline: { $lt: new Date() },
    status: { $nin: ['completed'] }
  };
  
  if (projectId) {
    query.project = projectId;
  }
  
  return this.find(query)
    .populate('project', 'title')
    .populate('assignedTo', 'name email')
    .sort('deadline');
};

const Task = mongoose.model('Task', taskSchema);

export default Task;
