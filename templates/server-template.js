/*
=====================================================
File: server.js
Module: Authentication & API
Date: [Insert Date]
Author: [Your Name]
Modified: [Latest Modification Date]
Description:
  - Handles user authentication, session management, and database connection.
  - Provides API routes for login, logout, user registration, and session verification.
  - Ensures secure password hashing and session storage.
=====================================================
*/

// Import Dependencies
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ========================== Middleware ==========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ========================== Database Connection ==========================
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'SportsChatDB'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// ========================== API Routes ==========================

/**
 * User Login Route
 * @param {string} username - User's login name
 * @param {string} password - User's password
 * @returns {Object} JSON response (success/failure)
 */
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM Users WHERE Username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        const user = results[0];
        const match = await bcrypt.compare(password, user.PasswordHash);
        
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        req.session.user = { id: user.UserID, username: user.Username };
        res.json({ message: 'Login successful', user: req.session.user });
    });
});

/**
 * User Logout Route
 */
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.json({ message: 'Logged out successfully' });
    });
});

/**
 * Get Current User (Session Check)
 */
app.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }
    res.json({ user: req.session.user });
});

// ========================== Start Server ==========================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
