import React from "react";
import { Button } from "./Button";
import Logo from "./Logo.png";
import "./style.css";

export const SignupPage = () => {
  return (
    <div className="sign-up">
      <div className="overlap-group-wrapper">
        <div className="overlap-group">
          <img className="DALLE" alt="Dalle" src={Logo} />

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

          <div className="text-wrapper-4">Already have an account?</div>

          <div className="text-wrapper-5"><a href="/login" style={{
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

          <div className="text-wrapper-6">Sign Up</div>

          <div className="text-wrapper-7">Email</div>

          <div className="rectangle-2" />

          <div className="text-wrapper-8">Password</div>

          <div className="rectangle-3" />

          <div className="show">SHOW</div>

          <Button
            className="button-instance"
            label="Sign Up"
            size="medium"
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
};

export default SignupPage;