import React from "react";
//import { Link } from "react-router-dom";
import { Button } from "./Button";
import Logo from "./Logo.png";
import "./style.css";

const HomePage = () => {

    console.log("Homepage Loaded!")
  return (
    <div>
      <h1>Welcome to SportsChat+</h1>
      <p>Join conversations, create posts, and connect with others.</p>
      <a href="/login" style={{
        display: 'inline-block',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        Login
      </a>
    </div>
  );
};

export default HomePage;
