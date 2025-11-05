/**
 * ChatWindow Component
 * Real-time chat interface with Socket.IO integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ChatWindow = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !projectId) return;

    // Import socket.io-client
    import('socket.io-client').then(({ default: io }) => {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        // Join project room
        socket.emit('join-project', { projectId });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        setError('Failed to connect to chat server');
      });

      // Room events
      socket.on('joined-project', (data) => {
        console.log('📥 Joined project:', data.projectName);
        setOnlineUsers(data.onlineUsers || []);
      });

      socket.on('user-joined', (data) => {
        console.log(`👋 ${data.userName} joined`);
      });

      socket.on('user-left', (data) => {
        console.log(`👋 ${data.userName} left`);
      });

      socket.on('online-users', (data) => {
        setOnlineUsers(data.users || []);
      });

      // Message events
      socket.on('new-message', (data) => {
        if (data.projectId === projectId) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
      });

      socket.on('message-edited', (data) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.message._id ? data.message : msg
          )
        );
      });

      socket.on('message-deleted', (data) => {
        setMessages(prev => 
          prev.filter(msg => msg._id !== data.messageId)
        );
      });

      socket.on('reaction-added', (data) => {
        setMessages(prev => 
          prev.map(msg => {
            if (msg._id === data.messageId) {
              const reactions = msg.reactions || [];
              const existingReaction = reactions.find(
                r => r.user === data.userId
              );
              
              if (existingReaction) {
                return {
                  ...msg,
                  reactions: reactions.filter(r => r.user !== data.userId)
                };
              } else {
                return {
                  ...msg,
                  reactions: [...reactions, {
                    user: data.userId,
                    emoji: data.emoji
                  }]
                };
              }
            }
            return msg;
          })
        );
      });

      // Typing events
      socket.on('user-typing', (data) => {
        if (data.userId !== user.id) {
          setTypingUsers(prev => new Set(prev).add(data.userName));
        }
      });

      socket.on('user-stopped-typing', (data) => {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.userName);
          return updated;
        });
      });

      // Error events
      socket.on('error', (error) => {
        console.error('⚠️ Socket error:', error);
        setError(error.message || 'An error occurred');
      });

      // Cleanup
      return () => {
        socket.emit('leave-project', { projectId });
        socket.disconnect();
      };
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId, user?.id]);

  const fetchMessages = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await axios.get(
        `/api/chat/projects/${projectId}`,
        {
          params: { page: pageNum, limit: 50 }
        }
      );

      if (pageNum === 1) {
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages(prev => [...data.messages, ...prev]);
      }

      setHasMore(data.pagination.hasNextPage);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch initial messages
  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  // Handle scroll for infinite scroll
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && hasMore && !loading) {
      const prevHeight = container.scrollHeight;
      fetchMessages(page + 1).then(() => {
        // Maintain scroll position after loading
        setTimeout(() => {
          container.scrollTop = container.scrollHeight - prevHeight;
        }, 0);
      });
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      await axios.post(
        `/api/chat/projects/${projectId}/messages`,
        { text: newMessage.trim() }
      );

      setNewMessage('');
      
      // Stop typing indicator
      if (socketRef.current) {
        socketRef.current.emit('stop-typing', { projectId });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socketRef.current) return;

    // Send typing indicator
    socketRef.current.emit('typing', { projectId });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop-typing', { projectId });
    }, 3000);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if message is from current user
  const isOwnMessage = (message) => {
    return message.sender?.id === user?.id;
  };

  // Group consecutive messages from same sender
  const shouldShowAvatar = (message, index) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.sender?.id !== message.sender?.id;
  };

  // Character count
  const charCount = newMessage.length;
  const maxChars = 5000;

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Project Chat
          </h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {onlineUsers.length} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex-shrink-0 px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {loading && page > 1 && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start a conversation by sending a message below
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = isOwnMessage(message);
              const showAvatar = shouldShowAvatar(message, index);

              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                    !showAvatar ? 'mt-1' : 'mt-4'
                  }`}
                >
                  {/* Avatar (for others' messages) */}
                  {!isOwn && showAvatar && (
                    <div className="flex-shrink-0 mr-3">
                      {message.sender?.profilePicture ? (
                        <img
                          src={message.sender.profilePicture}
                          alt={message.sender.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          {message.sender?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  {!isOwn && !showAvatar && <div className="w-8 mr-3"></div>}

                  {/* Message bubble */}
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-md`}>
                    {/* Sender name */}
                    {!isOwn && showAvatar && (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {message.sender?.name}
                      </span>
                    )}

                    {/* Message content */}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>

                      {/* Edited indicator */}
                      {message.edited && (
                        <span className={`text-xs italic ${
                          isOwn ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {' '}(edited)
                        </span>
                      )}

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {message.reactions.map((reaction, idx) => (
                            <span
                              key={idx}
                              className="text-sm bg-white dark:bg-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {reaction.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(message.timestamp || message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex items-end space-x-2">
            {/* Text input */}
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={1}
                maxLength={maxChars}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            {/* Attach button */}
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Attach file (coming soon)"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || charCount > maxChars}
              className="flex-shrink-0 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>

          {/* Character count */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </span>
            <span className={`${
              charCount > maxChars * 0.9 
                ? 'text-red-600 dark:text-red-400 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {charCount} / {maxChars}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
