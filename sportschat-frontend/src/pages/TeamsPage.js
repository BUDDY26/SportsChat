import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import "./style.css";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Fetch all teams
  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    setError(null);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      console.log(`Fetching teams data...`);
      
      const response = await API.get(`/api/teams?_t=${timestamp}`);
      console.log(`Received ${response.data.length} teams`);
      
      if (Array.isArray(response.data)) {
        // Sort teams by name
        const sortedTeams = [...response.data].sort((a, b) => a.name.localeCompare(b.name));
        setTeams(sortedTeams);
        setLastRefreshTime(new Date());
      } else {
        console.error('API returned non-array data:', response.data);
        setTeams([]);
      }
    } catch (err) {
      console.error(`Error fetching teams:`, err);
      setError(`Failed to load teams. Please try again.`);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  // Fetch team details
  const fetchTeamDetails = useCallback(async (teamId) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await API.get(`/api/teams/${teamId}?_t=${timestamp}`);
      setSelectedTeam(response.data);
    } catch (err) {
      console.error("Error fetching team details:", err);
      setError(`Failed to load team details. Please try again.`);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Handle team selection
  const handleTeamClick = (team) => {
    fetchTeamDetails(team.id);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchTeams();
    if (selectedTeam) {
      fetchTeamDetails(selectedTeam.id);
    }
  };

  return (
    <div className="teams-page">
      <div className="teams-header">
        <h2>Tournament Teams</h2>
        <div className="header-controls">
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={teamsLoading}
          >
            {teamsLoading ? 'Refreshing...' : 'Refresh Teams'}
          </button>
          {lastRefreshTime && (
            <div className="last-updated">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="teams-content">
        {/* Teams List */}
        <div className="teams-list">
          {teamsLoading ? (
            <div className="loading-message">Loading teams...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="teams-count">{teams.length} Teams</div>
              <div className="teams-list-content">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`team-item ${selectedTeam?.id === team.id ? "selected" : ""}`}
                    onClick={() => handleTeamClick(team)}
                  >
                    <div className="team-name">{team.name}</div>
                    <div className="team-conference">{team.conference || "Unknown Conference"}</div>
                    <div className="team-seed">
                      {team.seed ? `Seed: ${team.seed}` : "Unseeded"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Team Details */}
        {selectedTeam ? (
          <div className="team-details">
            <div className="team-header">
              <h3>{selectedTeam.name}</h3>
              {selectedTeam.seed && <div className="team-seed-badge">Seed: {selectedTeam.seed}</div>}
            </div>

            <div className="team-info-section">
              <div className="info-group">
                <div className="info-item">
                  <label>Conference:</label>
                  <span>{selectedTeam.conference || "N/A"}</span>
                </div>
                <div className="info-item">
                  <label>Coach:</label>
                  <span>{selectedTeam.coach || "N/A"}</span>
                </div>
                <div className="info-item">
                  <label>Record:</label>
                  <span>{selectedTeam.wins}-{selectedTeam.losses}</span>
                </div>
              </div>
            </div>

            {/* Players Section */}
            {selectedTeam.players && selectedTeam.players.length > 0 ? (
              <div className="team-players-section">
                <h4>Players</h4>
                <div className="players-list">
                  {selectedTeam.players.map((player) => (
                    <div key={player.id} className="player-item">
                      <div className="player-name">{player.name}</div>
                      <div className="player-position">{player.position || "N/A"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-players-message">
                No player information available
              </div>
            )}

            {/* Team Games Section */}
            {selectedTeam.games && selectedTeam.games.length > 0 ? (
              <div className="team-games-section">
                <h4>Tournament Games</h4>
                <div className="games-list">
                  {selectedTeam.games.map((game) => (
                    <div key={game.id} className="game-item">
                      <div className="game-teams">
                        {game.team1} vs {game.team2}
                      </div>
                      <div className="game-info">
                        <span className="game-round">{game.round}</span>
                        <span className="game-date">
                          {new Date(game.date).toLocaleDateString()}
                        </span>
                      </div>
                      {(game.score1 > 0 || game.score2 > 0) && (
                        <div className="game-score">
                          Score: {game.score1} - {game.score2}
                          {game.winnerId && (
                            <span className="game-result">
                              {game.winnerId === selectedTeam.id ? " (Win)" : " (Loss)"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-games-message">
                No game information available
              </div>
            )}
          </div>
        ) : (
          <div className="no-team-selected">
            <p>Select a team to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;