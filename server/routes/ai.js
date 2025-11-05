/**
 * AI Routes
 * Endpoints for AI-powered project insights using Google Gemini
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

const router = express.Router();

/**
 * @route   POST /api/ai/analyze-chat/:projectId
 * @desc    Analyze project chat messages for insights
 * @access  Private (Project Members Only)
 */
router.post('/analyze-chat/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify project exists and user is a member
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is owner or member
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(
      m => m.user.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Get or create chat for project
    const chat = await Chat.getOrCreateForProject(projectId);

    // Fetch last 50 messages
    const messages = await Message.find({ chat: chat._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name email profilePicture')
      .lean();

    if (messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No messages found to analyze. Start chatting first!'
      });
    }

    // Reverse to chronological order for AI analysis
    messages.reverse();

    // Call AI service with project type
    const projectType = project.tags?.[0] || project.category || 'general';
    const analysis = await aiService.analyzeChatMessages(messages, projectType);

    // Format response
    const formattedAnalysis = {
      keyTopics: analysis.topics || [],
      actionItems: analysis.actionItems || [],
      nextSteps: analysis.nextSteps || [],
      blockers: analysis.blockers || [],
      decisions: analysis.decisions || [],
      messageCount: messages.length,
      projectName: project.name,
      projectType: projectType,
      timestamp: new Date().toISOString()
    };

    // Log API usage
    console.log(`📊 AI Chat Analysis - Project: ${project.name}, Messages: ${messages.length}`);

    res.status(200).json({
      success: true,
      analysis: formattedAnalysis
    });

  } catch (error) {
    console.error('❌ Error analyzing chat:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze chat messages'
    });
  }
});

/**
 * @route   POST /api/ai/suggest-deadline/:taskId
 * @desc    Suggest realistic deadline for a task using AI
 * @access  Private (Project Members Only)
 */
router.post('/suggest-deadline/:taskId', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Find task and populate project
    const task = await Task.findById(taskId).populate('project');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const project = task.project;

    // Verify user is project member
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(
      m => m.user.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Get recent chat history for context
    const chat = await Chat.getOrCreateForProject(project._id);
    const chatHistory = await Message.find({ chat: chat._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'name')
      .lean();

    chatHistory.reverse();

    // Prepare task data
    const taskData = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo,
      currentWorkload: req.body.currentWorkload || 'Unknown'
    };

    // Call AI service
    const suggestion = await aiService.generateDeadlineSuggestion(
      taskData,
      chatHistory
    );

    console.log(`📅 AI Deadline Suggestion - Task: ${task.title}`);

    res.status(200).json({
      success: true,
      suggestion: {
        ...suggestion,
        taskId: task._id,
        taskTitle: task.title,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error suggesting deadline:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate deadline suggestion'
    });
  }
});

/**
 * @route   POST /api/ai/analyze-participation/:projectId
 * @desc    Analyze team member participation in project chat
 * @access  Private (Project Owner Only)
 */
router.post('/analyze-participation/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify project exists
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Only project owner can analyze participation
    if (project.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only project owner can analyze participation.'
      });
    }

    // Get chat messages
    const chat = await Chat.getOrCreateForProject(projectId);
    const messages = await Message.find({ chat: chat._id })
      .populate('sender', 'name email profilePicture')
      .lean();

    if (messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No messages found to analyze'
      });
    }

    // Call AI service
    const analytics = await aiService.analyzeMemberParticipation(messages);

    console.log(`👥 AI Participation Analysis - Project: ${project.name}, Messages: ${messages.length}`);

    res.status(200).json({
      success: true,
      analytics: {
        ...analytics,
        projectName: project.name,
        totalMessages: messages.length,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing participation:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze member participation'
    });
  }
});

/**
 * @route   POST /api/ai/generate-summary/:projectId
 * @desc    Generate comprehensive project summary using AI
 * @access  Private (Project Members)
 */
router.post('/generate-summary/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify project exists and user is member
    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check membership
    const isOwner = project.owner._id.toString() === userId;
    const isMember = project.members.some(
      m => m.user._id.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Get chat messages
    const chat = await Chat.getOrCreateForProject(projectId);
    const messages = await Message.find({ chat: chat._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'name')
      .lean();

    messages.reverse();

    // Prepare project data
    const projectData = {
      _id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      deadline: project.deadline,
      owner: project.owner,
      memberCount: project.members.length,
      members: project.members,
      taskStats: project.taskStats,
      updatedAt: project.updatedAt
    };

    // Call AI service
    const summary = await aiService.generateProjectSummary(
      projectData,
      messages
    );

    console.log(`📊 AI Project Summary - Project: ${project.name}`);

    res.status(200).json({
      success: true,
      summary: {
        ...summary,
        projectId: project._id,
        projectName: project.name
      }
    });

  } catch (error) {
    console.error('❌ Error generating summary:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate project summary'
    });
  }
});

/**
 * @route   GET /api/ai/stats
 * @desc    Get AI API usage statistics
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = aiService.getAPIStats();

    res.status(200).json({
      success: true,
      stats: {
        totalCalls: stats.totalCalls,
        totalTokens: stats.totalTokens,
        estimatedCost: `$${stats.estimatedCost.toFixed(4)}`,
        cacheHits: stats.cacheStats.hits,
        cacheMisses: stats.cacheStats.misses,
        cachedKeys: stats.cacheStats.keys
      }
    });

  } catch (error) {
    console.error('❌ Error fetching AI stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI statistics'
    });
  }
});

/**
 * @route   POST /api/ai/clear-cache
 * @desc    Clear AI response cache
 * @access  Private
 */
router.post('/clear-cache', protect, async (req, res) => {
  try {
    aiService.clearCache();

    res.status(200).json({
      success: true,
      message: 'AI cache cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

/**
 * @route   GET /api/ai/test
 * @desc    Test AI service availability
 * @access  Private
 */
router.get('/test', protect, async (req, res) => {
  try {
    const result = await aiService.testAIService();

    res.status(200).json({
      success: result.success,
      message: result.message || result.error,
      available: aiService.isAIAvailable()
    });

  } catch (error) {
    console.error('❌ Error testing AI:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI service'
    });
  }
});

export default router;
