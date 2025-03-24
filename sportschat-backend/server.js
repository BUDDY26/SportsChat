// Import dependencies
const express = require('express');
const sql = require('mssql'); 
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.NODE_ENV === 'production' 
  ? (process.env.PORT || 8080)  // Use 8080 as default in production
  : 5000;

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
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://sportschatplus.azurewebsites.net'  // Your Azure app URL
        : 'http://localhost:3000',
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

// Database test endpoint
app.get('/api/test-database', async (req, res) => {
    try {
      // Use your existing connection configuration
      console.log('Database test endpoint called');
      
      // Run a simple query to test connection
      const connectionTest = await sql.query`SELECT 1 as connected`;
      console.log('Basic connection test successful');
      
      try {
        // Get game count and date range
        const result = await sql.query`
          SELECT 
            COUNT(*) as gameCount,
            MIN(DatePlayed) as earliestGame,
            MAX(DatePlayed) as latestGame
          FROM games
        `;
        
        console.log('Games query successful:', result.recordset);
        
        // Get recent games
        const recentGames = await sql.query`
          SELECT TOP 5 
            GameID as game_id, 
            Team1ID as team1, 
            Team2ID as team2, 
            ScoreTeam1 as score1, 
            ScoreTeam2 as score2,
            DatePlayed as game_date
          FROM games
          ORDER BY DatePlayed DESC
        `;
        
        console.log('Recent games query successful');
        
        // Return success response
        res.json({
          success: true,
          message: "Successfully connected to database",
          stats: result.recordset[0],
          recentGames: recentGames.recordset
        });
      } catch (specificErr) {
        console.error('Specific query error:', specificErr.message);
        res.status(500).json({
          success: false,
          message: "Database connected but query failed",
          error: specificErr.message
        });
      }
    } catch (err) {
      console.error('Database connection error in test endpoint:', err.message);
      
      // Return error response
      res.status(500).json({
        success: false,
        message: "Failed to connect to database",
        error: err.message
      });
    }
  });

// Root Route
app.get("/", (req, res) => {
    res.send("SportsChat Backend is Running!");
});

app.use(express.static(path.join(__dirname, '../sportschat-frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../sportschat-frontend/build/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });