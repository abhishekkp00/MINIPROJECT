/**
 * Task Routes
 * Handles all task-related API endpoints
 */

import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get all tasks for a project
 * @access  Private (Project members only)
 */
router.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Verify user is project member or owner
    if (!project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { project: projectId };

    // Apply filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.assignee) {
      query.assignedTo = req.query.assignee;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Get total count
    const total = await Task.countDocuments(query);

    // Get tasks
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .populate('project', 'name status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/projects/:projectId/tasks
 * @desc    Create a new task in a project
 * @access  Private (Project members only)
 */
router.post('/projects/:projectId/tasks', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, deadline, priority, assignedTo, status } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Task description is required'
      });
    }

    if (!deadline) {
      return res.status(400).json({
        success: false,
        message: 'Task deadline is required'
      });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Verify user is project member
    if (!project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    // Validate deadline
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deadline format'
      });
    }

    // Validate assignee if provided
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(404).json({
          success: false,
          message: 'Assignee user not found'
        });
      }

      // Check if assignee is a project member
      if (!project.hasAccess(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a project member'
        });
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      project: projectId,
      createdBy: req.user._id,
      assignedTo: assignedTo || req.user._id, // Assign to creator if no assignee specified
      deadline: deadlineDate,
      priority: priority || 'medium',
      status: status || 'pending'
    });

    // Populate task data
    await task.populate('assignedTo', 'name email avatar role');
    await task.populate('createdBy', 'name email avatar role');
    await task.populate('project', 'name status');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating task',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task details
 * @access  Private (Project members only)
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .populate('project', 'name status owner members')
      .populate('comments.user', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get project to check access
    const project = await Project.findById(task.project._id);
    
    if (!project || !project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching task',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details
 * @access  Private (Task owner, assignee, or project owner)
 */
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get full project details to check permissions
    const project = await Project.findById(task.project._id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Check if user has permission (project owner, task creator, or assignee)
    const isProjectOwner = project.isOwner(req.user._id);
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();

    if (!isProjectOwner && !isTaskCreator && !isAssignee) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update this task'
      });
    }

    const { title, description, status, priority, deadline, assignedTo } = req.body;

    // Update allowed fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;

    // Validate and update deadline
    if (deadline !== undefined) {
      if (deadline === null) {
        return res.status(400).json({
          success: false,
          message: 'Deadline is required'
        });
      }
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deadline format'
        });
      }
      task.deadline = deadlineDate;
    }

    // Only project owner can reassign tasks
    if (assignedTo !== undefined) {
      if (!isProjectOwner) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner can reassign tasks'
        });
      }

      // Validate new assignee
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(404).json({
          success: false,
          message: 'Assignee user not found'
        });
      }

      // Check if assignee is a project member
      if (!project.hasAccess(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a project member'
        });
      }

      task.assignedTo = assignedTo;
    }

    await task.save();

    // Populate task data
    await task.populate('assignedTo', 'name email avatar role');
    await task.populate('createdBy', 'name email avatar role');
    await task.populate('project', 'name status');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating task',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (Task creator or project owner)
 */
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get project to check permissions
    const project = await Project.findById(task.project);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Check if user has permission (project owner or task creator)
    const isProjectOwner = project.isOwner(req.user._id);
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isProjectOwner && !isTaskCreator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project owner or task creator can delete this task'
      });
    }

    const taskTitle = task.title;
    const taskId = task._id;

    // Delete the task
    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        taskId,
        taskTitle
      }
    });
  } catch (error) {
    console.error('Error deleting task:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting task',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tasks/:id/assign
 * @desc    Assign task to a user
 * @access  Private (Project owner only)
 */
router.post('/:id/assign', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get project
    const project = await Project.findById(task.project);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Only project owner can assign tasks
    if (!project.isOwner(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project owner can assign tasks'
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to project members if not already a member
    if (!project.hasAccess(userId)) {
      const addResult = await project.addMember(userId);
      if (!addResult.success) {
        return res.status(400).json({
          success: false,
          message: addResult.message
        });
      }
    }

    // Assign task
    task.assignedTo = userId;
    
    // Add activity log entry
    task.activityLog.push({
      action: 'task_assigned',
      user: req.user._id,
      timestamp: new Date(),
      details: `Assigned to ${user.name}`
    });

    await task.save();

    // Populate task data
    await task.populate('assignedTo', 'name email avatar role');
    await task.populate('createdBy', 'name email avatar role');
    await task.populate('project', 'name status');

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: task
    });
  } catch (error) {
    console.error('Error assigning task:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while assigning task',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Add comment to task
 * @access  Private (Project members only)
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get project to check access
    const project = await Project.findById(task.project);
    
    if (!project || !project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    // Add comment using model method
    await task.addComment(req.user._id, text);

    // Populate comment user data
    await task.populate('comments.user', 'name email avatar');
    await task.populate('assignedTo', 'name email avatar role');
    await task.populate('createdBy', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: task
    });
  } catch (error) {
    console.error('Error adding comment:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding comment',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Update task status
 * @access  Private (Assignee or project owner)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'in-review', 'completed', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get project to check permissions
    const project = await Project.findById(task.project);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Check if user is assignee or project owner
    const isProjectOwner = project.isOwner(req.user._id);
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();

    if (!isProjectOwner && !isAssignee) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only assignee or project owner can update task status'
      });
    }

    // Update status using model method
    await task.updateStatus(status, req.user._id);

    // Populate task data
    await task.populate('assignedTo', 'name email avatar role');
    await task.populate('createdBy', 'name email avatar role');
    await task.populate('project', 'name status');

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task status:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating task status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tasks/user/:userId
 * @desc    Get all tasks assigned to a specific user
 * @access  Private
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only view their own tasks unless they're an admin/mentor
    if (userId !== req.user._id.toString() && req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own tasks'
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { assignedTo: userId };

    // Apply status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Get total count
    const total = await Task.countDocuments(query);

    // Get tasks
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .populate('project', 'name status priority')
      .sort({ deadline: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching user tasks',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tasks/overdue
 * @desc    Get all overdue tasks for current user
 * @access  Private
 */
router.get('/overdue', async (req, res) => {
  try {
    const tasks = await Task.getOverdueTasks()
      .then(tasks => tasks.filter(task => 
        task.assignedTo._id.toString() === req.user._id.toString()
      ));

    res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while fetching overdue tasks',
      error: error.message
    });
  }
});

export default router;
