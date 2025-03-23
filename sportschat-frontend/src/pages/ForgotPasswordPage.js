import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate email
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    try {
      // In a real implementation, this would connect to your API
      // For now, we'll just simulate success
      console.log("Password reset requested for:", email);
      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to process your request. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="content-box">
        <h2 className="page-title">Reset Password</h2>
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {success ? (
          <div className="success-message">
            <p>If an account exists for {email}, you will receive password reset instructions.</p>
            <div className="link-row" style={{ marginTop: "15px" }}>
              <Link to="/login">Return to Login</Link>
            </div>
          </div>
        ) : (
          <>
            <p>Enter your email address and we'll send you instructions to reset your password.</p>
            
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
            
            <button 
              className="primary-button"
              onClick={handleSubmit}
            >
              Reset Password
            </button>
            
            <div className="link-row">
              <Link to="/login">Back to Login</Link>
            </div>
          </>
        )}
        
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

export default ForgotPasswordPage;