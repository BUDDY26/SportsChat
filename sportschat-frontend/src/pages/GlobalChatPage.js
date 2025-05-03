import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './style.css';

const GlobalChatPage = () => {
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  
  // User state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData.user || userData);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.removeItem("user");
      navigate("/login");
    }
    
    setIsLoading(false);
  }, [navigate]);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await API.get(`/api/chat/global?_t=${timestamp}`);
      
      if (Array.isArray(response.data)) {
        setMessages(response.data);
        setLastRefreshTime(new Date());
        setError(null);
      } else {
        console.error('API returned non-array data:', response.data);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err);
      setError('Failed to load messages. Please try again.');
      
      // Only use mock data if we don't have any messages yet
      if (messages.length === 0) {
        setMessages([
          { id: 1, user: "SportsFan123", message: "Welcome to the global chat!", timestamp: "1 hour ago" },
          { id: 2, user: "BasketballExpert", message: "Who do you think will win the championship?", timestamp: "45 minutes ago" },
          { id: 3, user: "MarchMadnessFan", message: "My bracket is already busted!", timestamp: "30 minutes ago" }
        ]);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, messages.length]);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await API.get('/api/chat/online-users');
      setOnlineUsers(response.data);
    } catch (err) {
      console.error("Error fetching online users:", err);
      // Fallback mock data
      setOnlineUsers([
        { id: 1, username: "SportsFan123", status: "active" },
        { id: 2, username: "BasketballExpert", status: "active" },
        { id: 3, username: "MarchMadnessFan", status: "away" }
      ]);
    }
  }, []);

  // Initial load of messages and users
  useEffect(() => {
    if (!isLoading) {
      fetchMessages();
      fetchOnlineUsers();
    }
  }, [isLoading, fetchMessages, fetchOnlineUsers]);

  // Set up auto-refresh for messages
  useEffect(() => {
    let messageRefreshInterval;
    let userRefreshInterval;
    
    if (!isLoading) {
      // Refresh messages every 10 seconds
      messageRefreshInterval = setInterval(() => {
        fetchMessages();
      }, 10000);
      
      // Refresh online users every 30 seconds
      userRefreshInterval = setInterval(() => {
        fetchOnlineUsers();
      }, 30000);
    }
    
    return () => {
      if (messageRefreshInterval) clearInterval(messageRefreshInterval);
      if (userRefreshInterval) clearInterval(userRefreshInterval);
    };
  }, [isLoading, fetchMessages, fetchOnlineUsers]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Create temporary message with pending state
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      user: user?.username || "You",
      message: message,
      timestamp: "Just now",
      pending: true
    };
    
    // Add to UI immediately (optimistic update)
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Store the message content and clear input
    const messageContent = message;
    setMessage("");
    
    try {
      // Send to server
      const response = await API.post('/api/chat/global', { message: messageContent });
      
      // Replace temporary message with server response
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId ? {...response.data, pending: false} : msg
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);
      
      // Mark message as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId ? {...msg, pending: false, failed: true} : msg
        )
      );
    }
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchMessages();
    fetchOnlineUsers();
  };

  // Handle retrying a failed message
  const handleRetryMessage = async (failedMsg) => {
    // Remove the failed message
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== failedMsg.id)
    );
    
    // Set the message content back in the input
    setMessage(failedMsg.message);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await API.post('/logout');
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="global-chat-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-container">
          <h1>SportsChat+</h1>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate('/dashboard')} className="nav-button">
            Dashboard
          </button>
          <button className="nav-button active">
            Global Chat
          </button>
        </div>
        <div className="user-controls">
          <span className="username">Welcome, {user?.username || "User"}</span>
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="chat-container">
        <div className="chat-main">
          <div className="chat-header">
            <h2>Global Chat</h2>
            <div className="chat-controls">
              <button 
                className="refresh-button" 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              {lastRefreshTime && (
                <span className="last-updated">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <div className="messages-container" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <div className="empty-chat">No messages yet. Be the first to chat!</div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${msg.pending ? 'message-pending' : ''} ${msg.failed ? 'message-failed' : ''}`}
                >
                  <div className="message-header">
                    <span className="message-user">{msg.user}</span>
                    <span className="message-time">
                      {msg.pending ? 'Sending...' : msg.failed ? 'Failed to send' : msg.timestamp}
                      {msg.failed && (
                        <button 
                          className="retry-button"
                          onClick={() => handleRetryMessage(msg)}
                        >
                          Retry
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))
            )}
          </div>
          
          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" disabled={message.trim() === ''}>Send</button>
          </form>
        </div>
        
        <div className="users-sidebar">
          <h3>Online Users ({onlineUsers.length})</h3>
          <div className="users-list">
            {onlineUsers.map((user, index) => (
              <div key={index} className={`user-item ${user.status}`}>
                <span className="user-status-indicator"></span>
                <span className="user-name">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalChatPage;