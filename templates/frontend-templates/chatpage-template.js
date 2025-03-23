// templates/frontend-templates/chat-page-template.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './style.css';

const ChatPage = () => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}`);
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setMessages(data.messages);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err.message || "Failed to load messages");
        setLoading(false);
      }
    };
    
    fetchMessages();
    // Set up periodic refresh or websocket connection here
  }, [chatId]);
  
  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId: 1, // Replace with actual user ID from auth
          content: newMessage
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Add the new message to the UI
      setMessages([
        ...messages,
        {
          id: Date.now(), // Temporary ID until refresh
          chatId,
          senderId: 1, // Replace with actual user ID
          content: newMessage,
          createdAt: new Date().toISOString()
        }
      ]);
      
      // Clear the input
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + err.message);
    }
  };
  
  // Render loading state
  if (loading) {
    return <div className="chat-container">Loading messages...</div>;
  }
  
  // Render error state
  if (error) {
    return <div className="chat-container">Error: {error}</div>;
  }
  
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.senderId === 1 ? 'sent' : 'received'}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-time">
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-chat">No messages yet. Start the conversation!</div>
        )}
      </div>
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatPage;