// Import dependencies
const express = require('express');
const sql = require('mssql'); // Use MSSQL instead of MySQL2
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Configure MSSQL Database Connection
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    }
};

// Connect to MSSQL Database
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to MSSQL database');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}
connectDB();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// User Signup Route
app.post('/signup', async (req, res) => {
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

// User Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await sql.query`SELECT * FROM Users WHERE Username = ${username}`;
        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        const user = result.recordset[0];
        const match = await bcrypt.compare(password, user.PasswordHash);

        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = { id: user.UserID, username: user.Username };
        res.json({ message: 'Login successful', user: req.session.user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User Logout Route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.json({ message: 'Logged out successfully' });
    });
});

// Get Current User (Session Check)
app.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not logged in' });
    }
    res.json({ user: req.session.user });
});

// Root Route
app.get("/", (req, res) => {
    res.send("SportsChat Backend is Running!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
