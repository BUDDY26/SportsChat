// Import dependencies
const express = require('express');
const sql = require('mssql'); 
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
      ? 'https://sportschatplus-ehfub6gedrhyfmbt.centralus-01.azurewebsites.net'
      : 'http://localhost:3000',
  credentials: true
}));

// Disable caching for API routes to ensure fresh data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Expires', '0');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Health check endpoint for Azure
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

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
//app.get("/", (req, res) => {
    //res.send("SportsChat Backend is Running!");
//});

// March Madness API Routes to DashBoard
// Get upcoming games - games that haven't been played yet
app.get('/api/games/upcoming', async (req, res) => {
  try {
    console.log('Fetching upcoming games...');
    
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
        g.LastUpdated as lastUpdated
      FROM Games g WITH (NOLOCK)
      JOIN Teams t1 WITH (NOLOCK) ON g.Team1ID = t1.TeamID
      JOIN Teams t2 WITH (NOLOCK) ON g.Team2ID = t2.TeamID
      WHERE g.ScoreTeam1 = 0 AND g.ScoreTeam2 = 0
        AND g.DatePlayed > GETDATE()
      ORDER BY g.DatePlayed ASC
    `;
    
    console.log(`Found ${result.recordset.length} upcoming games`);
    
    // Format the response to match the frontend expectations
    const formattedGames = result.recordset.map(game => ({
      id: game.id,
      team1: game.team1,
      team2: game.team2,
      team1Id: game.team1Id,
      team2Id: game.team2Id,
      time: new Date(game.gameDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      round: game.round,
      location: game.location,
      spread: "TBD", // Spread isn't in your DB, so we use a placeholder
      lastUpdated: game.lastUpdated
    }));
    
    res.json(formattedGames);
  } catch (err) {
    console.error('Error fetching upcoming games:', err);
    res.status(500).json({ message: 'Failed to fetch upcoming games' });
  }
});

// Get live games - games that have scores but no winner yet
app.get('/api/games/live', async (req, res) => {
  try {
    console.log('Fetching live games...');
    
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
        g.LastUpdated as lastUpdated
      FROM Games g WITH (NOLOCK)
      JOIN Teams t1 WITH (NOLOCK) ON g.Team1ID = t1.TeamID
      JOIN Teams t2 WITH (NOLOCK) ON g.Team2ID = t2.TeamID
      WHERE g.ScoreTeam1 > 0 AND g.ScoreTeam2 > 0 
        AND g.WinnerID IS NULL
      ORDER BY g.LastUpdated DESC
    `;
    
    console.log(`Found ${result.recordset.length} live games`);
    
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
      quarter: 'In Progress',
      lastUpdated: game.lastUpdated
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
    console.log('Fetching recent games...');
    
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
        CASE WHEN g.WinnerID = t1.TeamID THEN t1.TeamName ELSE t2.TeamName END as winnerName,
        g.LastUpdated as lastUpdated
      FROM Games g WITH (NOLOCK)
      JOIN Teams t1 WITH (NOLOCK) ON g.Team1ID = t1.TeamID
      JOIN Teams t2 WITH (NOLOCK) ON g.Team2ID = t2.TeamID
      WHERE g.WinnerID IS NOT NULL
      ORDER BY g.LastUpdated DESC, g.DatePlayed DESC
    `;
    
    console.log(`Found ${result.recordset.length} recent games`);
    
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
      winner: game.winnerName,
      lastUpdated: game.lastUpdated
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

// Create a new open bet
app.post('/api/bets', async (req, res) => {
  if (!req.session.user) {
      return res.status(401).json({ message: 'You must be logged in to create a bet.' });
  }

  const { gameId, teamId, wagerAmount } = req.body;
  const userId = req.session.user.id;

  if (!gameId || !teamId || !wagerAmount) {
      return res.status(400).json({ message: 'Game, team, and wager amount are required.' });
  }

  try {
      const result = await sql.query`
          INSERT INTO Bets (GameID, UserID, TeamID, WagerAmount, BetStatus)
          OUTPUT INSERTED.*
          VALUES (${gameId}, ${userId}, ${teamId}, ${wagerAmount}, 'Open')
      `;

      res.status(201).json(result.recordset[0]);
  } catch (err) {
      console.error('Error creating bet:', err);
      res.status(500).json({ message: 'Failed to create bet.' });
  }
});

// Get all open bets
app.get('/api/bets/open', async (req, res) => {
  try {
      const result = await sql.query`
          SELECT 
              b.BetID as id,
              b.GameID as gameId,
              g.Team1ID, g.Team2ID,
              t1.TeamName as team1,
              t2.TeamName as team2,
              b.TeamID as betOnTeamId,
              bt.TeamName as betOnTeamName,
              b.UserID as creatorId,
              u.Username as creatorUsername,
              b.WagerAmount,
              b.BetStatus
          FROM Bets b
          JOIN Games g ON b.GameID = g.GameID
          JOIN Teams t1 ON g.Team1ID = t1.TeamID
          JOIN Teams t2 ON g.Team2ID = t2.TeamID
          JOIN Teams bt ON b.TeamID = bt.TeamID
          JOIN Users u ON b.UserID = u.UserID
          WHERE b.BetStatus = 'Open'
      `;

      res.json(result.recordset);
  } catch (err) {
      console.error('Error fetching open bets:', err);
      res.status(500).json({ message: 'Failed to fetch open bets.' });
  }
});

// Join an existing open bet
app.post('/api/bets/:id/join', async (req, res) => {
  if (!req.session.user) {
      return res.status(401).json({ message: 'You must be logged in to join a bet.' });
  }

  const { id } = req.params;
  const user2Id = req.session.user.id;

  try {
      // Fetch the bet to check status
      const betResult = await sql.query`
          SELECT * FROM Bets WHERE BetID = ${id}
      `;

      if (betResult.recordset.length === 0) {
          return res.status(404).json({ message: 'Bet not found.' });
      }

      const bet = betResult.recordset[0];

      if (bet.BetStatus !== 'Open') {
          return res.status(400).json({ message: 'Bet is not open for joining.' });
      }

      // Prevent same user joining their own bet
      if (bet.UserID === user2Id) {
          return res.status(400).json({ message: 'You cannot join your own bet.' });
      }

      // Update the bet
      await sql.query`
          UPDATE Bets
          SET User2ID = ${user2Id}, BetStatus = 'Closed'
          WHERE BetID = ${id}
      `;

      res.json({ message: 'Successfully joined the bet.' });
  } catch (err) {
      console.error('Error joining bet:', err);
      res.status(500).json({ message: 'Failed to join bet.' });
  }
});

// Get bets involving the logged-in user
app.get('/api/bets/my', async (req, res) => {
  if (!req.session.user) {
      return res.status(401).json({ message: 'You must be logged in to view your bets.' });
  }

  const userId = req.session.user.id;

  try {
      const result = await sql.query`
          SELECT 
              b.BetID as id,
              b.GameID as gameId,
              g.Team1ID, g.Team2ID,
              t1.TeamName as team1,
              t2.TeamName as team2,
              b.TeamID as betOnTeamId,
              bt.TeamName as betOnTeamName,
              b.UserID as creatorId,
              u1.Username as creatorUsername,
              b.User2ID as joinerId,
              u2.Username as joinerUsername,
              b.WagerAmount,
              b.BetStatus,
              b.WinnerID
          FROM Bets b
          JOIN Games g ON b.GameID = g.GameID
          JOIN Teams t1 ON g.Team1ID = t1.TeamID
          JOIN Teams t2 ON g.Team2ID = t2.TeamID
          JOIN Teams bt ON b.TeamID = bt.TeamID
          LEFT JOIN Users u1 ON b.UserID = u1.UserID
          LEFT JOIN Users u2 ON b.User2ID = u2.UserID
          WHERE b.UserID = ${userId} OR b.User2ID = ${userId}
          ORDER BY b.BetStatus DESC, b.BetID DESC
      `;

      res.json(result.recordset);
  } catch (err) {
      console.error('Error fetching user bets:', err);
      res.status(500).json({ message: 'Failed to fetch your bets.' });
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

// Determine frontend path based on environment
let frontendPath;
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode');
  console.log('Current directory:', __dirname);
  
  // Try the standard path first
  const standardPath = path.join(__dirname, '../sportschat-frontend/build');
  if (fs.existsSync(standardPath)) {
    frontendPath = standardPath;
    console.log('Using standard frontend path:', frontendPath);
  } else {
    // If standard path doesn't exist, try alternative Azure path
    frontendPath = path.join(process.cwd(), 'sportschat-frontend/build');
    console.log('Using alternative frontend path:', frontendPath);
  }
} else {
  // Local development path
  frontendPath = path.join(__dirname, '../sportschat-frontend/build');
}

// Serve static files
app.use(express.static(frontendPath));

// STATS ROUTES

// GET game stats based on filter: highScoring, closeGames, blowouts, or recent 
app.get('/api/stats/games', async (req, res) => {
  const filter = req.query.filter || 'recent';
  let query;

  switch (filter) {
    case 'highScoring':
      query = `
        SELECT TOP 10 
          g.GameID as id, 
          t1.TeamName as team1, 
          t2.TeamName as team2, 
          g.ScoreTeam1 as score1, 
          g.ScoreTeam2 as score2, 
          g.Round as round,
          g.DatePlayed as date,
          (g.ScoreTeam1 + g.ScoreTeam2) as totalScore
        FROM Games g
        JOIN Teams t1 ON g.Team1ID = t1.TeamID
        JOIN Teams t2 ON g.Team2ID = t2.TeamID
        WHERE g.ScoreTeam1 IS NOT NULL AND g.ScoreTeam2 IS NOT NULL
        ORDER BY totalScore DESC
      `;
      break;
    case 'closeGames':
      query = `
        SELECT TOP 10 
          g.GameID as id, 
          t1.TeamName as team1, 
          t2.TeamName as team2, 
          g.ScoreTeam1 as score1, 
          g.ScoreTeam2 as score2, 
          g.Round as round,
          g.DatePlayed as date,
          ABS(g.ScoreTeam1 - g.ScoreTeam2) as scoreDiff
        FROM Games g
        JOIN Teams t1 ON g.Team1ID = t1.TeamID
        JOIN Teams t2 ON g.Team2ID = t2.TeamID
        WHERE g.ScoreTeam1 IS NOT NULL AND g.ScoreTeam2 IS NOT NULL
        ORDER BY scoreDiff ASC
      `;
      break;
    case 'blowouts':
      query = `
        SELECT TOP 10 
          g.GameID as id, 
          t1.TeamName as team1, 
          t2.TeamName as team2, 
          g.ScoreTeam1 as score1, 
          g.ScoreTeam2 as score2, 
          g.Round as round,
          g.DatePlayed as date,
          ABS(g.ScoreTeam1 - g.ScoreTeam2) as scoreDiff
        FROM Games g
        JOIN Teams t1 ON g.Team1ID = t1.TeamID
        JOIN Teams t2 ON g.Team2ID = t2.TeamID
        WHERE g.ScoreTeam1 IS NOT NULL AND g.ScoreTeam2 IS NOT NULL
        ORDER BY scoreDiff DESC
      `;
      break;
    case 'recent':
    default:
      query = `
        SELECT TOP 10 
          g.GameID as id, 
          t1.TeamName as team1, 
          t2.TeamName as team2, 
          g.ScoreTeam1 as score1, 
          g.ScoreTeam2 as score2, 
          g.Round as round,
          g.DatePlayed as date
        FROM Games g
        JOIN Teams t1 ON g.Team1ID = t1.TeamID
        JOIN Teams t2 ON g.Team2ID = t2.TeamID
        WHERE g.ScoreTeam1 IS NOT NULL AND g.ScoreTeam2 IS NOT NULL
        ORDER BY g.DatePlayed DESC
      `;
      break;
  }

  try {
    const result = await sql.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching game stats:', err);
    res.status(500).json({ message: 'Failed to fetch game stats' });
  }
});

// GET player stats by filter: ppg, rpg, or apg
app.get('/api/stats/players', async (req, res) => {
  const filter = req.query.filter || 'ppg';
  let orderByColumn;

  switch (filter) {
    case 'rpg':
      orderByColumn = 'AVG(gs.Rebounds)';
      break;
    case 'apg':
      orderByColumn = 'AVG(gs.Assists)';
      break;
    case 'ppg':
    default:
      orderByColumn = 'AVG(gs.Points)';
      break;
  }

  const query = `
    SELECT TOP 10 
      p.PlayerID AS id,
      p.PlayerName AS name,
      p.Position AS position,
      t.TeamName AS team,
      CAST(AVG(gs.Points) AS DECIMAL(4,1)) AS ppg,
      CAST(AVG(gs.Rebounds) AS DECIMAL(4,1)) AS rpg,
      CAST(AVG(gs.Assists) AS DECIMAL(4,1)) AS apg
    FROM Players p
    JOIN GameStats gs ON p.PlayerID = gs.PlayerID
    JOIN Teams t ON p.TeamID = t.TeamID
    GROUP BY p.PlayerID, p.PlayerName, p.Position, t.TeamName
    ORDER BY ${orderByColumn} DESC
  `;

  try {
    const result = await sql.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching player stats:", err);
    res.status(500).json({ message: "Failed to fetch player stats" });
  }
});

// GET team stats by filter: winPct, ppg, or differential
app.get('/api/stats/teams', async (req, res) => {
  const filter = req.query.filter || 'winPct';

  let orderByColumn;
  switch (filter) {
    case 'ppg':
      orderByColumn = `
        AVG(CASE 
          WHEN t.TeamID = g.Team1ID THEN g.ScoreTeam1 
          WHEN t.TeamID = g.Team2ID THEN g.ScoreTeam2 
        END)
      `;
      break;
    case 'differential':
      orderByColumn = `
        AVG(CASE 
          WHEN t.TeamID = g.Team1ID THEN g.ScoreTeam1 - g.ScoreTeam2 
          WHEN t.TeamID = g.Team2ID THEN g.ScoreTeam2 - g.ScoreTeam1 
        END)
      `;
      break;
    case 'winPct':
    default:
      orderByColumn = `
        1.0 * SUM(CASE 
          WHEN (t.TeamID = g.Team1ID AND g.ScoreTeam1 > g.ScoreTeam2) 
            OR (t.TeamID = g.Team2ID AND g.ScoreTeam2 > g.ScoreTeam1) 
          THEN 1 ELSE 0 END) / COUNT(*)
      `;
      break;
  }

  const query = `
    SELECT 
      t.TeamID AS id,
      t.TeamName AS name,
      COUNT(*) AS gamesPlayed,
      SUM(CASE 
        WHEN (t.TeamID = g.Team1ID AND g.ScoreTeam1 > g.ScoreTeam2) 
          OR (t.TeamID = g.Team2ID AND g.ScoreTeam2 > g.ScoreTeam1) 
        THEN 1 ELSE 0 END) AS wins,
      SUM(CASE 
        WHEN (t.TeamID = g.Team1ID AND g.ScoreTeam1 < g.ScoreTeam2) 
          OR (t.TeamID = g.Team2ID AND g.ScoreTeam2 < g.ScoreTeam1) 
        THEN 1 ELSE 0 END) AS losses,
      CAST(SUM(CASE 
        WHEN (t.TeamID = g.Team1ID AND g.ScoreTeam1 > g.ScoreTeam2) 
          OR (t.TeamID = g.Team2ID AND g.ScoreTeam2 > g.ScoreTeam1) 
        THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS DECIMAL(4, 3)) AS winPct,
      CAST(AVG(CASE 
        WHEN t.TeamID = g.Team1ID THEN g.ScoreTeam1 
        WHEN t.TeamID = g.Team2ID THEN g.ScoreTeam2 
      END) AS DECIMAL(4,1)) AS ppg,
      CAST(AVG(CASE 
        WHEN t.TeamID = g.Team1ID THEN g.ScoreTeam2 
        WHEN t.TeamID = g.Team2ID THEN g.ScoreTeam1 
      END) AS DECIMAL(4,1)) AS oppg,
      CAST(AVG(CASE 
        WHEN t.TeamID = g.Team1ID THEN g.ScoreTeam1 - g.ScoreTeam2 
        WHEN t.TeamID = g.Team2ID THEN g.ScoreTeam2 - g.ScoreTeam1 
      END) AS DECIMAL(4,1)) AS differential
    FROM Teams t
    JOIN Games g ON t.TeamID = g.Team1ID OR t.TeamID = g.Team2ID
    WHERE g.ScoreTeam1 IS NOT NULL AND g.ScoreTeam2 IS NOT NULL
    GROUP BY t.TeamID, t.TeamName
    ORDER BY ${orderByColumn} DESC
  `;

  try {
    const result = await sql.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching team stats:", err);
    res.status(500).json({ message: "Failed to fetch team stats" });
  }
});


// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

// GET global chat messages
app.get('/api/chat/global', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        m.MessageID as id,
        u.Username as user,
        m.Message as message,
        FORMAT(m.Timestamp, 'MMM dd, yyyy h:mm tt') as timestamp
      FROM GlobalChatMessages m
      JOIN Users u ON m.UserID = u.UserID
      ORDER BY m.Timestamp ASC
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching global chat messages:", err);
    res.status(500).json({ message: 'Failed to fetch global chat messages' });
  }
});

// POST a new global chat message
app.post('/api/chat/global', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to chat' });
  }

  const { message } = req.body;
  const userId = req.session.user.id;

  if (!message) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  try {
    const result = await sql.query`
      INSERT INTO GlobalChatMessages (UserID, Message, Timestamp)
      OUTPUT INSERTED.MessageID, INSERTED.Timestamp
      VALUES (${userId}, ${message}, GETDATE())
    `;

    const newMessage = {
      id: result.recordset[0].MessageID,
      user: req.session.user.username,
      message,
      timestamp: new Date(result.recordset[0].Timestamp).toLocaleString()
    };

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error sending global chat message:", err);
    res.status(500).json({ message: 'Failed to send global chat message' });
  }
});