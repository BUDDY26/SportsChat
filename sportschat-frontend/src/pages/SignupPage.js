// Updated SignupPage.js to include form logic and connect to backend signup route
import React, { useState } from "react";
import { Button } from "./Button";
import Logo from "./Logo.png";
import { signup } from "../services/api";
import "./style.css";

export const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await signup(username, email, password);
      console.log("Signup successful:", response);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed.");
    }
  };

  return (
    <div className="sign-up">
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <img className="DALLE" alt="Logo" src={Logo} />
          <div className="rectangle" />
          <p className="div">
            SportsChatPlus.com is not affiliated with the National Collegiate
            Athletic Association (NCAA®) or March Madness Athletic Association,
            neither of which has supplied, reviewed, approved or endorsed the
            material on this site. SportsChatPlus.com is solely responsible for
            this site but makes no guarantee about the accuracy or completeness
            of the information herein.
          </p>
          <div className="text-wrapper-2">Terms of Service</div>
          <div className="text-wrapper-3">Privacy Policy</div>
          <p className="p">Ensure password is 6-20 Characters</p>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="rectangle-2"
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rectangle-2"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rectangle-3"
          />

          <div className="show">SHOW</div>

          <Button
            className="button-instance"
            label="Sign Up"
            size="medium"
            variant="primary"
            onClick={handleSubmit}
          />

          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>Signup successful! You can now <a href="/login">login</a>.</p>}

          <div className="text-wrapper-4">Already have an account?</div>
          <div className="text-wrapper-5">
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
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
