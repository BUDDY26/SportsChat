import React, { useState } from "react";
import { Button } from "./Button";
import "./style.css";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Email:", email);
    console.log("Password:", password);
  };

  return (
    <div className="login">
      <div className="div">
        <div className="overlap-group">
          <div className="text-wrapper-2">Forgot password?</div>
          <div className="text-wrapper-3">Need an account?</div>
          <div className="text-wrapper-4"><a href="/signup" style={{
        display: 'inline-block',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        Sign Up
      </a></div>
          <div className="text-wrapper-5">Log In</div>
          <div className="text-wrapper-6">Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email-input"
            placeholder="Enter your email"
          />
          <div className="rectangle" />
          <div className="text-wrapper-7">Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
            placeholder="Enter your password"
          />
          <div className="overlap">
            <div className="show">SHOW</div>
          </div>
          <Button
            className="log-in"
            label="Log In"
            size="medium"
            variant="primary"
            onClick={handleSubmit}
          />
        </div>
        <div className="overlap-2">
          <div className="rectangle-2" />
          <p className="p">
            SportsChatPlus.com is not affiliated with the National Collegiate
            Athletic Association (NCAA®) or March Madness Athletic Association,
            neither of which has supplied, reviewed, approved, or endorsed the
            material on this site. SportsChatPlus.com is solely responsible for
            this site but makes no guarantee about the accuracy or completeness
            of the information herein.
          </p>
          <div className="text-wrapper-8">Terms of Service</div>
          <div className="text-wrapper-9">Privacy Policy</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
