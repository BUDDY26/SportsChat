import { useState, useEffect, useCallback } from "react";
import socketService from "../services/socket.js";
import chatService from "../services/chatService.js";

export function useChat(roomName, user, options = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Load initial messages
  useEffect(() => {
    if (!roomName || !user) return;
    
    setLoading(true);
    chatService.getMessages(roomName)
      .then(data => {
        setMessages(data);
        setIsConnected(true);
        setError(null);
      })
      .catch(err => {
        console.error("Error loading messages:", err);
        setError("Failed to load chat history");
      })
      .finally(() => {
        setLoading(false);
      });
      
    // Join the room
    socketService.joinRoom(roomName, {
      username: user.username,
      userId: user.id
    });
    
    // Cleanup on unmount
    return () => {
      socketService.leaveRoom(roomName);
    };
  }, [roomName, user]);
  
  // Listen for new messages
  useEffect(() => {
    const cleanup = socketService.onNewMessage(newMessage => {
      // Only add messages for this room
      if (newMessage.room === roomName) {
        setMessages(prev => [...prev, newMessage]);
      }
    });
    
    return cleanup;
  }, [roomName]);
  
  // Send message function
  const sendMessage = useCallback((messageText) => {
    if (!messageText.trim() || !isConnected || !roomName) return false;
    
    const tempId = Date.now();
    const newMessage = {
      id: tempId,
      user: user.username,
      userId: user.id,
      message: messageText,
      timestamp: new Date().toISOString(),
      room: roomName,
      pending: true
    };
    
    // Add to local state optimistically
    setMessages(prev => [...prev, newMessage]);
    
    // Send through socket
    return socketService.sendMessage(newMessage);
  }, [isConnected, roomName, user]);
  
  // Additional methods for typing indicators, etc.
  
  return {
    messages,
    loading,
    error,
    typingUsers,
    isConnected,
    sendMessage,
    // Other methods
  };
}