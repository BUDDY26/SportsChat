import React, { useState, useEffect, useCallback } from 'react';
import { getGameStats, getPlayerStats, getTeamStats } from "../services/api";

const StatsPage = ({ activeMenu }) => {
  const [activeStatsTab, setActiveStatsTab] = useState("games");
  const [gameStatsFilter, setGameStatsFilter] = useState("highScoring");
  const [playerStatsFilter, setPlayerStatsFilter] = useState("ppg");
  const [teamStatsFilter, setTeamStatsFilter] = useState("winPct");
  const [gameStatsList, setGameStatsList] = useState([]);
  const [playerStatsList, setPlayerStatsList] = useState([]);
  const [teamStatsList, setTeamStatsList] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchGameStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getGameStats(gameStatsFilter);
      setGameStatsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching game stats:", err);
      setGameStatsList([]);
    } finally {
      setStatsLoading(false);
    }
  }, [gameStatsFilter]);

  const fetchPlayerStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getPlayerStats(playerStatsFilter);
      setPlayerStatsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching player stats:", err);
      setPlayerStatsList([]);
    } finally {
      setStatsLoading(false);
    }
  }, [playerStatsFilter]);

  const fetchTeamStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getTeamStats(teamStatsFilter);
      setTeamStatsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching team stats:", err);
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

  const renderGameStats = () => {
    if (statsLoading) return <div className="loading-message">Loading game statistics...</div>;
    if (!Array.isArray(gameStatsList) || gameStatsList.length === 0) return <div className="no-games-message">No game statistics available.</div>;

    return (
      <div className="game-stats-container">
        <div className="filter-controls">
          <button className={`filter-button ${gameStatsFilter === 'highScoring' ? 'active' : ''}`} onClick={() => setGameStatsFilter('highScoring')}>Highest Scoring</button>
          <button className={`filter-button ${gameStatsFilter === 'closeGames' ? 'active' : ''}`} onClick={() => setGameStatsFilter('closeGames')}>Closest Games</button>
          <button className={`filter-button ${gameStatsFilter === 'blowouts' ? 'active' : ''}`} onClick={() => setGameStatsFilter('blowouts')}>Biggest Blowouts</button>
        </div>
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th></th>
                <th>Matchup</th>
                <th>Date</th>
                <th>Score</th>
                {gameStatsFilter === 'highScoring' && <th>Total Score</th>}
                {(gameStatsFilter === 'closeGames' || gameStatsFilter === 'blowouts') && <th>Margin</th>}
              </tr>
            </thead>
            <tbody>
              {gameStatsList.map((game, index) => (
                <tr key={game.id}>
                  <td>{index + 1}</td>
                  <td>{game.team1} vs. {game.team2}</td>
                  <td>{new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td>{game.score1} - {game.score2}</td>
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

  const renderPlayerStats = () => {
    if (statsLoading) return <div className="loading-message">Loading player statistics...</div>;
    if (!Array.isArray(playerStatsList) || playerStatsList.length === 0) return <div className="no-games-message">No player statistics available.</div>;

    return (
      <div className="player-stats-container">
        <div className="filter-controls">
          <button className={`filter-button ${playerStatsFilter === 'ppg' ? 'active' : ''}`} onClick={() => setPlayerStatsFilter('ppg')}>Points Per Game</button>
          <button className={`filter-button ${playerStatsFilter === 'rpg' ? 'active' : ''}`} onClick={() => setPlayerStatsFilter('rpg')}>Rebounds Per Game</button>
          <button className={`filter-button ${playerStatsFilter === 'apg' ? 'active' : ''}`} onClick={() => setPlayerStatsFilter('apg')}>Assists Per Game</button>
        </div>
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th></th>
                <th>Player</th>
                <th>Team</th>
                <th>Position</th>
                {playerStatsFilter === 'ppg' && <th>PPG</th>}
                {playerStatsFilter === 'rpg' && <th>RPG</th>}
                {playerStatsFilter === 'apg' && <th>APG</th>}
              </tr>
            </thead>
            <tbody>
              {playerStatsList.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.team}</td>
                  <td>{player.position}</td>
                  {playerStatsFilter === 'ppg' && <td>{player.ppg}</td>}
                  {playerStatsFilter === 'rpg' && <td>{player.rpg}</td>}
                  {playerStatsFilter === 'apg' && <td>{player.apg}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTeamStats = () => {
    if (statsLoading) return <div className="loading-message">Loading team statistics...</div>;
    if (!Array.isArray(teamStatsList) || teamStatsList.length === 0) return <div className="no-games-message">No team statistics available.</div>;

    return (
      <div className="team-stats-container">
        <div className="filter-controls">
          <button className={`filter-button ${teamStatsFilter === 'winPct' ? 'active' : ''}`} onClick={() => setTeamStatsFilter('winPct')}>Win Percentage</button>
          <button className={`filter-button ${teamStatsFilter === 'ppg' ? 'active' : ''}`} onClick={() => setTeamStatsFilter('ppg')}>Points Per Game</button>
          <button className={`filter-button ${teamStatsFilter === 'differential' ? 'active' : ''}`} onClick={() => setTeamStatsFilter('differential')}>Point Differential</button>
        </div>
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th></th>
                <th>Team</th>
                {teamStatsFilter === 'winPct' && <><th>W-L</th><th>Win %</th></>}
                {teamStatsFilter === 'ppg' && <th>PPG</th>}
                {teamStatsFilter === 'differential' && <th>Diff</th>}
              </tr>
            </thead>
            <tbody>
              {teamStatsList.map((team, index) => (
                <tr key={team.id}>
                  <td>{index + 1}</td>
                  <td>{team.name}</td>
                  {teamStatsFilter === 'winPct' && <><td>{team.wins}-{team.losses}</td><td>{Math.round(team.winPct * 100)}%</td></>}
                  {teamStatsFilter === 'ppg' && <td>{team.ppg}</td>}
                  {teamStatsFilter === 'differential' && <td>{team.differential}</td>}
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
        <div className={`stats-tab ${activeStatsTab === 'games' ? 'active' : ''}`} onClick={() => setActiveStatsTab('games')}>Games</div>
        <div className={`stats-tab ${activeStatsTab === 'players' ? 'active' : ''}`} onClick={() => setActiveStatsTab('players')}>Players</div>
        <div className={`stats-tab ${activeStatsTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveStatsTab('teams')}>Teams</div>
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
