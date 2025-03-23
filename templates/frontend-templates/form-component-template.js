import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css";

const FormTemplate = () => {
  // Form state
  const [formData, setFormData] = useState({
    field1: "",
    field2: "",
    field3: ""
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate form data
      if (!formData.field1 || !formData.field2) {
        throw new Error("Please fill out all required fields");
      }
      
      // Submit to API
      const response = await fetch('/api/your-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      setSuccess(result.message || "Operation successful!");
      
      // Optional: Reset form after successful submission
      setFormData({
        field1: "",
        field2: "",
        field3: ""
      });
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err.message || "An error occurred while submitting the form");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="content-box">
        <h2 className="page-title">Form Title</h2>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <strong>Success:</strong> {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="field1">Field 1 (Required)</label>
            <input
              type="text"
              id="field1"
              name="field1"
              value={formData.field1}
              onChange={handleChange}
              placeholder="Enter field 1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="field2">Field 2 (Required)</label>
            <input
              type="text"
              id="field2"
              name="field2"
              value={formData.field2}
              onChange={handleChange}
              placeholder="Enter field 2"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="field3">Field 3 (Optional)</label>
            <input
              type="text"
              id="field3"
              name="field3"
              value={formData.field3}
              onChange={handleChange}
              placeholder="Enter field 3"
            />
          </div>
          
          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        
        <div className="link-row">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default FormTemplate;