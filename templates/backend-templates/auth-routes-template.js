// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sql = require('mssql');

// Import middleware if needed
// const auth = require('../middleware/auth');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if username or email already exists
        const check = await sql.query`
            SELECT * FROM Users 
            WHERE Username = ${username} OR Email = ${email}
        `;

        if (check.recordset.length > 0) {
            return res.status(409).json({ message: 'Username or email already in use.' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, CreatedAt)
            VALUES (${username}, ${email}, ${hashedPassword}, GETDATE())
        `;

        res.status(201).json({ message: 'Signup successful.' });
    } catch (err) {
        console.error('Signup failed:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    
    try {
        const result = await sql.query`
            SELECT * FROM Users WHERE Username = ${username}
        `;
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.recordset[0];
        const match = await bcrypt.compare(password, user.PasswordHash);

        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set user session
        req.session.user = { 
            id: user.UserID, 
            username: user.Username,
            email: user.Email
        };
        
        res.json({ 
            message: 'Login successful', 
            user: {
                id: user.UserID,
                username: user.Username,
                email: user.Email
            }
        });
    } catch (err) {
        console.error('Login failed:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / clear session
 * @access  Private
 */
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout failed:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: 'Logged out successfully' });
    });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    try {
        // Check if user exists
        const result = await sql.query`
            SELECT * FROM Users WHERE Email = ${email}
        `;
        
        if (result.recordset.length === 0) {
            // Still return success to prevent email enumeration
            return res.json({ message: 'If your email is registered, you will receive reset instructions.' });
        }
        
        // In a real implementation, you would:
        // 1. Generate a unique token
        // 2. Save it to the database with an expiration
        // 3. Send an email with a reset link
        
        // For this template, we'll just return success
        res.json({ message: 'If your email is registered, you will receive reset instructions.' });
    } catch (err) {
        console.error('Password reset request failed:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;