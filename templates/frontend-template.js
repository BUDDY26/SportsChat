// App.js - Main Application with Navigation
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import Navbar from "./components/Navbar";  // Reusable navbar

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;

// ---------------------------------------------

// HomePage.js - Landing Page
import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to SportsChat+</h1>
      <p>Join conversations, create posts, and connect with others.</p>
      <Link to="/login">
        <button>Login</button>
      </Link>
    </div>
  );
};

export default HomePage;

// ---------------------------------------------

// LoginPage.js - Login Page
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login(username, password);
      navigate("/chat");  // Redirect to chat after login
    } catch (error) {
      alert("Login failed! Check your credentials.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginPage;

// ---------------------------------------------

// ChatPage.js - Main Chat Page
import React, { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/api";

const ChatPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <div>
      <h2>SportsChat+ Chat Room</h2>
      {user ? (
        <>
          <p>Welcome, {user.username}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in.</p>
      )}
    </div>
  );
};

export default ChatPage;

// ---------------------------------------------

// API.js - Handles Backend Requests
import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true, // Ensures cookies are sent for sessions
});

export const login = async (username, password) => {
    return API.post("/login", { username, password });
};

export const getCurrentUser = async () => {
    return API.get("/me");
};

export const logout = async () => {
    return API.post("/logout");
};

export default API;

// ---------------------------------------------

// Navbar.js - Navigation Bar
import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/login">Login</Link>
      <Link to="/chat">Chat</Link>
    </nav>
  );
};

export default Navbar;
