/**
 * Socket.IO Handler
 * Real-time communication for project chat and notifications
 */

import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from handshake query or auth header
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from query params or auth header
    const token = socket.handshake.query.token || socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user to socket
    socket.user = user;
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Verify user is a member of the project
 */
const verifyProjectMember = async (userId, projectId) => {
  try {
    const project = await Project.findById(projectId);
    
    if (!project) {
      return { isValid: false, error: 'Project not found' };
    }
    
    // Check if user is owner or member
    const isOwner = project.owner.toString() === userId.toString();
    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    
    if (!isOwner && !isMember) {
      return { isValid: false, error: 'Not a project member' };
    }
    
    return { isValid: true, project };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

/**
 * Main Socket.IO Handler
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const socketHandler = (io) => {
  // Apply authentication middleware
  io.use(socketAuthMiddleware);
  
  // Track online users per project
  const onlineUsers = new Map(); // projectId -> Set of userIds
  const userSockets = new Map(); // userId -> Set of socket.ids
  const typingUsers = new Map(); // projectId -> Set of userIds
  
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userName = socket.user.name;
    
    console.log(`✅ User connected: ${userName} (${userId}) - Socket: ${socket.id}`);
    
    // Track user's socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    
    /**
     * Event: join-project
     * User joins a project room for real-time updates
     */
    socket.on('join-project', async (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) {
          socket.emit('error', { message: 'Project ID is required' });
          return;
        }
        
        // Verify user is project member
        const { isValid, error, project } = await verifyProjectMember(userId, projectId);
        
        if (!isValid) {
          socket.emit('error', { message: error });
          return;
        }
        
        // Join the project room
        const roomName = `project-${projectId}`;
        socket.join(roomName);
        socket.currentProject = projectId;
        
        // Track online user
        if (!onlineUsers.has(projectId)) {
          onlineUsers.set(projectId, new Set());
        }
        onlineUsers.get(projectId).add(userId);
        
        console.log(`📥 ${userName} joined project: ${project.name} (${roomName})`);
        
        // Get or create chat for this project
        const chat = await Chat.getOrCreateForProject(projectId);
        
        // Add user as participant if not already
        if (!chat.isParticipant(userId)) {
          await chat.addParticipant(userId);
        }
        
        // Notify others in the room
        socket.to(roomName).emit('user-joined', {
          userId,
          userName,
          timestamp: new Date()
        });
        
        // Send confirmation with online users
        const onlineUserIds = Array.from(onlineUsers.get(projectId) || []);
        socket.emit('joined-project', {
          projectId,
          projectName: project.name,
          onlineUsers: onlineUserIds,
          timestamp: new Date()
        });
        
        // Broadcast updated online users list
        io.to(roomName).emit('online-users', {
          projectId,
          users: onlineUserIds
        });
        
      } catch (error) {
        console.error('Error joining project:', error);
        socket.emit('error', { message: 'Failed to join project', error: error.message });
      }
    });
    
    /**
     * Event: leave-project
     * User leaves a project room
     */
    socket.on('leave-project', async (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) {
          socket.emit('error', { message: 'Project ID is required' });
          return;
        }
        
        const roomName = `project-${projectId}`;
        socket.leave(roomName);
        
        // Remove from online users
        if (onlineUsers.has(projectId)) {
          onlineUsers.get(projectId).delete(userId);
          
          // Clean up empty sets
          if (onlineUsers.get(projectId).size === 0) {
            onlineUsers.delete(projectId);
          }
        }
        
        // Remove from typing users
        if (typingUsers.has(projectId)) {
          typingUsers.get(projectId).delete(userId);
        }
        
        socket.currentProject = null;
        
        console.log(`📤 ${userName} left project room: ${roomName}`);
        
        // Notify others
        socket.to(roomName).emit('user-left', {
          userId,
          userName,
          timestamp: new Date()
        });
        
        // Broadcast updated online users list
        const onlineUserIds = Array.from(onlineUsers.get(projectId) || []);
        io.to(roomName).emit('online-users', {
          projectId,
          users: onlineUserIds
        });
        
        socket.emit('left-project', { projectId });
        
      } catch (error) {
        console.error('Error leaving project:', error);
        socket.emit('error', { message: 'Failed to leave project', error: error.message });
      }
    });
    
    /**
     * Event: send-message
     * User sends a message to the project chat
     */
    socket.on('send-message', async (data) => {
      try {
        const { projectId, text, attachments, replyTo } = data;
        
        if (!projectId) {
          socket.emit('error', { message: 'Project ID is required' });
          return;
        }
        
        if (!text && (!attachments || attachments.length === 0)) {
          socket.emit('error', { message: 'Message must have text or attachments' });
          return;
        }
        
        // Verify user is project member
        const { isValid, error } = await verifyProjectMember(userId, projectId);
        
        if (!isValid) {
          socket.emit('error', { message: error });
          return;
        }
        
        // Get or create chat
        const chat = await Chat.getOrCreateForProject(projectId);
        
        // Create message in database
        const message = await Message.create({
          chat: chat._id,
          sender: userId,
          text: text || '',
          attachments: attachments || [],
          replyTo: replyTo || null
        });
        
        // Populate sender details
        await message.populate('sender', 'name email profilePicture role');
        
        // Populate reply details if exists
        if (replyTo) {
          await message.populate('replyTo', 'text sender');
        }
        
        // Update chat's last message
        await chat.updateLastMessage(message._id);
        
        // Stop typing indicator for this user
        if (typingUsers.has(projectId)) {
          typingUsers.get(projectId).delete(userId);
        }
        
        const roomName = `project-${projectId}`;
        
        console.log(`💬 Message from ${userName} in project ${projectId}: "${text?.substring(0, 50)}..."`);
        
        // Broadcast message to all users in the room (including sender)
        io.to(roomName).emit('new-message', {
          message: message.toObject(),
          projectId,
          timestamp: new Date()
        });
        
        // Also broadcast stop-typing for this user
        io.to(roomName).emit('user-stopped-typing', {
          userId,
          userName,
          projectId
        });
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });
    
    /**
     * Event: edit-message
     * User edits their own message
     */
    socket.on('edit-message', async (data) => {
      try {
        const { messageId, text, projectId } = data;
        
        if (!messageId || !text) {
          socket.emit('error', { message: 'Message ID and text are required' });
          return;
        }
        
        // Find message
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        // Verify sender
        if (message.sender.toString() !== userId) {
          socket.emit('error', { message: 'Not authorized to edit this message' });
          return;
        }
        
        // Edit message
        await message.editMessage(text);
        await message.populate('sender', 'name email profilePicture role');
        
        const roomName = `project-${projectId}`;
        
        console.log(`✏️ ${userName} edited message ${messageId}`);
        
        // Broadcast edited message
        io.to(roomName).emit('message-edited', {
          message: message.toObject(),
          projectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message', error: error.message });
      }
    });
    
    /**
     * Event: delete-message
     * User deletes their own message
     */
    socket.on('delete-message', async (data) => {
      try {
        const { messageId, projectId } = data;
        
        if (!messageId) {
          socket.emit('error', { message: 'Message ID is required' });
          return;
        }
        
        // Find message
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        // Verify sender
        if (message.sender.toString() !== userId) {
          socket.emit('error', { message: 'Not authorized to delete this message' });
          return;
        }
        
        // Soft delete message
        await message.softDelete(userId);
        
        // Decrement chat message count
        const chat = await Chat.findById(message.chat);
        if (chat) {
          await chat.decrementMessageCount();
        }
        
        const roomName = `project-${projectId}`;
        
        console.log(`🗑️ ${userName} deleted message ${messageId}`);
        
        // Broadcast deletion
        io.to(roomName).emit('message-deleted', {
          messageId,
          projectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message', error: error.message });
      }
    });
    
    /**
     * Event: add-reaction
     * User adds/removes reaction to a message
     */
    socket.on('add-reaction', async (data) => {
      try {
        const { messageId, emoji, projectId } = data;
        
        if (!messageId || !emoji) {
          socket.emit('error', { message: 'Message ID and emoji are required' });
          return;
        }
        
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        // Add/toggle reaction
        await message.addReaction(userId, emoji);
        
        const roomName = `project-${projectId}`;
        
        console.log(`👍 ${userName} reacted ${emoji} to message ${messageId}`);
        
        // Broadcast reaction
        io.to(roomName).emit('reaction-added', {
          messageId,
          userId,
          userName,
          emoji,
          projectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction', error: error.message });
      }
    });
    
    /**
     * Event: typing
     * User is typing in the chat
     */
    socket.on('typing', async (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) {
          return;
        }
        
        // Verify user is project member
        const { isValid } = await verifyProjectMember(userId, projectId);
        
        if (!isValid) {
          return;
        }
        
        // Track typing user
        if (!typingUsers.has(projectId)) {
          typingUsers.set(projectId, new Set());
        }
        typingUsers.get(projectId).add(userId);
        
        const roomName = `project-${projectId}`;
        
        // Broadcast to others in room (not to sender)
        socket.to(roomName).emit('user-typing', {
          userId,
          userName,
          projectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error handling typing event:', error);
      }
    });
    
    /**
     * Event: stop-typing
     * User stopped typing
     */
    socket.on('stop-typing', async (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) {
          return;
        }
        
        // Remove from typing users
        if (typingUsers.has(projectId)) {
          typingUsers.get(projectId).delete(userId);
        }
        
        const roomName = `project-${projectId}`;
        
        // Broadcast to others in room
        socket.to(roomName).emit('user-stopped-typing', {
          userId,
          userName,
          projectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error handling stop-typing event:', error);
      }
    });
    
    /**
     * Event: mark-messages-read
     * User marks all messages in a chat as read
     */
    socket.on('mark-messages-read', async (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) {
          socket.emit('error', { message: 'Project ID is required' });
          return;
        }
        
        const chat = await Chat.findOne({ project: projectId });
        
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        // Mark all messages as read
        await Message.markAllAsRead(chat._id, userId);
        
        // Update participant's last read timestamp
        await chat.updateLastRead(userId);
        
        console.log(`✓ ${userName} marked all messages as read in project ${projectId}`);
        
        socket.emit('messages-marked-read', {
          projectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read', error: error.message });
      }
    });
    
    /**
     * Event: get-online-users
     * Get list of online users in a project
     */
    socket.on('get-online-users', (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) {
          socket.emit('error', { message: 'Project ID is required' });
          return;
        }
        
        const onlineUserIds = Array.from(onlineUsers.get(projectId) || []);
        
        socket.emit('online-users', {
          projectId,
          users: onlineUserIds
        });
        
      } catch (error) {
        console.error('Error getting online users:', error);
        socket.emit('error', { message: 'Failed to get online users', error: error.message });
      }
    });
    
    /**
     * Event: disconnect
     * User disconnects from socket
     */
    socket.on('disconnect', (reason) => {
      try {
        console.log(`❌ User disconnected: ${userName} (${userId}) - Reason: ${reason}`);
        
        // Remove socket from user's sockets
        if (userSockets.has(userId)) {
          userSockets.get(userId).delete(socket.id);
          
          // If user has no more active sockets, remove from all online lists
          if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
            
            // Remove from all projects' online users
            const projectId = socket.currentProject;
            if (projectId) {
              const roomName = `project-${projectId}`;
              
              // Remove from online users
              if (onlineUsers.has(projectId)) {
                onlineUsers.get(projectId).delete(userId);
              }
              
              // Remove from typing users
              if (typingUsers.has(projectId)) {
                typingUsers.get(projectId).delete(userId);
              }
              
              // Notify others
              io.to(roomName).emit('user-left', {
                userId,
                userName,
                timestamp: new Date()
              });
              
              // Broadcast updated online users
              const onlineUserIds = Array.from(onlineUsers.get(projectId) || []);
              io.to(roomName).emit('online-users', {
                projectId,
                users: onlineUserIds
              });
            }
          }
        }
        
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
    
    /**
     * Event: error
     * Handle socket errors
     */
    socket.on('error', (error) => {
      console.error(`⚠️ Socket error for ${userName}:`, error);
    });
  });
  
  // Global error handler
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });
  
  console.log('🔌 Socket.IO handler initialized');
};

export default socketHandler;
