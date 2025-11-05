/**
 * useSocket Hook
 * Custom React hook for Socket.IO connection management
 * Handles connection, room management, messages, and typing indicators
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * Custom hook for Socket.IO connection management
 * @param {string} projectId - The project ID to join
 * @returns {Object} Socket utilities and state
 */
const useSocket = (projectId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Create socket connection
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Join project room if projectId is provided
      if (projectId) {
        socket.emit('join-project', { projectId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      // Attempt manual reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server forcibly disconnected, try to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
            socket.connect();
          }, 2000 * reconnectAttemptsRef.current);
        }
      }
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      setIsConnected(false);
      setError(`Connection error: ${err.message}`);
    });

    socket.on('error', (err) => {
      console.error('⚠️ Socket error:', err);
      setError(err.message || 'An error occurred');
    });

    // Room event handlers
    socket.on('joined-project', (data) => {
      console.log('📥 Joined project:', data.projectName);
      setOnlineUsers(data.onlineUsers || []);
    });

    socket.on('user-joined', (data) => {
      console.log(`👋 ${data.userName} joined`);
      // Optionally show a toast notification
    });

    socket.on('user-left', (data) => {
      console.log(`👋 ${data.userName} left`);
    });

    socket.on('online-users', (data) => {
      setOnlineUsers(data.users || []);
    });

    // Message event handlers
    socket.on('new-message', (data) => {
      if (data.projectId === projectId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    socket.on('message-edited', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.message._id ? data.message : msg
        )
      );
    });

    socket.on('message-deleted', (data) => {
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== data.messageId)
      );
    });

    socket.on('reaction-added', (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === data.messageId) {
            const reactions = msg.reactions || [];
            const existingReactionIndex = reactions.findIndex(
              (r) => r.user === data.userId
            );

            if (existingReactionIndex !== -1) {
              // Remove reaction if it exists (toggle)
              return {
                ...msg,
                reactions: reactions.filter((r) => r.user !== data.userId),
              };
            } else {
              // Add new reaction
              return {
                ...msg,
                reactions: [
                  ...reactions,
                  {
                    user: data.userId,
                    emoji: data.emoji,
                  },
                ],
              };
            }
          }
          return msg;
        })
      );
    });

    // Typing event handlers
    socket.on('user-typing', (data) => {
      setTypingUsers((prev) => new Set(prev).add(data.userName));
    });

    socket.on('user-stopped-typing', (data) => {
      setTypingUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userName);
        return updated;
      });
    });

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (projectId && socket.connected) {
        socket.emit('leave-project', { projectId });
      }

      // Remove all listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('joined-project');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('online-users');
      socket.off('new-message');
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.off('reaction-added');
      socket.off('user-typing');
      socket.off('user-stopped-typing');

      socket.disconnect();
    };
  }, [projectId]);

  // Add a message to the local state (used when sending)
  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Send a message via socket
  const sendMessage = useCallback(
    (text, attachments = [], replyTo = null) => {
      if (!socketRef.current || !socketRef.current.connected) {
        console.error('Socket not connected');
        setError('Cannot send message: not connected');
        return false;
      }

      if (!projectId) {
        console.error('No project ID provided');
        setError('Cannot send message: no project ID');
        return false;
      }

      socketRef.current.emit('send-message', {
        projectId,
        text,
        attachments,
        replyTo,
      });

      return true;
    },
    [projectId]
  );

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected || !projectId) {
      return;
    }

    socketRef.current.emit('typing', { projectId });
  }, [projectId]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected || !projectId) {
      return;
    }

    socketRef.current.emit('stop-typing', { projectId });
  }, [projectId]);

  // Edit a message
  const editMessage = useCallback(
    (messageId, newText) => {
      if (!socketRef.current || !socketRef.current.connected) {
        setError('Cannot edit message: not connected');
        return false;
      }

      socketRef.current.emit('edit-message', {
        messageId,
        text: newText,
      });

      return true;
    },
    []
  );

  // Delete a message
  const deleteMessage = useCallback((messageId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Cannot delete message: not connected');
      return false;
    }

    socketRef.current.emit('delete-message', { messageId });

    return true;
  }, []);

  // Add a reaction to a message
  const addReaction = useCallback((messageId, emoji) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Cannot add reaction: not connected');
      return false;
    }

    socketRef.current.emit('add-reaction', { messageId, emoji });

    return true;
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected || !projectId) {
      return;
    }

    socketRef.current.emit('mark-messages-read', { projectId });
  }, [projectId]);

  // Get online users
  const refreshOnlineUsers = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected || !projectId) {
      return;
    }

    socketRef.current.emit('get-online-users', { projectId });
  }, [projectId]);

  // Clear messages (used when switching projects)
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  return {
    // State
    socket: socketRef.current,
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    error,

    // Message actions
    addMessage,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    markAsRead,

    // Typing actions
    sendTyping,
    stopTyping,

    // Utility actions
    clearMessages,
    clearError,
    reconnect,
    refreshOnlineUsers,
  };
};

export default useSocket;
