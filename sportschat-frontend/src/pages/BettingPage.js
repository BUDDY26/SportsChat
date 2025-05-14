import React, { useEffect, useState } from 'react';
import {
    createBet,
    getOpenBets,
    joinBet,
    getMyBets,
    getGames,
    getTeams
} from '../services/api';

const BettingPage = ({ user }) => {
    const [selectedGame, setSelectedGame] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [wagerAmount, setWagerAmount] = useState('');
    const [openBets, setOpenBets] = useState([]);
    const [myBets, setMyBets] = useState([]);
    const [games, setGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBets = async () => {
        try {
            setLoading(true);
            const open = await getOpenBets();
            const mine = await getMyBets();
            setOpenBets(open);
            setMyBets(mine);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGamesAndTeams = async () => {
        try {
            const gameList = await getGames();
            const teamList = await getTeams();
            setGames(gameList);
            setTeams(teamList);
        } catch (err) {
            console.error('Error fetching games or teams', err);
        }
    };

    useEffect(() => {
        fetchBets();
        fetchGamesAndTeams();
    }, []);

    const handleCreateBet = async (e) => {
        e.preventDefault();
        if (!selectedGame || !selectedTeam || !wagerAmount) {
            alert("Please select a game, team, and wager amount.");
            return;
        }
        try {
            await createBet(selectedGame, selectedTeam, wagerAmount);
            alert('Bet created!');
            setSelectedGame('');
            setSelectedTeam('');
            setWagerAmount('');
            fetchBets();
        } catch (err) {
            alert('Failed to create bet.');
            console.error(err);
        }
    };

    const handleJoinBet = async (betId) => {
        try {
            await joinBet(betId);
            alert('Joined bet!');
            fetchBets();
        } catch (err) {
            alert('Failed to join bet.');
            console.error(err);
        }
    };

    return (
        <div>
            <form className="bet-form" onSubmit={handleCreateBet}>
                <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                >
                    <option value="">Select Game</option>
                    {games.map((game) => (
                        <option key={game.GameID} value={game.GameID}>
                            {game.Team1Name} vs {game.Team2Name} (Game #{game.GameID})
                        </option>
                    ))}
                </select>

                <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    disabled={!selectedGame}
                >
                    <option value="">Select Team</option>
                    {selectedGame && (
                        teams
                            .filter(team =>
                                games.find(g => g.GameID === parseInt(selectedGame)) &&
                                (team.TeamID === games.find(g => g.GameID === parseInt(selectedGame))?.Team1ID ||
                                 team.TeamID === games.find(g => g.GameID === parseInt(selectedGame))?.Team2ID)
                            )
                            .map((team) => (
                                <option key={team.TeamID} value={team.TeamID}>
                                    {team.TeamName} (ID: {team.TeamID})
                                </option>
                            ))
                    )}
                </select>

                <input
                    type="number"
                    placeholder="Wager Amount"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                />
                <button type="submit">Create Bet</button>
            </form>

            <div className="bet-section">
                <h3>Open Bets</h3>
                {loading ? (
                    <p>Loading open bets...</p>
                ) : openBets.length === 0 ? (
                    <p>No open bets available.</p>
                ) : (
                    openBets.map(bet => (
                        <div key={bet.id} className="bet-card">
                            <div className="bet-card-info">
                                <strong>{bet.creatorUsername}</strong> bet on <strong>{bet.betOnTeamName}</strong> for <strong>{bet.wagerAmount}</strong> coins.
                            </div>
                            <button onClick={() => handleJoinBet(bet.id)}>Join Bet</button>
                        </div>
                    ))
                )}
            </div>

            <div className="bet-section">
                <h3>My Bets</h3>
                {loading ? (
                    <p>Loading your bets...</p>
                ) : myBets.length === 0 ? (
                    <p>You have no bets yet.</p>
                ) : (
                    myBets.map(bet => (
                        <div key={bet.id} className="my-bet-card">
                            <div>
                                <strong>Game:</strong> {bet.team1} vs {bet.team2}
                            </div>
                            <div>
                                <strong>Your bet:</strong> {bet.betOnTeamName} ({bet.wagerAmount} coins)
                            </div>
                            <div className="bet-status">
                                Status: {bet.BetStatus}
                            </div>
                            {bet.WinnerID && (
                                <div>
                                    <strong>Winner:</strong> {bet.WinnerID === user?.id ? 'You' : 'Opponent'}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BettingPage;