// templates/frontend-templates/chat-list-template.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style.css';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chats');
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setChats(data.chats);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError(err.message || "Failed to load chats");
        setLoading(false);
      }
    };
    
    fetchChats();
  }, []);
  
  if (loading) {
    return <div className="chat-list">Loading chats...</div>;
  }
  
  if (error) {
    return <div className="chat-list">Error: {error}</div>;
  }
  
  return (
    <div className="chat-list">
      <h2>Your Chats</h2>
      
      {chats.length > 0 ? (
        <ul>
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link to={`/chat/${chat.id}`} className="chat-item">
                <div className="chat-name">{chat.name || `Chat #${chat.id}`}</div>
                <div className="chat-preview">{chat.lastMessage}</div>
                <div className="chat-time">
                  {new Date(chat.updatedAt).toLocaleTimeString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">No chats found. Start a new conversation!</div>
      )}
    </div>
  );
};

export default ChatList;