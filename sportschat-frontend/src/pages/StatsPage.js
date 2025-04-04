// src/components/StatsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { getGameStats, getPlayerStats, getTeamStats } from "../services/api";

const StatsPage = ({ activeMenu }) => {
  const [activeStatsTab, setActiveStatsTab] = useState("games");
  const [gameStatsFilter, setGameStatsFilter] = useState("recent");
  const [playerStatsFilter, setPlayerStatsFilter] = useState("ppg");
  const [teamStatsFilter, setTeamStatsFilter] = useState("winPct");
  const [gameStatsList, setGameStatsList] = useState([]);
  const [playerStatsList, setPlayerStatsList] = useState([]);
  const [teamStatsList, setTeamStatsList] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Define fetch functions before they're used in useEffect
  const fetchGameStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getGameStats(gameStatsFilter);
      // Ensure data is an array before setting state
      setGameStatsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching game stats:", err);
      // Set to empty array on error
      setGameStatsList([]);
    } finally {
      setStatsLoading(false);
    }
  }, [gameStatsFilter]);
  
  const fetchPlayerStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getPlayerStats(playerStatsFilter);
      // Ensure data is an array before setting state
      setPlayerStatsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching player stats:", err);
      // Set to empty array on error
      setPlayerStatsList([]);
    } finally {
      setStatsLoading(false);
    }
  }, [playerStatsFilter]);
  
  const fetchTeamStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getTeamStats(teamStatsFilter);
      // Ensure data is an array before setting state
      setTeamStatsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching team stats:", err);
      // Set to empty array on error
      setTeamStatsList([]);
    } finally {
      setStatsLoading(false);
    }
  }, [teamStatsFilter]);

  useEffect(() => {
    if (activeMenu === "stats" && activeStatsTab === "games") {
      fetchGameStats();
    }
  }, [activeMenu, activeStatsTab, gameStatsFilter, fetchGameStats]);

  useEffect(() => {
    if (activeMenu === "stats" && activeStatsTab === "players") {
      fetchPlayerStats();
    }
  }, [activeMenu, activeStatsTab, playerStatsFilter, fetchPlayerStats]);

  useEffect(() => {
    if (activeMenu === "stats" && activeStatsTab === "teams") {
      fetchTeamStats();
    }
  }, [activeMenu, activeStatsTab, teamStatsFilter, fetchTeamStats]);

  // Render functions for game stats
  const renderGameStats = () => {
    if (statsLoading) {
      return <div className="loading-message">Loading game statistics...</div>;
    }

    // Add safety check to ensure gameStatsList is an array
    if (!gameStatsList || !Array.isArray(gameStatsList) || gameStatsList.length === 0) {
      return <div className="no-games-message">No game statistics available.</div>;
    }

    return (
      <div className="game-stats-container">
        <div className="filter-controls">
          <button 
            className={`filter-button ${gameStatsFilter === 'recent' ? 'active' : ''}`}
            onClick={() => setGameStatsFilter('recent')}
          >
            Most Recent
          </button>
          <button 
            className={`filter-button ${gameStatsFilter === 'highScoring' ? 'active' : ''}`}
            onClick={() => setGameStatsFilter('highScoring')}
          >
            Highest Scoring
          </button>
          <button 
            className={`filter-button ${gameStatsFilter === 'closeGames' ? 'active' : ''}`}
            onClick={() => setGameStatsFilter('closeGames')}
          >
            Closest Games
          </button>
          <button 
            className={`filter-button ${gameStatsFilter === 'blowouts' ? 'active' : ''}`}
            onClick={() => setGameStatsFilter('blowouts')}
          >
            Biggest Blowouts
          </button>
        </div>

        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Matchup</th>
                <th>Date</th>
                <th>Score</th>
                <th>Round</th>
                {gameStatsFilter === 'highScoring' && <th>Total Score</th>}
                {(gameStatsFilter === 'closeGames' || gameStatsFilter === 'blowouts') && <th>Margin</th>}
              </tr>
            </thead>
            <tbody>
              {gameStatsList.map((game) => (
                <tr key={game.id}>
                  <td>{game.team1} vs. {game.team2}</td>
                  <td>{game.date}</td>
                  <td>{game.score1} - {game.score2}</td>
                  <td>{game.round}</td>
                  {gameStatsFilter === 'highScoring' && <td>{game.totalScore}</td>}
                  {(gameStatsFilter === 'closeGames' || gameStatsFilter === 'blowouts') && <td>{game.scoreDiff}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render functions for player stats
  const renderPlayerStats = () => {
    if (statsLoading) {
      return <div className="loading-message">Loading player statistics...</div>;
    }

    // Add safety check to ensure playerStatsList is an array
    if (!playerStatsList || !Array.isArray(playerStatsList) || playerStatsList.length === 0) {
      return <div className="no-games-message">No player statistics available.</div>;
    }

    return (
      <div className="player-stats-container">
        <div className="filter-controls">
          <button 
            className={`filter-button ${playerStatsFilter === 'ppg' ? 'active' : ''}`}
            onClick={() => setPlayerStatsFilter('ppg')}
          >
            Points Per Game
          </button>
          <button 
            className={`filter-button ${playerStatsFilter === 'rpg' ? 'active' : ''}`}
            onClick={() => setPlayerStatsFilter('rpg')}
          >
            Rebounds Per Game
          </button>
          <button 
            className={`filter-button ${playerStatsFilter === 'apg' ? 'active' : ''}`}
            onClick={() => setPlayerStatsFilter('apg')}
          >
            Assists Per Game
          </button>
          <button 
            className={`filter-button ${playerStatsFilter === 'fgPct' ? 'active' : ''}`}
            onClick={() => setPlayerStatsFilter('fgPct')}
          >
            Field Goal %
          </button>
        </div>

        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Position</th>
                <th>PPG</th>
                <th>RPG</th>
                <th>APG</th>
                <th>FG%</th>
              </tr>
            </thead>
            <tbody>
              {playerStatsList.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.team}</td>
                  <td>{player.position}</td>
                  <td>{player.ppg}</td>
                  <td>{player.rpg}</td>
                  <td>{player.apg}</td>
                  <td>{player.fgPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render functions for team stats
  const renderTeamStats = () => {
    if (statsLoading) {
      return <div className="loading-message">Loading team statistics...</div>;
    }

    // Add safety check to ensure teamStatsList is an array
    if (!teamStatsList || !Array.isArray(teamStatsList) || teamStatsList.length === 0) {
      return <div className="no-games-message">No team statistics available.</div>;
    }

    return (
      <div className="team-stats-container">
        <div className="filter-controls">
          <button 
            className={`filter-button ${teamStatsFilter === 'winPct' ? 'active' : ''}`}
            onClick={() => setTeamStatsFilter('winPct')}
          >
            Win Percentage
          </button>
          <button 
            className={`filter-button ${teamStatsFilter === 'ppg' ? 'active' : ''}`}
            onClick={() => setTeamStatsFilter('ppg')}
          >
            Points Per Game
          </button>
          <button 
            className={`filter-button ${teamStatsFilter === 'differential' ? 'active' : ''}`}
            onClick={() => setTeamStatsFilter('differential')}
          >
            Point Differential
          </button>
        </div>

        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Conference</th>
                <th>Seed</th>
                <th>W-L</th>
                <th>PPG</th>
                <th>Opp PPG</th>
                <th>Diff</th>
                <th>Last 5</th>
              </tr>
            </thead>
            <tbody>
              {teamStatsList.map((team) => (
                <tr key={team.id}>
                  <td>{team.name}</td>
                  <td>{team.conference || "N/A"}</td>
                  <td>{team.seed || "N/A"}</td>
                  <td>{team.wins}-{team.losses}</td>
                  <td>{team.ppg}</td>
                  <td>{team.oppg}</td>
                  <td>{team.differential}</td>
                  <td>{team.last5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>Tournament Statistics</h2>
        <p>View detailed statistics for games, players, and teams.</p>
      </div>
      
      <div className="stats-tabs">
        <div 
          className={`stats-tab ${activeStatsTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveStatsTab('games')}
        >
          Games
        </div>
        <div 
          className={`stats-tab ${activeStatsTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveStatsTab('players')}
        >
          Players
        </div>
        <div 
          className={`stats-tab ${activeStatsTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveStatsTab('teams')}
        >
          Teams
        </div>
      </div>
      
      <div className="stats-content">
        {activeStatsTab === 'games' && renderGameStats()}
        {activeStatsTab === 'players' && renderPlayerStats()}
        {activeStatsTab === 'teams' && renderTeamStats()}
      </div>
    </div>
  );
};

export default StatsPage;