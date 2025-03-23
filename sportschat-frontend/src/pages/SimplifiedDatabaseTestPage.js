import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css";

const DatabaseTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Call your backend API endpoint that tests the database connection
      // In SimplifiedDatabaseTestPage.js, update your fetch call:
      const response = await fetch('http://localhost:5000/api/test-database');
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Database test error:", err);
      setError(err.message || "Failed to test database connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="content-box">
        <h2 className="page-title">Database Connection Test</h2>
        
        <p>This page tests the connection to your Azure SQL database.</p>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {result && (
          <div className="success-message">
            <p><strong>Connection Successful!</strong></p>
            <p>Game Count: {result.stats.gameCount}</p>
            <p>Date Range: {new Date(result.stats.earliestGame).toLocaleDateString()} to {new Date(result.stats.latestGame).toLocaleDateString()}</p>
            
            <h3 style={{marginTop: '15px', textAlign: 'left'}}>Recent Games:</h3>
            <div style={{maxHeight: '200px', overflowY: 'auto', textAlign: 'left'}}>
              {result.recentGames.map((game, index) => (
                <div key={index} style={{margin: '8px 0', padding: '8px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '4px'}}>
                  <strong>{game.team1} vs {game.team2}</strong><br />
                  <span>Score: {game.score1} - {game.score2}</span><br />
                  <span>Date: {new Date(game.game_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          className="primary-button"
          onClick={testDatabaseConnection}
          disabled={loading}
        >
          {loading ? "Testing..." : "Test Database Connection"}
        </button>
        
        <div className="link-row">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTestPage;