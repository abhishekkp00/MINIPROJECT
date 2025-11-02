/**
 * Submission Model
 * Schema for task deliverables and file submissions
 */

import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task reference is required']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitted by user is required']
  },
  
  // Submission content
  description: {
    type: String,
    required: [true, 'Submission description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // File attachments
  files: [{
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
    fileUrl: String
  }],
  
  // Links (GitHub, Google Drive, etc.)
  links: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['github', 'drive', 'website', 'other'],
      default: 'other'
    }
  }],
  
  // Submission status
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'approved', 'rejected', 'revision-required'],
    default: 'submitted'
  },
  
  // Review information
  review: {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
    },
    revisionNotes: {
      type: String,
      trim: true
    }
  },
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Late submission flag
  isLate: {
    type: Boolean,
    default: false
  },
  lateByHours: {
    type: Number,
    default: 0
  },
  
  // Comments on submission
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
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
submissionSchema.index({ task: 1 });
submissionSchema.index({ project: 1 });
submissionSchema.index({ submittedBy: 1 });
submissionSchema.index({ status: 1 });

// Pre-save middleware to check if submission is late
submissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Task = mongoose.model('Task');
      const task = await Task.findById(this.task);
      
      if (task && task.deadline) {
        const deadline = new Date(task.deadline);
        const submitTime = this.submittedAt || new Date();
        
        if (submitTime > deadline) {
          this.isLate = true;
          const diffMs = submitTime - deadline;
          this.lateByHours = Math.round(diffMs / (1000 * 60 * 60));
        }
      }
    } catch (error) {
      console.error('Error checking submission deadline:', error);
    }
  }
  next();
});

// Method to add review
submissionSchema.methods.addReview = async function(reviewerId, feedback, rating, status) {
  this.review = {
    reviewer: reviewerId,
    feedback: feedback,
    rating: rating,
    reviewedAt: new Date()
  };
  
  this.status = status;
  
  await this.save();
  return this;
};

// Method to add comment
submissionSchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    user: userId,
    text: text,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

// Method to create revision (new version)
submissionSchema.methods.createRevision = async function(newSubmissionData) {
  // Create new submission with incremented version
  const newSubmission = new this.constructor({
    ...newSubmissionData,
    version: this.version + 1,
    previousVersions: [...this.previousVersions, this._id],
    task: this.task,
    project: this.project
  });
  
  await newSubmission.save();
  return newSubmission;
};

// Static method to get submissions by task
submissionSchema.statics.getByTask = async function(taskId) {
  return this.find({ task: taskId })
    .populate('submittedBy', 'name email avatar')
    .populate('review.reviewer', 'name email avatar')
    .sort('-submittedAt');
};

// Static method to get submissions by user
submissionSchema.statics.getByUser = async function(userId) {
  return this.find({ submittedBy: userId })
    .populate('task', 'title status priority')
    .populate('project', 'title')
    .populate('review.reviewer', 'name email')
    .sort('-submittedAt');
};

// Static method to get pending reviews for mentor
submissionSchema.statics.getPendingReviews = async function(mentorId) {
  // First find projects where user is mentor
  const Project = mongoose.model('Project');
  const projects = await Project.find({ mentor: mentorId }).select('_id');
  const projectIds = projects.map(p => p._id);
  
  return this.find({
    project: { $in: projectIds },
    status: { $in: ['submitted', 'under-review'] }
  })
  .populate('task', 'title priority')
  .populate('project', 'title')
  .populate('submittedBy', 'name email avatar')
  .sort('submittedAt');
};

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
