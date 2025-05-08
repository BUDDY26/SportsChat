import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { checkAuthAndGetUser } from '../helpers/authHelper';
import './style.css';

const GlobalChatPage = ({ socket }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Check auth and get user
  useEffect(() => {
    const authCheck = async () => {
      const userData = await checkAuthAndGetUser();
      if (!userData) {
        navigate('/login');
        return;
      }
      setUser(userData);
      setLoading(false);
    };
    
    authCheck();
  }, [navigate]);
  
  // Fetch message history when component mounts
  useEffect(() => {
    if (loading) return;
    
    const fetchMessages = async () => {
      try {
        const response = await API.get('/api/chat/global');
        setMessages(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
        setError('Failed to load chat history. Please try again.');
      }
    };

    fetchMessages();
  }, [loading]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket || loading) return;

    // Join global chat room
    socket.emit('joinGlobalChat');

    // Listen for new messages
    socket.on('newGlobalMessage', (newMessage) => {
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    // Clean up on unmount
    return () => {
      socket.off('newGlobalMessage');
    };
  }, [socket, loading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !user) return;

    const tempId = Date.now();
    
    // Add optimistic message
    const tempMessage = {
      id: `temp-${tempId}`,
      user: user.username,
      userId: user.id,
      message: message,
      timestamp: 'Just now',
      pending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Send via socket
    socket.emit('globalChatMessage', {
      tempId,
      text: message
    });
    
    // Clear input
    setMessage('');
  }, [message, socket, user]);

  // Handle message sending via API as fallback
  const handleSendMessageViaAPI = useCallback(async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    
    try {
      const response = await API.post('/api/chat/global', { message });
      setMessages(prev => [...prev, response.data]);
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  }, [message, user]);

  // Handle confirmation or error
  useEffect(() => {
    if (!socket) return;
    
    socket.on('messageSent', (data) => {
      // Update message status from pending to confirmed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === `temp-${data.tempId}` 
            ? { ...msg, id: data.messageId, pending: false } 
            : msg
        )
      );
    });
    
    socket.on('messageError', (data) => {
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === `temp-${data.tempId}` 
            ? { ...msg, error: data.error, pending: false } 
            : msg
        )
      );
    });
    
    return () => {
      socket.off('messageSent');
      socket.off('messageError');
    };
  }, [socket]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="chat-container">
      <h2>Global Chat</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id || index} 
              className={`message ${msg.pending ? 'pending' : ''} ${msg.error ? 'error' : ''}`}
            >
              <div className="message-header">
                <span className="username">{msg.user}</span>
                <span className="timestamp">{msg.timestamp}</span>
              </div>
              <div className="message-content">{msg.message}</div>
              {msg.error && <div className="error-text">Error: {msg.error}</div>}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={socket ? handleSendMessage : handleSendMessageViaAPI} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit" disabled={!message.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default GlobalChatPage;