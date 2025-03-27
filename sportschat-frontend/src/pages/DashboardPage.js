import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import StatsPage from './StatsPage';
import "./style.css";

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // User state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // March Madness state
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [activeMenu, setActiveMenu] = useState("games");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Global chat state
  const [globalChatMessage, setGlobalChatMessage] = useState("");
  const [globalChatMessages, setGlobalChatMessages] = useState([
    { id: 1, user: "SportsFan123", message: "Welcome to the global chat!", timestamp: "1 hour ago" },
    { id: 2, user: "BasketballExpert", message: "Who do you think will win the championship?", timestamp: "45 minutes ago" },
    { id: 3, user: "MarchMadnessFan", message: "My bracket is already busted!", timestamp: "30 minutes ago" }
  ]);
  
  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData.user || userData);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.removeItem("user");
      navigate("/login");
    }
    
    setIsLoading(false);
  }, [navigate]);

  // Fetch games based on active tab
  useEffect(() => {
    if (isLoading) return;
    
    const fetchGames = async () => {
      setGamesLoading(true);
      setError(null);
      
      try {
        let endpoint;
        
        switch (activeTab) {
          case "live":
            endpoint = '/api/games/live';
            break;
          case "recent":
            endpoint = '/api/games/recent';
            break;
          default:
            endpoint = '/api/games/upcoming';
            break;
        }
        
        const response = await API.get(endpoint);
        setGames(response.data);
      } catch (err) {
        console.error(`Error fetching ${activeTab} games:`, err);
        setError(`Failed to load ${activeTab} games. Please try again.`);
        // Use fallback mock data for development
        setGames(getMockGames(activeTab));
      } finally {
        setGamesLoading(false);
      }
    };
    
    fetchGames();
  }, [activeTab, isLoading]);

  // Fetch chat messages when a game is selected
useEffect(() => {
  if (selectedGame && !isLoading) {
    fetchChatMessages();
  }
}, [selectedGame, isLoading, fetchChatMessages]);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await API.post('/logout');
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  // Fetch chat messages for selected game
const fetchChatMessages = useCallback(async () => {
  if (!selectedGame?.id) return;
  
  try {
    const response = await API.get(`/api/games/${selectedGame.id}/chat`);
    setChatMessages(response.data);
  } catch (err) {
    console.error("Error fetching chat messages:", err);
    // Use mock chat messages as fallback
    setChatMessages([
      { id: 1, user: "BasketballFan22", message: "Can't wait for this game!", timestamp: "2 hours ago" },
      { id: 2, user: "HoopsDreams", message: "Should be a good match-up.", timestamp: "1 hour ago" },
      { id: 3, user: "MarchMadnessFan", message: "What's everyone's prediction?", timestamp: "45 minutes ago" }
    ]);
  }
}, [selectedGame]);

  // Handle sending a chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedGame?.id) return;

    try {
      await API.post(`/api/games/${selectedGame.id}/chat`, { message: chatMessage });
      
      // Add message to UI immediately
      const newMessage = {
        id: Date.now(), // Temporary ID
        user: user?.username || "You",
        message: chatMessage,
        timestamp: "Just now"
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage("");
      
      // Refresh chat messages after a short delay
      setTimeout(() => {
        fetchChatMessages();
      }, 1000);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // Handle sending a global chat message
  const handleSendGlobalMessage = (e) => {
    e.preventDefault();
    if (!globalChatMessage.trim()) return;

    // Add message to UI immediately
    const newMessage = {
      id: Date.now(), // Temporary ID
      user: user?.username || "You",
      message: globalChatMessage,
      timestamp: "Just now"
    };
    
    setGlobalChatMessages([...globalChatMessages, newMessage]);
    setGlobalChatMessage("");
    
    // TODO: In a real implementation, you would send this to the server
    // Example: API.post('/api/chat/global', { message: globalChatMessage });
  };

  // Handle game selection
  const handleGameClick = async (game) => {
    try {
      const response = await API.get(`/api/games/${game.id}`);
      setSelectedGame(response.data);
    } catch (err) {
      console.error("Error fetching game details:", err);
      // Use the clicked game as fallback
      setSelectedGame(game);
    }
  };

  // Place a bet on a game
  const handlePlaceBet = async (teamId, amount) => {
    if (!selectedGame?.id) return;
    
    try {
      await API.post(`/api/games/${selectedGame.id}/bet`, { teamId, amount });
      alert("Bet placed successfully!");
    } catch (err) {
      console.error("Error placing bet:", err);
      alert(err.response?.data?.message || "Failed to place bet. Please try again.");
    }
  };

  // Mock data for development/fallback
  const getMockGames = (tab) => {
    switch (tab) {
      case "live":
        return [
          { id: 7, team1: "Duke", team2: "Houston", time: "LIVE", score1: 54, score2: 52, quarter: "2nd Half" },
          { id: 8, team1: "Purdue", team2: "Oregon", time: "LIVE", score1: 35, score2: 38, quarter: "1st Half" }
        ];
      case "recent":
        return [
          { id: 9, team1: "Kansas", team2: "Florida", time: "Final", score1: 78, score2: 65 },
          { id: 10, team1: "Kentucky", team2: "Washington", time: "Final", score1: 67, score2: 74 },
          { id: 11, team1: "UCLA", team2: "Baylor", time: "Final", score1: 81, score2: 85 }
        ];
      default:
        return [
          { id: 1, team1: "Maryland", team2: "Texas", time: "Mar 26, 7:10 PM", spread: "-3.5" },
          { id: 2, team1: "Creighton", team2: "Tennessee", time: "Mar 26, 8:20 PM", spread: "-1.5" },
          { id: 3, team1: "Arizona", team2: "Gonzaga", time: "Mar 27, 6:15 PM", spread: "-2.0" },
          { id: 4, team1: "UConn", team2: "San Diego St", time: "Mar 27, 7:45 PM", spread: "-6.5" },
          { id: 5, team1: "North Carolina", team2: "Alabama", time: "Mar 28, 7:10 PM", spread: "-4.0" },
          { id: 6, team1: "Iowa St", team2: "Illinois", time: "Mar 28, 9:40 PM", spread: "-1.0" }
        ];
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-container">
          <h1>SportsChat+</h1>
        </div>
        <div className="user-controls">
          <span className="username">Welcome, {user?.username || "User"}</span>
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* March Madness Container */}
        <div className="march-madness-container">
          {/* Sidebar Navigation */}
          <div className="sidebar">
            <div className="menu-items">
              <div 
                className={`menu-item ${activeMenu === "games" ? "active" : ""}`}
                onClick={() => setActiveMenu("games")}
              >
                <i className="icon game-icon"></i>
                <span>Live Games</span>
              </div>
              <div 
                className={`menu-item ${activeMenu === "teams" ? "active" : ""}`}
                onClick={() => setActiveMenu("teams")}
              >
                <i className="icon team-icon"></i>
                <span>Teams</span>
              </div>
              <div 
                className={`menu-item ${activeMenu === "bracket" ? "active" : ""}`}
                onClick={() => setActiveMenu("bracket")}
              >
                <i className="icon bracket-icon"></i>
                <span>Bracket</span>
              </div>
              <div 
                className={`menu-item ${activeMenu === "bets" ? "active" : ""}`}
                onClick={() => setActiveMenu("bets")}
              >
                <i className="icon coin-icon"></i>
                <span>My Bets</span>
              </div>
              <div 
                className={`menu-item ${activeMenu === "chat" ? "active" : ""}`}
                onClick={() => setActiveMenu("chat")}
              >
                <i className="icon chat-icon"></i>
                <span>Global Chat</span>
              </div>
              <div 
                className={`menu-item ${activeMenu === "stats" ? "active" : ""}`}
                onClick={() => setActiveMenu("stats")}
              >
                <i className="icon stats-icon"></i>
                <span>Stats</span>
              </div>
            </div>
          </div>

          {/* Main Content Area - Games View */}
          {activeMenu === "games" && (
            <div className="main-content">
              {/* Tab Navigation */}
              <div className="tabs">
                <div
                  className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Upcoming
                </div>
                <div
                  className={`tab ${activeTab === "live" ? "active" : ""}`}
                  onClick={() => setActiveTab("live")}
                >
                  Live
                </div>
                <div
                  className={`tab ${activeTab === "recent" ? "active" : ""}`}
                  onClick={() => setActiveTab("recent")}
                >
                  Recent
                </div>
              </div>

              {/* Games List */}
              <div className="games-list">
                {gamesLoading ? (
                  <div className="loading-message">Loading games...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : (
                  <>
                    <div className="header-row">
                      <div className="match-up">Match Up</div>
                      <div className="time">Time</div>
                      <div className="spread">
                        {activeTab === "upcoming" ? "Round" : "Score"}
                      </div>
                    </div>
                    {games.length === 0 ? (
                      <div className="no-games-message">
                        No {activeTab} games available
                      </div>
                    ) : (
                      games.map((game) => (
                        <div
                          key={game.id}
                          className={`game-row ${selectedGame?.id === game.id ? "selected" : ""}`}
                          onClick={() => handleGameClick(game)}
                        >
                          <div className="match-up">
                            {game.team1} vs {game.team2}
                          </div>
                          <div className="time">
                            {game.time === "LIVE" ? (
                              <span className="live-indicator">LIVE</span>
                            ) : (
                              game.time
                            )}
                          </div>
                          <div className="spread">
                            {activeTab === "upcoming" ? (
                              game.round
                            ) : (
                              <span className="score">
                                {game.score1} - {game.score2}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Placeholder for Teams View */}
          {activeMenu === "teams" && (
            <div className="main-content placeholder-content">
              <h2>Teams</h2>
              <p>Team information will be displayed here.</p>
            </div>
          )}
          
          {/* Placeholder for Bracket View */}
          {activeMenu === "bracket" && (
            <div className="main-content placeholder-content">
              <h2>Tournament Bracket</h2>
              <p>Bracket view will be displayed here.</p>
            </div>
          )}
          
          {/* Placeholder for My Bets View */}
          {activeMenu === "bets" && (
            <div className="main-content placeholder-content">
              <h2>My Bets</h2>
              <p>Your betting history will be displayed here.</p>
            </div>
          )}
          
          {/* Global Chat View */}
          {activeMenu === "chat" && (
            <div className="main-content global-chat-container">
              <div className="global-chat-header">
                <h2>Global Chat</h2>
                <p>Chat with other users about March Madness</p>
              </div>
              <div className="global-chat-messages">
                {globalChatMessages.length === 0 ? (
                  <div className="empty-chat">No messages yet. Be the first to chat!</div>
                ) : (
                  globalChatMessages.map((msg, index) => (
                    <div key={index} className="chat-message">
                      <div className="message-header">
                        <span className="message-user">{msg.user}</span>
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                      <div className="message-content">{msg.message}</div>
                    </div>
                  ))
                )}
              </div>
              <form className="chat-input" onSubmit={handleSendGlobalMessage}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={globalChatMessage}
                  onChange={(e) => setGlobalChatMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          )}
          
          {/* Stats View */}
          {activeMenu === "stats" && (
            <div className="main-content">
              <StatsPage activeMenu={activeMenu} />
            </div>
          )}

          {/* Game Detail Panel */}
          {selectedGame && activeMenu === "games" && (
            <div className="game-detail">
              <div className="game-header">
                <h2>
                  {selectedGame.team1} vs {selectedGame.team2}
                </h2>
                {selectedGame.time === "LIVE" && (
                  <span className="live-badge">LIVE</span>
                )}
              </div>

              {/* Game Info */}
              <div className="game-info">
                <div className="info-item">
                  <label>Round:</label>
                  <span>{selectedGame.round}</span>
                </div>
                
                <div className="info-item">
                  <label>Location:</label>
                  <span>{selectedGame.location || "TBD"}</span>
                </div>
                
                <div className="info-item">
                  <label>Date & Time:</label>
                  <span>
                    {selectedGame.time === "LIVE" ? "In Progress" : 
                     selectedGame.time === "Final" ? "Completed" : 
                     selectedGame.time}
                  </span>
                </div>
              </div>

              {/* Score Display (for LIVE or completed games) */}
              {(selectedGame.time === "LIVE" || selectedGame.time === "Final") && (
                <div className="score-display">
                  <div className="team-score">
                    <div className="team">{selectedGame.team1}</div>
                    <div className="score">{selectedGame.score1}</div>
                  </div>
                  <div className="versus">VS</div>
                  <div className="team-score">
                    <div className="team">{selectedGame.team2}</div>
                    <div className="score">{selectedGame.score2}</div>
                  </div>
                  {selectedGame.time === "LIVE" && (
                    <div className="period">In Progress</div>
                  )}
                </div>
              )}

              {/* Betting Section (for upcoming games) */}
              {selectedGame.time !== "LIVE" && selectedGame.time !== "Final" && (
                <div className="betting-section">
                  <h3>Place a Bet</h3>
                  <div className="betting-buttons">
                    <button 
                      className="bet-button"
                      onClick={() => handlePlaceBet(selectedGame.team1Id, 100)}
                    >
                      Bet on {selectedGame.team1}
                    </button>
                    <button 
                      className="bet-button"
                      onClick={() => handlePlaceBet(selectedGame.team2Id, 100)}
                    >
                      Bet on {selectedGame.team2}
                    </button>
                  </div>
                  <p className="bet-note">Standard bet is 100 coins</p>
                </div>
              )}

              {/* Chat Section */}
              <div className="chat-section">
                <h3>Game Chat</h3>
                <div className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <div className="empty-chat">No messages yet. Be the first to chat!</div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className="chat-message">
                        <div className="message-header">
                          <span className="message-user">{msg.user}</span>
                          <span className="message-time">{msg.timestamp}</span>
                        </div>
                        <div className="message-content">{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>
                <form className="chat-input" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <button type="submit">Send</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="disclaimer">
          <p>
            SportsChatPlus.com is not affiliated with the National Collegiate
            Athletic Association (NCAA®) or March Madness Athletic Association,
            neither of which has supplied, reviewed, approved, or endorsed the
            material on this site. SportsChatPlus.com is solely responsible for
            this site but makes no guarantee about the accuracy or completeness
            of the information herein.
          </p>
          <div className="footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;