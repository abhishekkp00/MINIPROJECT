/**
 * Project Routes
 * Handles all project-related API endpoints
 */

import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/projects
 * @desc    Get all projects where user is owner or member
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get projects where user is owner or member
    const query = {
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    };

    // Apply filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    // Get projects with pagination
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, deadline, tags, priority, status } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Project description is required'
      });
    }

    // Validate deadline if provided
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deadline format'
        });
      }
      if (deadlineDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future'
        });
      }
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id], // Add creator as member
      deadline: deadline || undefined,
      tags: tags || [],
      priority: priority || 'medium',
      status: status || 'planning'
    });

    // Populate owner and members
    await project.populate('owner', 'name email avatar role');
    await project.populate('members', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating project',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project details
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access (owner or member)
    if (!project.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    // Get project tasks count
    const tasksCount = await Task.countDocuments({ project: project._id });
    const completedTasksCount = await Task.countDocuments({ 
      project: project._id, 
      status: 'completed' 
    });

    // Add task stats to response
    const projectData = project.toObject();
    projectData.taskStats = {
      total: tasksCount,
      completed: completedTasksCount,
      pending: tasksCount - completedTasksCount,
      completionRate: tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0
    };

    res.status(200).json({
      success: true,
      data: projectData
    });
  } catch (error) {
    console.error('Error fetching project:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching project',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private (Owner only)
 */
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner
    if (!project.isOwner(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project owner can update this project'
      });
    }

    const { name, description, deadline, status, priority, tags } = req.body;

    // Update allowed fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (tags !== undefined) project.tags = tags;
    
    if (deadline !== undefined) {
      if (deadline === null) {
        project.deadline = undefined;
      } else {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid deadline format'
          });
        }
        if (deadlineDate < new Date() && status !== 'completed') {
          return res.status(400).json({
            success: false,
            message: 'Deadline must be in the future for active projects'
          });
        }
        project.deadline = deadlineDate;
      }
    }

    await project.save();

    // Populate owner and members
    await project.populate('owner', 'name email avatar role');
    await project.populate('members', 'name email avatar role');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error updating project:', error);

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
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating project',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project and all associated tasks
 * @access  Private (Owner only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner
    if (!project.isOwner(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project owner can delete this project'
      });
    }

    // Delete all associated tasks
    const deletedTasks = await Task.deleteMany({ project: project._id });

    // Delete the project
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project and associated tasks deleted successfully',
      data: {
        projectId: project._id,
        projectName: project.name,
        tasksDeleted: deletedTasks.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting project:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting project',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/projects/:projectId/members
 * @desc    Add member to project
 * @access  Private (Owner or Team Lead)
 */
router.post('/:projectId/members', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required in body' });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Permission: owner OR a team-lead who is a member of the project
    const isOwner = project.isOwner(req.user._id);
    const isTeamLead = req.user.role === 'team-lead' && project.isMember(req.user._id);
    if (!isOwner && !isTeamLead) {
      return res.status(403).json({ success: false, message: 'Access denied. Only owner or team lead can add members' });
    }

    // Validate target user
    if (project.isOwner(userId) || project.isMember(userId)) {
      return res.status(400).json({ success: false, message: 'User is already part of the project or is the owner' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add member
    project.members.push(user._id);
    // Pre-save hooks in model will dedupe and ensure owner not in members
    await project.save();

    await project.populate('owner', 'name email avatar role');
    await project.populate('members', 'name email avatar role');

    res.status(200).json({ success: true, message: 'Member added successfully', data: project });
  } catch (error) {
    console.error('Error adding member:', error);
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error while adding member', error: error.message });
  }
});

/**
 * @route   DELETE /api/projects/:projectId/members/:userId
 * @desc    Remove member from project and reassign their tasks
 * @access  Private (Owner or Team Lead)
 */
router.delete('/:projectId/members/:userId', async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Permission: owner OR a team-lead who is a member of the project
    const isOwner = project.isOwner(req.user._id);
    const isTeamLead = req.user.role === 'team-lead' && project.isMember(req.user._id);
    if (!isOwner && !isTeamLead) {
      return res.status(403).json({ success: false, message: 'Access denied. Only owner or team lead can remove members' });
    }

    // Prevent removing the owner
    if (project.isOwner(userId)) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure user is a current member
    if (!project.isMember(userId)) {
      return res.status(400).json({ success: false, message: 'User is not a member of this project' });
    }

    // Remove member from project.members
    project.members = project.members.filter(m => m.toString() !== userId.toString());
    await project.save();

    // Reassign tasks that were assigned to the removed member to the project owner
    try {
      await Task.updateMany(
        { project: project._id, assignedTo: userId },
        { $set: { assignedTo: project.owner } }
      );
    } catch (taskErr) {
      console.error('Error reassigning tasks for removed member:', taskErr);
      // continue: member removed but task reassignment failed
    }

    await project.populate('owner', 'name email avatar role');
    await project.populate('members', 'name email avatar role');

    res.status(200).json({ success: true, message: 'Member removed and tasks reassigned', data: project });
  } catch (error) {
    console.error('Error removing member:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error while removing member', error: error.message });
  }
});

/**
 * @route   GET /api/projects/:projectId/members
 * @desc    List all project members (with details)
 * @access  Private (must be project member)
 */
router.get('/:projectId/members', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('owner', 'name email avatar role');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify requesting user is a member or owner
    if (!project.hasAccess(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this project' });
    }

    // Collect member IDs (include owner separately if not present)
    const memberIds = project.members.map(m => m.toString());
    if (!memberIds.includes(project.owner._id.toString())) {
      memberIds.unshift(project.owner._id.toString());
    }

    const members = await User.find({ _id: { $in: memberIds } }).select('name email avatar role');

    // Map to include projectRole (owner/member) and profilePicture alias
    const membersMapped = members.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      projectRole: project.owner._id.toString() === u._id.toString() ? 'owner' : 'member',
      profilePicture: u.avatar
    }));

    res.status(200).json({ success: true, data: membersMapped, count: membersMapped.length });
  } catch (error) {
    console.error('Error fetching project members:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error while fetching project members', error: error.message });
  }
});

/**
 * @route   GET /api/projects/search/:query
 * @desc    Search projects by name, description or tags
 * @access  Private
 */
router.get('/search/:query', async (req, res) => {
  try {
    const searchText = req.params.query;
    const projects = await Project.searchProjects(searchText, req.user._id);

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Error searching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching projects',
      error: error.message
    });
  }
});

export default router;
