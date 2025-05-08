import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import GlobalChatPage from './pages/GlobalChatPage';
import SimplifiedDatabaseTestPage from './pages/SimplifiedDatabaseTestPage';
import './pages/style.css';
import { io } from 'socket.io-client';

function App() {
  // Initialize socket state
  const [socket, setSocket] = useState(null);

  // Set up socket connection
  useEffect(() => {
    // Create socket connection
    const newSocket = io('http://localhost:5000', {
      auth: {
        sessionID: localStorage.getItem('sessionID') // or however you store the session
      }
    });

    // Connect to global chat
    newSocket.emit('joinGlobalChat');

    // Listen for new messages
    newSocket.on('newGlobalMessage', (message) => {
      console.log('New message:', message);
      // Update your chat UI with the new message
    });

    // Handling message confirmations
    newSocket.on('messageSent', (data) => {
      console.log('Message confirmed:', data.messageId);
      // Update UI to show message is confirmed
    });

    // Handling errors
    newSocket.on('messageError', (data) => {
      console.error('Message error:', data.error);
      // Show error in UI
    });

    // Save socket in state
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty dependency array means this runs once on component mount

  // Function to send a message (defined outside useEffect so other components can use it)
  const sendMessage = (text) => {
    if (socket) {
      const tempId = Date.now(); // temporary ID to track this message
      socket.emit('globalChatMessage', {
        tempId,
        text
      });
    }
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage socket={socket} sendMessage={sendMessage} />} />
      <Route path="/global-chat" element={<GlobalChatPage socket={socket} sendMessage={sendMessage} />} />
      <Route path="/test-database" element={<SimplifiedDatabaseTestPage />} />
    </Routes>
  );
}

export default App;