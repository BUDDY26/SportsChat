import React from "react";
import { Link } from "react-router-dom";
import "./style.css";

const HomePage = () => {
  console.log("Homepage Loaded!");
  
  // Check if user is logged in (using localStorage)
  const isLoggedIn = localStorage.getItem("user") !== null;

  return (
    <div className="home-page">
      <div className="content-box">
        <h1 className="page-title">Welcome to SportsChat+</h1>
        <p>Join conversations, create posts, and connect with others.</p>
        
        {isLoggedIn ? (
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.reload();
            }}
            className="primary-button"
          >
            Logout
          </button>
        ) : (
          <Link to="/login">
            <button className="primary-button">Login</button>
          </Link>
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

export default HomePage;