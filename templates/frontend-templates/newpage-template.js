import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./style.css";

const NewFeaturePage = () => {
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/your-endpoint');
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "An error occurred while fetching data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="login-page">
        <div className="content-box">
          <h2 className="page-title">Loading...</h2>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="login-page">
        <div className="content-box">
          <h2 className="page-title">Error</h2>
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
          <button className="primary-button" onClick={() => window.location.reload()}>
            Try Again
          </button>
          <div className="link-row">
            <Link to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="content-box">
        <h2 className="page-title">Your Feature Title</h2>
        
        {/* Main content area */}
        <div className="feature-content">
          {data.length > 0 ? (
            <div className="data-list">
              {data.map((item, index) => (
                <div key={index} className="data-item">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  {/* Add more fields based on your data structure */}
                </div>
              ))}
            </div>
          ) : (
            <p>No items found.</p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="action-buttons">
          <button className="primary-button">
            Primary Action
          </button>
        </div>
        
        {/* Navigation links */}
        <div className="link-row">
          <Link to="/">Back to Home</Link>
          {/* Add additional links as needed */}
        </div>
      </div>
    </div>
  );
};

export default NewFeaturePage;