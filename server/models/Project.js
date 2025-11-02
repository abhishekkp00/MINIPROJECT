/**
 * Project Model
 * Schema for project management with team members, deadlines, and progress tracking
 */

import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Project creator and ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Team members with roles
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'lead', 'contributor'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Mentor assignment
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Project timeline
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: [true, 'Project deadline is required']
  },
  completedAt: {
    type: Date
  },
  
  // Project status
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'in-review', 'completed', 'on-hold', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Project category/tags
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
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
  
  // Project statistics
  stats: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    pendingTasks: {
      type: Number,
      default: 0
    },
    inProgressTasks: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    }
  },
  
  // AI-generated insights
  aiInsights: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    riskFactors: [{
      type: String
    }],
    suggestions: [{
      type: String
    }],
    predictedCompletion: {
      type: Date
    },
    lastAnalyzed: {
      type: Date
    }
  },
  
  // Project repository links
  repository: {
    type: String,
    trim: true
  },
  documentation: {
    type: String,
    trim: true
  },
  
  // Project visibility
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Archive status
  isArchived: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
projectSchema.index({ createdBy: 1, status: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ mentor: 1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ status: 1, priority: 1 });

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
projectSchema.virtual('isOverdue').get(function() {
  if (!this.deadline || this.status === 'completed') return false;
  return new Date() > new Date(this.deadline);
});

// Virtual to populate tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project'
});

// Pre-save middleware to update progress based on tasks
projectSchema.pre('save', function(next) {
  // Calculate progress percentage
  if (this.stats.totalTasks > 0) {
    this.progress = Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
  }
  
  // Auto-complete project if all tasks are done
  if (this.stats.totalTasks > 0 && this.stats.completedTasks === this.stats.totalTasks) {
    if (this.status !== 'completed') {
      this.status = 'in-review';
    }
  }
  
  next();
});

// Method to add team member
projectSchema.methods.addMember = async function(userId, role = 'member') {
  // Check if user is already a member
  const isMember = this.members.some(m => m.user.toString() === userId.toString());
  
  if (!isMember) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
    await this.save();
  }
  
  return this;
};

// Method to remove team member
projectSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  await this.save();
  return this;
};

// Method to update statistics
projectSchema.methods.updateStats = async function() {
  const Task = mongoose.model('Task');
  const tasks = await Task.find({ project: this._id });
  
  this.stats.totalTasks = tasks.length;
  this.stats.completedTasks = tasks.filter(t => t.status === 'completed').length;
  this.stats.pendingTasks = tasks.filter(t => t.status === 'pending').length;
  this.stats.inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  
  await this.save();
  return this;
};

// Static method to get projects by user
projectSchema.statics.getByUser = async function(userId, role) {
  let query = {};
  
  if (role === 'mentor') {
    query.mentor = userId;
  } else {
    query.$or = [
      { createdBy: userId },
      { 'members.user': userId }
    ];
  }
  
  return this.find(query)
    .populate('createdBy', 'name email avatar')
    .populate('teamLead', 'name email avatar')
    .populate('members.user', 'name email avatar role')
    .populate('mentor', 'name email avatar')
    .sort('-createdAt');
};

const Project = mongoose.model('Project', projectSchema);

export default Project;
