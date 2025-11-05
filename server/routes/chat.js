/**
 * Chat Routes
 * API endpoints for project chat and messaging
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';

const router = express.Router();

/**
 * @route   GET /api/chat/projects/:projectId
 * @desc    Get chat messages for a project with pagination
 * @access  Private (Project members only)
 */
router.get('/projects/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Validate projectId
    if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Verify user is project owner or member
    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    // Get or create chat for this project
    const chat = await Chat.getOrCreateForProject(projectId);

    // Fetch messages with pagination using the Message model static method
    const result = await Message.getMessagesPaginated(
      chat._id,
      page,
      limit,
      false // Don't include deleted messages
    );

    // Format response
    const formattedMessages = result.messages.map(message => ({
      _id: message._id,
      sender: {
        id: message.sender._id,
        name: message.sender.name,
        email: message.sender.email,
        profilePicture: message.sender.profilePicture || null
      },
      text: message.text,
      timestamp: message.createdAt,
      attachments: message.attachments || [],
      edited: message.edited || false,
      editedAt: message.editedAt || null,
      reactions: message.reactions || [],
      replyTo: message.replyTo || null,
      readBy: message.readBy || []
    }));

    res.status(200).json({
      success: true,
      messages: formattedMessages,
      pagination: {
        total: result.pagination.totalMessages,
        page: result.pagination.currentPage,
        pages: result.pagination.totalPages,
        limit: limit,
        hasNextPage: result.pagination.hasNextPage,
        hasPrevPage: result.pagination.hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat messages',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/chat/projects/:projectId/messages
 * @desc    Send a new message in project chat
 * @access  Private (Project members only)
 */
router.post('/projects/:projectId/messages', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { text, attachments, replyTo } = req.body;

    // Validate input
    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message must have text or attachments'
      });
    }

    // Check project membership
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    // Get or create chat
    const chat = await Chat.getOrCreateForProject(projectId);

    // Add user as participant if not already
    if (!chat.isParticipant(req.user.id)) {
      await chat.addParticipant(req.user.id);
    }

    // Create message
    const message = await Message.create({
      chat: chat._id,
      sender: req.user.id,
      text: text || '',
      attachments: attachments || [],
      replyTo: replyTo || null
    });

    // Update chat's last message
    await chat.updateLastMessage(message._id);

    // Populate sender details
    await message.populate('sender', 'name email profilePicture role');

    // If replying, populate reply details
    if (replyTo) {
      await message.populate('replyTo', 'text sender');
    }

    // Emit Socket.IO event (if io is available)
    const io = req.app.get('io');
    if (io) {
      io.to(`project-${projectId}`).emit('new-message', {
        message: message.toObject(),
        projectId,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: message,
      chatId: chat._id
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/chat/messages/:messageId
 * @desc    Edit a message (sender only)
 * @access  Private
 */
router.put('/messages/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Edit message
    await message.editMessage(text);
    await message.populate('sender', 'name email profilePicture');

    // Get chat to find projectId for Socket.IO
    const chat = await Chat.findById(message.chat).populate('project');
    
    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io && chat) {
      io.to(`project-${chat.project._id}`).emit('message-edited', {
        message: message.toObject(),
        projectId: chat.project._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/chat/messages/:messageId
 * @desc    Delete a message (sender only)
 * @access  Private
 */
router.delete('/messages/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Soft delete message
    await message.softDelete(req.user.id);

    // Decrement chat message count
    const chat = await Chat.findById(message.chat).populate('project');
    if (chat) {
      await chat.decrementMessageCount();
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io && chat) {
      io.to(`project-${chat.project._id}`).emit('message-deleted', {
        messageId: message._id,
        projectId: chat.project._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/chat/messages/:messageId/reactions
 * @desc    Add or remove a reaction to a message
 * @access  Private
 */
router.post('/messages/:messageId/reactions', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Add/toggle reaction
    await message.addReaction(req.user.id, emoji);

    // Get chat for Socket.IO
    const chat = await Chat.findById(message.chat).populate('project');

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io && chat) {
      io.to(`project-${chat.project._id}`).emit('reaction-added', {
        messageId: message._id,
        userId: req.user.id,
        userName: req.user.name,
        emoji,
        projectId: chat.project._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      reactions: message.reactions
    });

  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chat/projects/:projectId/unread
 * @desc    Get unread message count for a project
 * @access  Private
 */
router.get('/projects/:projectId/unread', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    const chat = await Chat.findOne({ project: projectId });

    if (!chat) {
      return res.status(200).json({
        success: true,
        unreadCount: 0
      });
    }

    const unreadCount = await chat.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/chat/projects/:projectId/read
 * @desc    Mark all messages as read in a project
 * @access  Private
 */
router.post('/projects/:projectId/read', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    const chat = await Chat.findOne({ project: projectId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Mark all messages as read
    await Message.markAllAsRead(chat._id, req.user.id);

    // Update participant's last read timestamp
    await chat.updateLastRead(req.user.id);

    res.status(200).json({
      success: true,
      message: 'All messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chat/projects/:projectId/info
 * @desc    Get chat information for a project
 * @access  Private
 */
router.get('/projects/:projectId/info', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    const chat = await Chat.getChatWithDetails(projectId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.status(200).json({
      success: true,
      chat: {
        _id: chat._id,
        projectId: chat.project._id,
        projectName: chat.project.name,
        participants: chat.participants,
        messageCount: chat.messageCount,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        settings: chat.settings
      }
    });

  } catch (error) {
    console.error('Error getting chat info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat information',
      error: error.message
    });
  }
});

export default router;
