// templates/user-template.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database'); // Ensure you have a database connection setup

// Get user profile
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM Users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ user: results[0] });
    });
});

// Update user profile
router.put('/:id', (req, res) => {
    const userId = req.params.id;
    const { username, email } = req.body;
    db.query('UPDATE Users SET username = ?, email = ? WHERE id = ?', [username, email, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Profile updated successfully' });
    });
});

module.exports = router;