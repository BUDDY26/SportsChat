import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import "./style.css";

export const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate inputs
    if (!username || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    if (password.length < 6 || password.length > 20) {
      setError("Password must be between 6-20 characters");
      return;
    }
    
    try {
      const response = await signup(username, email, password);
      console.log("Signup successful:", response);
      setSuccess(true);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="sign-up">
      <div className="content-box">
        <h2 className="page-title">Sign Up</h2>
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {success && (
          <div className="success-message">
            Account created successfully! Redirecting to login...
          </div>
        )}
        
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            placeholder="Enter your username"
          />
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
            />
            <span 
              className="show-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </span>
          </div>
          <p className="password-hint">Ensure password is 6-20 Characters</p>
        </div>
        
        <button 
          className="primary-button"
          onClick={handleSubmit}
        >
          Sign Up
        </button>
        
        <div className="link-row">
          Already have an account? <Link to="/login">Login</Link>
        </div>
        
        <div className="disclaimer">
          <p>
            SportsChatPlus.com is not affiliated with the National Collegiate
            Athletic Association (NCAA®) or March Madness Athletic Association,
            neither of which has supplied, reviewed, approved, or endorsed the
            material on this site. SportsChatPlus.com is solely responsible for
            this site but makes no guarantee about the accuracy or completeness
            of the information herein.
          </p>
          <div style={{ marginTop: "10px" }}>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;