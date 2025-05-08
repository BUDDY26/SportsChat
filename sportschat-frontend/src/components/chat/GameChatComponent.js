import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../../services/api';

const GameChatComponent = ({ user, gameId }) => {
  const chatContainerRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch chat messages for the game
  const fetchMessages = useCallback(async () => {
    if (!gameId || isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      const timestamp = new Date().getTime();
      const response = await API.get(`/api/games/${gameId}/chat?_t=${timestamp}`);
      
      if (Array.isArray(response.data)) {
        setMessages(response.data);
        setError(null);
      } else {
        console.error('API returned non-array data:', response.data);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error("Error fetching game chat messages:", err);
      setError('Failed to load messages. Please try again.');
      
      // Only use mock data if we don't have any messages yet
      if (messages.length === 0) {
        setMessages([
          { id: 1, user: "BasketballFan22", message: "Can't wait for this game!", timestamp: "2 hours ago" },
          { id: 2, user: "HoopsDreams", message: "Should be a good match-up.", timestamp: "1 hour ago" },
          { id: 3, user: "MarchMadnessFan", message: "What's everyone's prediction?", timestamp: "45 minutes ago" }
        ]);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [gameId, isRefreshing, messages.length]);

  // Auto-refresh when game ID changes
  useEffect(() => {
    if (gameId) {
      fetchMessages();
      
      // Optionally, you could set up a refresh interval here
      // const refreshInterval = setInterval(fetchMessages, 10000);
      // return () => clearInterval(refreshInterval);
    }
  }, [gameId, fetchMessages]);

  // Auto-scroll effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !gameId) return;

    // Create temporary message with pending state
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      user: user?.username || "You",
      message: message,
      timestamp: "Just now",
      pending: true
    };
    
    // Add to UI immediately
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Store the message content and clear input
    const messageContent = message;
    setMessage("");
    
    try {
      // Send to server
      const response = await API.post(`/api/games/${gameId}/chat`, { message: messageContent });
      
      // Replace temporary message with server response
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId ? {...response.data, pending: false} : msg
        )
      );
    } catch (err) {
      console.error("Error sending game chat message:", err);
      
      // Mark message as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId ? {...msg, pending: false, failed: true} : msg
        )
      );
    }
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

  return (
    <div className="game-chat-container">
      <div className="chat-header">
        <h3>Game Chat</h3>
        {error && <div className="error-message">{error}</div>}
      </div>
      
      <div className="chat-messages" ref={chatContainerRef}>
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
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={message.trim() === '' || !gameId}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default GameChatComponent;