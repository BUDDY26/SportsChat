import axios from 'axios';

// Set up the API instance with base URL and credentials enabled
const API = axios.create({
    baseURL: 'http://localhost:5000',  // This must match the backend server URL
    withCredentials: true, // Allows cookies to be sent for session authentication
});

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

export default API;
