/**
 * Project Model
 * Schema for project management with team members, deadlines, and progress tracking
 */

import mongoose from 'mongoose';

/**
 * Project Schema
 * Manages project information including owner, members, status, and deadlines
 */
const projectSchema = new mongoose.Schema(
  {
    // Project name
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters long'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },

    // Project description
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },

    // Project owner (creator)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
      index: true, // Index for fast queries
    },

    // Project members (team)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Project deadline
    deadline: {
      type: Date,
      validate: {
        validator: function (value) {
          // Deadline must be in the future (only for new projects)
          if (this.isNew && value) {
            return value > new Date();
          }
          return true;
        },
        message: 'Deadline must be in the future',
      },
    },

    // Project status
    status: {
      type: String,
      enum: {
        values: ['planning', 'active', 'completed'],
        message: 'Status must be either planning, active, or completed',
      },
      default: 'active',
      lowercase: true,
      trim: true,
    },

    // Project priority
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be either low, medium, or high',
      },
      default: 'medium',
      lowercase: true,
      trim: true,
    },

    // Project tags
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, 'Tag cannot exceed 30 characters'],
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================

// Compound index for efficient queries
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ tags: 1 });

// Text index for search functionality
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ==================== VIRTUALS ====================

// Virtual for checking if project is overdue
projectSchema.virtual('isOverdue').get(function () {
  if (!this.deadline) return false;
  return this.deadline < new Date() && this.status !== 'completed';
});

// Virtual for days remaining until deadline
projectSchema.virtual('daysRemaining').get(function () {
  if (!this.deadline) return null;
  const now = new Date();
  const diff = this.deadline - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for member count
projectSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

// ==================== METHODS ====================

/**
 * Check if a user is the owner of the project
 * @param {String|ObjectId} userId - User ID to check
 * @returns {Boolean}
 */
projectSchema.methods.isOwner = function (userId) {
  return this.owner.toString() === userId.toString();
};

/**
 * Check if a user is a member of the project
 * @param {String|ObjectId} userId - User ID to check
 * @returns {Boolean}
 */
projectSchema.methods.isMember = function (userId) {
  if (!this.members || this.members.length === 0) return false;
  return this.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
};

/**
 * Check if a user has access to the project (owner or member)
 * @param {String|ObjectId} userId - User ID to check
 * @returns {Boolean}
 */
projectSchema.methods.hasAccess = function (userId) {
  return this.isOwner(userId) || this.isMember(userId);
};

/**
 * Add a member to the project
 * @param {String|ObjectId} userId - User ID to add
 * @returns {Promise<Project>}
 */
projectSchema.methods.addMember = async function (userId) {
  // Check if user is already a member or owner
  if (this.isOwner(userId)) {
    throw new Error('Owner is automatically a member');
  }
  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }

  this.members.push(userId);
  return await this.save();
};

/**
 * Remove a member from the project
 * @param {String|ObjectId} userId - User ID to remove
 * @returns {Promise<Project>}
 */
projectSchema.methods.removeMember = async function (userId) {
  // Cannot remove the owner
  if (this.isOwner(userId)) {
    throw new Error('Cannot remove the project owner');
  }

  const initialLength = this.members.length;
  this.members = this.members.filter(
    (memberId) => memberId.toString() !== userId.toString()
  );

  if (this.members.length === initialLength) {
    throw new Error('User is not a member of this project');
  }

  return await this.save();
};

/**
 * Get project summary (public safe data)
 * @returns {Object}
 */
projectSchema.methods.getSummary = function () {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    status: this.status,
    priority: this.priority,
    deadline: this.deadline,
    tags: this.tags,
    memberCount: this.memberCount,
    isOverdue: this.isOverdue,
    daysRemaining: this.daysRemaining,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ==================== STATIC METHODS ====================

/**
 * Find projects by owner
 * @param {String|ObjectId} userId - Owner ID
 * @param {Object} options - Query options (status, priority, etc.)
 * @returns {Promise<Array>}
 */
projectSchema.statics.findByOwner = function (userId, options = {}) {
  const query = { owner: userId };

  if (options.status) {
    query.status = options.status;
  }
  if (options.priority) {
    query.priority = options.priority;
  }

  return this.find(query)
    .populate('owner', 'name email role')
    .populate('members', 'name email role')
    .sort({ createdAt: -1 });
};

/**
 * Find projects where user is a member
 * @param {String|ObjectId} userId - Member ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
projectSchema.statics.findByMember = function (userId, options = {}) {
  const query = { members: userId };

  if (options.status) {
    query.status = options.status;
  }
  if (options.priority) {
    query.priority = options.priority;
  }

  return this.find(query)
    .populate('owner', 'name email role')
    .populate('members', 'name email role')
    .sort({ createdAt: -1 });
};

/**
 * Find all projects accessible by user (owner or member)
 * @param {String|ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
projectSchema.statics.findAccessibleByUser = function (userId, options = {}) {
  const query = {
    $or: [{ owner: userId }, { members: userId }],
  };

  if (options.status) {
    query.status = options.status;
  }
  if (options.priority) {
    query.priority = options.priority;
  }

  return this.find(query)
    .populate('owner', 'name email role')
    .populate('members', 'name email role')
    .sort({ createdAt: -1 });
};

/**
 * Search projects by text
 * @param {String} searchText - Search query
 * @param {String|ObjectId} userId - User ID for access control
 * @returns {Promise<Array>}
 */
projectSchema.statics.searchProjects = function (searchText, userId) {
  return this.find({
    $and: [
      { $text: { $search: searchText } },
      { $or: [{ owner: userId }, { members: userId }] },
    ],
  })
    .populate('owner', 'name email role')
    .populate('members', 'name email role')
    .sort({ score: { $meta: 'textScore' } });
};

/**
 * Get overdue projects
 * @returns {Promise<Array>}
 */
projectSchema.statics.findOverdue = function () {
  return this.find({
    deadline: { $lt: new Date() },
    status: { $ne: 'completed' },
  })
    .populate('owner', 'name email role')
    .populate('members', 'name email role')
    .sort({ deadline: 1 });
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save hook: Ensure owner is not in members array
 */
projectSchema.pre('save', function (next) {
  if (this.members && this.owner) {
    this.members = this.members.filter(
      (memberId) => memberId.toString() !== this.owner.toString()
    );
  }
  next();
});

/**
 * Pre-save hook: Remove duplicate members
 */
projectSchema.pre('save', function (next) {
  if (this.members && this.members.length > 0) {
    const uniqueMembers = [...new Set(this.members.map((id) => id.toString()))];
    this.members = uniqueMembers.map((id) => mongoose.Types.ObjectId(id));
  }
  next();
});

/**
 * Pre-save hook: Normalize tags (remove duplicates, empty strings)
 */
projectSchema.pre('save', function (next) {
  if (this.tags && this.tags.length > 0) {
    this.tags = [...new Set(this.tags.filter((tag) => tag && tag.trim()))];
  }
  next();
});

// ==================== MODEL ====================

const Project = mongoose.model('Project', projectSchema);

export default Project;
