import axios from 'axios';

// Set up the API instance with base URL and credentials enabled
const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
      ? '' // Empty string for relative URLs in production
      : 'http://localhost:5000',  // Use localhost for development
  withCredentials: true, // Allows cookies to be sent for session authentication
});

// Function to handle user signup
export const signup = async (username, email, password) => {
    try {
        const response = await API.post('/signup', { username, email, password });
        return response.data; // Returns success message
    } catch (error) {
        console.error('Signup error:', error.response?.data || error.message);
        throw error; // Propagate error to handle it in the frontend
    }
};

// Function to handle user login
export const login = async (username, password) => {
    try {
        const response = await API.post('/login', { username, password });
        return response.data; // Returns success message and user session details
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error; // Propagate error to handle it in the frontend
    }
};

// Function to handle user logout
export const logout = async () => {
    try {
        await API.post('/logout');
    } catch (error) {
        console.error('Logout error:', error.response?.data || error.message);
        throw error;
    }
};

// Function to check if a user is logged in (session check)
export const getCurrentUser = async () => {
    try {
        const response = await API.get('/me');
        return response.data; // Returns user session details if logged in
    } catch (error) {
        console.error('Session check failed:', error.response?.data || error.message);
        throw error;
    }
};

// Create a new bet
export const createBet = async (gameId, teamId, wagerAmount) => {
  const response = await API.post('/api/bets', { gameId, teamId, wagerAmount });
  return response.data;
};

// Get open bets
export const getOpenBets = async () => {
  const response = await API.get('/api/bets/open');
  return response.data;
};

// Join a bet
export const joinBet = async (betId) => {
  const response = await API.post(`/api/bets/${betId}/join`);
  return response.data;
};

// Get my bets
export const getMyBets = async () => {
  const response = await API.get('/api/bets/my');
  return response.data;
};

// Update games for dropdown menu
export const getGames = async () => {
  const response = await API.get('/api/games');
  return response.data;
};

// Update teams for dropdown menu
export const getTeams = async () => {
  const response = await API.get('/api/teams');
  return response.data;
};

// Get game statistics
export const getGameStats = async (filter = 'recent') => {
  try {
    const response = await API.get(`/api/stats/games?filter=${filter}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching game stats:', error);
    throw error;
  }
};

// Get player statistics
export const getPlayerStats = async (filter = 'ppg') => {
  try {
    const response = await API.get(`/api/stats/players?filter=${filter}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }
};

// Get team statistics
export const getTeamStats = async (filter = 'winPct') => {
  try {
    const response = await API.get(`/api/stats/teams?filter=${filter}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team stats:', error);
    throw error;
  }
};

export default API;