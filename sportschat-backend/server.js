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

// March Madness API Routes to DashBoard
// Get upcoming games - games that haven't been played yet
app.get('/api/games/upcoming', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        g.GameID as id,
        t1.TeamName as team1,
        t2.TeamName as team2,
        g.Team1ID as team1Id,
        g.Team2ID as team2Id,
        g.DatePlayed as gameDate,
        g.Round as round,
        g.Location as location
      FROM Games g
      JOIN Teams t1 ON g.Team1ID = t1.TeamID
      JOIN Teams t2 ON g.Team2ID = t2.TeamID
      WHERE g.DatePlayed > GETDATE()
      ORDER BY g.DatePlayed ASC
    `;
    
    // Format the response to match the frontend expectations
    const formattedGames = result.recordset.map(game => ({
      id: game.id,
      team1: game.team1,
      team2: game.team2,
      team1Id: game.team1Id,
      team2Id: game.team2Id,
      time: new Date(game.gameDate).toLocaleString(),
      round: game.round,
      location: game.location,
      spread: "TBD" // Spread isn't in your DB, so we use a placeholder
    }));
    
    res.json(formattedGames);
  } catch (err) {
    console.error('Error fetching upcoming games:', err);
    res.status(500).json({ message: 'Failed to fetch upcoming games' });
  }
});

// Get live games - games happening today that don't have a winner yet
app.get('/api/games/live', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Get current date in 'YYYY-MM-DD' format
    
    const result = await sql.query`
      SELECT 
        g.GameID as id,
        t1.TeamName as team1,
        t2.TeamName as team2,
        g.Team1ID as team1Id,
        g.Team2ID as team2Id,
        g.DatePlayed as gameDate,
        g.Round as round,
        g.Location as location,
        g.ScoreTeam1 as score1,
        g.ScoreTeam2 as score2
      FROM Games g
      JOIN Teams t1 ON g.Team1ID = t1.TeamID
      JOIN Teams t2 ON g.Team2ID = t2.TeamID
      WHERE CONVERT(date, g.DatePlayed) = ${today} 
        AND g.WinnerID IS NULL 
      ORDER BY g.LastUpdated DESC
    `;
    
    // Format the response to match the frontend expectations
    const formattedGames = result.recordset.map(game => ({
      id: game.id,
      team1: game.team1,
      team2: game.team2,
      team1Id: game.team1Id,
      team2Id: game.team2Id,
      time: 'LIVE',
      round: game.round,
      location: game.location,
      score1: game.score1 || 0,
      score2: game.score2 || 0,
      quarter: 'In Progress'
    }));
    
    res.json(formattedGames);
  } catch (err) {
    console.error('Error fetching live games:', err);
    res.status(500).json({ message: 'Failed to fetch live games' });
  }
});

// Get recent games - completed games with a winner
app.get('/api/games/recent', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT TOP 10
        g.GameID as id,
        t1.TeamName as team1,
        t2.TeamName as team2,
        g.Team1ID as team1Id,
        g.Team2ID as team2Id,
        g.DatePlayed as gameDate,
        g.Round as round,
        g.Location as location,
        g.ScoreTeam1 as score1,
        g.ScoreTeam2 as score2,
        winner.TeamName as winnerName
      FROM Games g
      JOIN Teams t1 ON g.Team1ID = t1.TeamID
      JOIN Teams t2 ON g.Team2ID = t2.TeamID
      LEFT JOIN Teams winner ON g.WinnerID = winner.TeamID
      WHERE g.WinnerID IS NOT NULL
      ORDER BY g.DatePlayed DESC
    `;
    
    // Format the response to match the frontend expectations
    const formattedGames = result.recordset.map(game => ({
      id: game.id,
      team1: game.team1,
      team2: game.team2,
      team1Id: game.team1Id,
      team2Id: game.team2Id,
      time: 'Final',
      round: game.round,
      location: game.location,
      score1: game.score1 || 0,
      score2: game.score2 || 0,
      winner: game.winnerName
    }));
    
    res.json(formattedGames);
  } catch (err) {
    console.error('Error fetching recent games:', err);
    res.status(500).json({ message: 'Failed to fetch recent games' });
  }
});

// Get single game details
app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await sql.query`
      SELECT 
        g.GameID as id,
        t1.TeamName as team1,
        t2.TeamName as team2,
        g.Team1ID as team1Id,
        g.Team2ID as team2Id,
        g.DatePlayed as gameDate,
        g.Round as round,
        g.Location as location,
        g.ScoreTeam1 as score1,
        g.ScoreTeam2 as score2,
        g.WinnerID as winnerId,
        g.LastUpdated as lastUpdated
      FROM Games g
      JOIN Teams t1 ON g.Team1ID = t1.TeamID
      JOIN Teams t2 ON g.Team2ID = t2.TeamID
      WHERE g.GameID = ${id}
    `;
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const game = result.recordset[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Determine the game status
    let timeStatus;
    if (new Date(game.gameDate).toISOString().split('T')[0] === today && !game.winnerId) {
      timeStatus = 'LIVE';
    } else if (game.winnerId) {
      timeStatus = 'Final';
    } else {
      timeStatus = new Date(game.gameDate).toLocaleString();
    }
    
    // Format the response
    const formattedGame = {
      id: game.id,
      team1: game.team1,
      team2: game.team2,
      team1Id: game.team1Id,
      team2Id: game.team2Id,
      time: timeStatus,
      round: game.round,
      location: game.location,
      score1: game.score1 || 0,
      score2: game.score2 || 0,
      winnerId: game.winnerId,
      lastUpdated: game.lastUpdated
    };
    
    res.json(formattedGame);
  } catch (err) {
    console.error('Error fetching game details:', err);
    res.status(500).json({ message: 'Failed to fetch game details' });
  }
});

// Get chat messages for a game
app.get('/api/games/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if we have a chat room for this game
    const chatRoomResult = await sql.query`
      SELECT RoomID
      FROM ChatRooms
      WHERE GameID = ${id}
      AND RoomType = 'Game'
    `;
    
    if (chatRoomResult.recordset.length === 0) {
      return res.json([]); // No chat room exists yet
    }
    
    const roomId = chatRoomResult.recordset[0].RoomID;
    
    // Get messages for this chat room
    const result = await sql.query`
      SELECT 
        m.MessageID as id,
        u.Username as user,
        m.Message as message,
        FORMAT(m.Timestamp, 'MMM dd, yyyy h:mm tt') as timestamp
      FROM ChatMessages m
      JOIN Users u ON m.UserID = u.UserID
      WHERE m.RoomID = ${roomId}
      ORDER BY m.Timestamp ASC
    `;
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ message: 'Failed to fetch chat messages' });
  }
});

// Post a new chat message
app.post('/api/games/:id/chat', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to chat' });
  }
  
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.session.user.id;
    
    if (!message) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    // First, check if a chat room exists for this game
    let roomId;
    const chatRoomResult = await sql.query`
      SELECT RoomID
      FROM ChatRooms
      WHERE GameID = ${id}
      AND RoomType = 'Game'
    `;
    
    if (chatRoomResult.recordset.length === 0) {
      // Create a new chat room for this game
      const gameResult = await sql.query`
        SELECT Team1ID, Team2ID FROM Games WHERE GameID = ${id}
      `;
      
      if (gameResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      const game = gameResult.recordset[0];
      
      // Generate room name based on team IDs
      const roomNameResult = await sql.query`
        SELECT 
          (SELECT TeamName FROM Teams WHERE TeamID = ${game.Team1ID})
          + ' vs ' +
          (SELECT TeamName FROM Teams WHERE TeamID = ${game.Team2ID})
          AS RoomName
      `;
      
      const roomName = roomNameResult.recordset[0].RoomName;
      
      // Create the chat room
      const newRoomResult = await sql.query`
        INSERT INTO ChatRooms (RoomName, RoomType, GameID, CreatedAt)
        OUTPUT INSERTED.RoomID
        VALUES (${roomName}, 'Game', ${id}, GETDATE())
      `;
      
      roomId = newRoomResult.recordset[0].RoomID;
    } else {
      roomId = chatRoomResult.recordset[0].RoomID;
    }
    
    // Insert the message
    await sql.query`
      INSERT INTO ChatMessages (RoomID, UserID, Message, Timestamp)
      VALUES (${roomId}, ${userId}, ${message}, GETDATE())
    `;
    
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error sending chat message:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Place a bet on a game
app.post('/api/games/:id/bet', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to place bets' });
  }
  
  try {
    const { id } = req.params;
    const { teamId, amount } = req.body;
    const userId = req.session.user.id;
    
    if (!teamId || !amount) {
      return res.status(400).json({ message: 'Team and amount are required' });
    }
    
    // Check if game exists and hasn't started yet
    const gameResult = await sql.query`
      SELECT 
        GameID, 
        DatePlayed,
        ScoreTeam1,
        ScoreTeam2
      FROM Games
      WHERE GameID = ${id}
    `;
    
    if (gameResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const game = gameResult.recordset[0];
    
    // Don't allow bets on games that have already started or ended
    if (new Date(game.DatePlayed) < new Date() || 
        (game.ScoreTeam1 > 0 || game.ScoreTeam2 > 0)) {
      return res.status(400).json({ message: 'Cannot bet on games that have already started' });
    }
    
    // Find another user as User2 (for demo purposes - in a real app you'd have opponents)
    const otherUserResult = await sql.query`
      SELECT TOP 1 UserID 
      FROM Users 
      WHERE UserID != ${userId}
      ORDER BY NEWID()
    `;
    
    let user2Id = null;
    if (otherUserResult.recordset.length > 0) {
      user2Id = otherUserResult.recordset[0].UserID;
    }
    
    // Record the bet
    await sql.query`
      INSERT INTO Bets (GameID, UserID, User2ID, WagerAmount, BetStatus, CreatedAt)
      VALUES (${id}, ${userId}, ${user2Id}, ${amount}, 'Pending', GETDATE())
    `;
    
    res.status(201).json({ message: 'Bet placed successfully' });
  } catch (err) {
    console.error('Error placing bet:', err);
    res.status(500).json({ message: 'Failed to place bet' });
  }
});

// Get user's bets
app.get('/api/user/bets', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to view bets' });
  }
  
  try {
    const userId = req.session.user.id;
    
    const result = await sql.query`
      SELECT 
        b.BetID as id,
        b.GameID as gameId,
        g.Team1ID as team1Id,
        g.Team2ID as team2Id,
        t1.TeamName as team1,
        t2.TeamName as team2,
        b.WagerAmount as amount,
        b.BetStatus as status,
        b.WinnerID as winnerId,
        FORMAT(b.CreatedAt, 'MMM dd, yyyy h:mm tt') as placedAt,
        FORMAT(b.CompletedAt, 'MMM dd, yyyy h:mm tt') as completedAt,
        g.ScoreTeam1 as score1,
        g.ScoreTeam2 as score2
      FROM Bets b
      JOIN Games g ON b.GameID = g.GameID
      JOIN Teams t1 ON g.Team1ID = t1.TeamID
      JOIN Teams t2 ON g.Team2ID = t2.TeamID
      WHERE b.UserID = ${userId}
      ORDER BY b.CreatedAt DESC
    `;
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching user bets:', err);
    res.status(500).json({ message: 'Failed to fetch bet information' });
  }
});

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        TeamID as id,
        TeamName as name,
        CoachName as coach,
        Conference as conference,
        Wins as wins,
        Losses as losses,
        Seed as seed
      FROM Teams
      ORDER BY TeamName
    `;
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

// Get team details
app.get('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await sql.query`
      SELECT 
        TeamID as id,
        TeamName as name,
        CoachName as coach,
        Conference as conference,
        Wins as wins,
        Losses as losses,
        Seed as seed,
        LastUpdated as lastUpdated
      FROM Teams
      WHERE TeamID = ${id}
    `;
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const team = result.recordset[0];
    
    // Get the team's games
    const gamesResult = await sql.query`
      SELECT 
        g.GameID as id,
        g.Round as round,
        g.DatePlayed as date,
        g.Location as location,
        g.ScoreTeam1 as score1,
        g.ScoreTeam2 as score2,
        t1.TeamName as team1,
        t2.TeamName as team2,
        g.WinnerID as winnerId
      FROM Games g
      JOIN Teams t1 ON g.Team1ID = t1.TeamID
      JOIN Teams t2 ON g.Team2ID = t2.TeamID
      WHERE g.Team1ID = ${id} OR g.Team2ID = ${id}
      ORDER BY g.DatePlayed
    `;
    
    team.games = gamesResult.recordset;
    
    // Get the team's players
    const playersResult = await sql.query`
      SELECT 
        PlayerID as id,
        PlayerName as name,
        Position as position
      FROM Players
      WHERE TeamID = ${id}
      ORDER BY PlayerName
    `;
    
    team.players = playersResult.recordset;
    
    res.json(team);
  } catch (err) {
    console.error('Error fetching team details:', err);
    res.status(500).json({ message: 'Failed to fetch team details' });
  }
});

// Get players for a team
app.get('/api/teams/:id/players', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await sql.query`
      SELECT 
        PlayerID as id,
        PlayerName as name,
        Position as position
      FROM Players
      WHERE TeamID = ${id}
      ORDER BY PlayerName
    `;
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching team players:', err);
    res.status(500).json({ message: 'Failed to fetch team players' });
  }
});

// Get bracket seeding information
app.get('/api/bracket', async (req, res) => {
  try {
    const seedingResult = await sql.query`
      SELECT 
        b.TeamID as teamId,
        t.TeamName as teamName,
        b.Seed as seed
      FROM Bracket_Seeding b
      JOIN Teams t ON b.TeamID = t.TeamID
      ORDER BY b.Seed
    `;
    
    // Get completed game results
    const gamesResult = await sql.query`
      SELECT 
        GameID as id,
        Round as round,
        Team1ID as team1Id,
        Team2ID as team2Id,
        WinnerID as winnerId,
        ScoreTeam1 as score1,
        ScoreTeam2 as score2
      FROM Games
      WHERE WinnerID IS NOT NULL
      ORDER BY Round, GameID
    `;
    
    const response = {
      teams: seedingResult.recordset,
      games: gamesResult.recordset
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching bracket information:', err);
    res.status(500).json({ message: 'Failed to fetch bracket information' });
  }
});

app.use(express.static(path.join(__dirname, '../sportschat-frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../sportschat-frontend/build/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });