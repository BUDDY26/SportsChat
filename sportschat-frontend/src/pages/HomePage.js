import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const HomePage = () => {
  console.log("Homepage Loaded!");
  const navigate = useNavigate();
  
  // Redirect logged-in users to dashboard
  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("user") !== null;
    
    // If logged in, redirect to dashboard
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="home-page">
      <div className="content-box">
        <h1 className="page-title">Welcome to SportsChat+</h1>
        <p>Join conversations, create posts, and connect with others for March Madness!</p>
        
        <Link to="/login">
          <button className="primary-button">Login</button>
        </Link>
        
        <div className="link-row">
          Don't have an account? <Link to="/signup">Sign Up</Link>
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

export default HomePage;