require("dotenv").config();

const axios = require("axios");
const sql = require("mssql");

// Azure SQL Configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

// Set the update interval (5 minutes = 300000 milliseconds)
const UPDATE_INTERVAL_MS = 5 * 60 * 1000;

// NCAA API URLs
const NCAA_API_BASE = "https://ncaa-api.henrygd.me";
const NCAA_API_SCOREBOARD = `${NCAA_API_BASE}/scoreboard/basketball-men/d1/march-madness`;

// Helper function to convert API position to database-acceptable position
function translatePosition(apiPosition) {
  // First, check what's null or empty
  if (!apiPosition) return '';
  
  // Map API positions to database acceptable positions
  const positionMap = {
    'F': 'Forward',
    'G': 'Guard',
    'C': 'Center',
    'F-C': 'Center',  // Default to Center for mixed positions
    'G-F': 'Guard',   // Default to Guard for mixed positions
    'F/C': 'Center',
    'G/F': 'Guard',
    'C/F': 'Center'
  };
  
  return positionMap[apiPosition] || '';
}

// Helper function to parse minutes played into integer minutes
function parseMinutes(minutesStr) {
  try {
    if (!minutesStr) return 0;
    if (typeof minutesStr === 'number') return Math.round(minutesStr);
    
    // Parse format like "12:34" into minutes
    const parts = minutesStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) + Math.round(parseInt(parts[1]) / 60);
    }
    return parseInt(minutesStr) || 0;
  } catch (error) {
    console.log(`Error parsing minutes: ${minutesStr}`, error.message);
    return 0;
  }
}

// Check if game needs updating based on timestamp and scores
async function shouldUpdateGame(pool, gameID, team1Score, team2Score) {
  try {
    // Get the last update time from the database
    const result = await pool.request()
      .input('gameID', sql.Int, gameID)
      .query('SELECT LastUpdated, ScoreTeam1, ScoreTeam2 FROM Games WHERE GameID = @gameID');
    
    if (result.recordset.length === 0) {
      // Game not found, should update
      return true;
    }
    
    const lastUpdatedInDB = new Date(result.recordset[0].LastUpdated);
    const score1InDB = result.recordset[0].ScoreTeam1;
    const score2InDB = result.recordset[0].ScoreTeam2;
    
    // If scores have changed, update
    if (team1Score !== score1InDB || team2Score !== score2InDB) {
      return true;
    }
    
    // If more than 5 minutes has passed since last update, update it
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    if (lastUpdatedInDB < fiveMinutesAgo) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking if game ${gameID} needs update:`, error.message);
    // Default to updating if we can't determine
    return true;
  }
}

// Function to test database connection
async function testDatabaseConnection() {
  console.log("Testing database connection with these parameters:");
  console.log("Server:", dbConfig.server);
  console.log("Database:", dbConfig.database);
  console.log("User:", dbConfig.user);
  console.log("Port:", dbConfig.port);
  console.log("Encryption:", dbConfig.options.encrypt);
  
  try {
    console.log("Attempting to connect to database...");
    const pool = new sql.ConnectionPool(dbConfig);
    
    pool.on('error', err => {
      console.error('SQL Pool Error:', err);
    });
    
    await pool.connect();
    console.log("Successfully connected to database!");
    await pool.close();
    console.log("Connection closed successfully");
    return true;
  } catch (error) {
    console.error("Database connection test failed with error:", error);
    console.error("Error message:", error.message);
    return false;
  }
}

// Function to get team ID from name (or create if doesn't exist)
async function getOrCreateTeamID(pool, teamName, teamSeed, conference) {
  if (!teamName || teamName === "Unknown Team") {
    console.log(`Skipping invalid team name: "${teamName}"`);
    return null;
  }

  try {
    // Try to find existing team
    const teamResult = await pool.request()
      .input('teamName', sql.NVarChar, teamName)
      .query('SELECT TeamID FROM Teams WHERE TeamName = @teamName');
    
    if (teamResult.recordset.length > 0) {
      console.log(`Found existing team "${teamName}" with ID ${teamResult.recordset[0].TeamID}`);
      return teamResult.recordset[0].TeamID;
    }
    
    // Team doesn't exist, create it
    console.log(`Creating new team: "${teamName}"`);
    const insertResult = await pool.request()
      .input('teamName', sql.NVarChar, teamName)
      .input('coachName', sql.NVarChar, '') // Default empty coach name
      .input('conference', sql.NVarChar, conference || '')
      .input('wins', sql.Int, 0)
      .input('losses', sql.Int, 0)
      .input('seed', sql.Int, teamSeed ? parseInt(teamSeed) : null)
      .input('lastUpdated', sql.DateTime, new Date())
      .query(`
        INSERT INTO Teams (TeamName, CoachName, Conference, Wins, Losses, Seed, LastUpdated)
        OUTPUT INSERTED.TeamID
        VALUES (@teamName, @coachName, @conference, @wins, @losses, @seed, @lastUpdated)
      `);
    
    console.log(`Created new team "${teamName}" with ID ${insertResult.recordset[0].TeamID}`);
    return insertResult.recordset[0].TeamID;
  } catch (error) {
    console.error(`Error getting/creating team "${teamName}":`, error.message);
    return null;
  }
}

// Function to get or create player
async function getOrCreatePlayerID(pool, firstName, lastName, teamID, apiPosition = '') {
  if ((!firstName && !lastName) || !teamID) {
    console.log(`Skipping invalid player: "${firstName} ${lastName}" for team ID ${teamID}`);
    return null;
  }

  const playerName = `${firstName || ''} ${lastName || ''}`.trim();
  // Convert API position to database acceptable value
  const position = translatePosition(apiPosition);
  
  try {
    // Try to find existing player
    const playerResult = await pool.request()
      .input('playerName', sql.NVarChar, playerName)
      .input('teamID', sql.Int, teamID)
      .query('SELECT PlayerID FROM Players WHERE PlayerName = @playerName AND TeamID = @teamID');
    
    if (playerResult.recordset.length > 0) {
      console.log(`Found existing player "${playerName}" with ID ${playerResult.recordset[0].PlayerID}`);
      return playerResult.recordset[0].PlayerID;
    }
    
    // Player doesn't exist, create it
    console.log(`Creating new player: "${playerName}" for team ID ${teamID} with position "${position}"`);
    const insertResult = await pool.request()
      .input('playerName', sql.NVarChar, playerName)
      .input('teamID', sql.Int, teamID)
      .input('position', sql.NVarChar, position)
      .query(`
        INSERT INTO Players (PlayerName, TeamID, Position)
        OUTPUT INSERTED.PlayerID
        VALUES (@playerName, @teamID, @position)
      `);
    
    console.log(`Created new player "${playerName}" with ID ${insertResult.recordset[0].PlayerID}`);
    return insertResult.recordset[0].PlayerID;
  } catch (error) {
    console.error(`Error getting/creating player "${playerName}":`, error.message);
    return null;
  }
}

// Function to insert or update player stats
async function savePlayerStats(pool, gameID, playerID, stats) {
  try {
    // Check if stat already exists for this player and game
    const existingStatResult = await pool.request()
      .input('gameID', sql.Int, gameID)
      .input('playerID', sql.Int, playerID)
      .query('SELECT StatID FROM GameStats WHERE GameID = @gameID AND PlayerID = @playerID');
    
    const points = stats.points || 0;
    const rebounds = stats.rebounds || 0;
    const assists = stats.assists || 0;
    const steals = stats.steals || 0;
    const blocks = stats.blocks || 0;
    const minutesPlayed = stats.minutesPlayed || 0;
    
    if (existingStatResult.recordset.length > 0) {
      // Update existing stat
      const statID = existingStatResult.recordset[0].StatID;
      await pool.request()
        .input('statID', sql.Int, statID)
        .input('points', sql.Int, points)
        .input('rebounds', sql.Int, rebounds)
        .input('assists', sql.Int, assists)
        .input('steals', sql.Int, steals)
        .input('blocks', sql.Int, blocks)
        .input('minutesPlayed', sql.Int, minutesPlayed)
        .query(`
          UPDATE GameStats
          SET 
            Points = @points,
            Rebounds = @rebounds,
            Assists = @assists,
            Steals = @steals,
            Blocks = @blocks,
            MinutesPlayed = @minutesPlayed
          WHERE StatID = @statID
        `);
      console.log(`Updated stats for player ID ${playerID} in game ID ${gameID}`);
    } else {
      // Insert new stat
      await pool.request()
        .input('gameID', sql.Int, gameID)
        .input('playerID', sql.Int, playerID)
        .input('points', sql.Int, points)
        .input('rebounds', sql.Int, rebounds)
        .input('assists', sql.Int, assists)
        .input('steals', sql.Int, steals)
        .input('blocks', sql.Int, blocks)
        .input('minutesPlayed', sql.Int, minutesPlayed)
        .query(`
          INSERT INTO GameStats (GameID, PlayerID, Points, Rebounds, Assists, Steals, Blocks, MinutesPlayed)
          VALUES (@gameID, @playerID, @points, @rebounds, @assists, @steals, @blocks, @minutesPlayed)
        `);
      console.log(`Inserted stats for player ID ${playerID} in game ID ${gameID}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving player stats for player ${playerID} in game ${gameID}:`, error.message);
    return false;
  }
}

// Function to fetch boxscore/player stats for a game
async function fetchGameBoxscore(gameID, gameURL) {
  try {
    // Construct boxscore URL from game URL
    if (!gameURL) {
      console.log(`No URL provided for game ID ${gameID}`);
      return null;
    }
    
    const boxscoreURL = `${NCAA_API_BASE}${gameURL}/boxscore`;
    console.log(`Fetching boxscore from: ${boxscoreURL}`);
    
    const response = await axios.get(boxscoreURL);
    
    if (!response.data) {
      console.log(`No data returned for boxscore of game ${gameID}`);
      return null;
    }
    
    return response.data;
  } catch (error) {
    // Don't treat 404 errors as critical, just note that stats aren't available yet
    if (error.response && error.response.status === 404) {
      console.log(`Boxscore not available yet for game ${gameID} (404 Not Found)`);
    } else {
      console.error(`Error fetching boxscore for game ${gameID}:`, error.message);
    }
    return null;
  }
}

// Function to process player stats from boxscore - updated with correct structure
async function processBoxscoreData(pool, gameID, boxscoreData, homeTeamID, awayTeamID) {
  if (!boxscoreData || !boxscoreData.teams) {
    console.log(`No valid boxscore data for game ${gameID}`);
    return false;
  }
  
  try {
    console.log(`Processing boxscore data for game ${gameID}`);
    
    let playersProcessed = 0;
    const teams = boxscoreData.teams;
    
    if (!Array.isArray(teams) || teams.length < 2) {
      console.log(`Invalid teams data in boxscore for game ${gameID}`);
      return false;
    }
    
    // Process home team (first team in array)
    if (teams[0] && teams[0].playerStats && Array.isArray(teams[0].playerStats)) {
      console.log(`Processing stats for home team (ID: ${homeTeamID}), found ${teams[0].playerStats.length} players`);
      
      for (const playerStat of teams[0].playerStats) {
        try {
          // Extract player info
          const firstName = playerStat.firstName || '';
          const lastName = playerStat.lastName || '';
          const position = playerStat.position || '';
          
          // Get player ID
          const playerID = await getOrCreatePlayerID(pool, firstName, lastName, homeTeamID, position);
          
          if (playerID) {
            // Parse stats
            const stats = {
              points: parseInt(playerStat.points) || 0,
              rebounds: parseInt(playerStat.totalRebounds) || 0,
              assists: parseInt(playerStat.assists) || 0,
              steals: parseInt(playerStat.steals) || 0,
              blocks: parseInt(playerStat.blockedShots) || 0,
              minutesPlayed: parseMinutes(playerStat.minutesPlayed) || 0
            };
            
            // Save stats
            await savePlayerStats(pool, gameID, playerID, stats);
            playersProcessed++;
          }
        } catch (playerError) {
          console.error(`Error processing home team player:`, playerError.message);
        }
      }
    } else {
      console.log(`No player stats found for home team`);
    }
    
    // Process away team (second team in array)
    if (teams[1] && teams[1].playerStats && Array.isArray(teams[1].playerStats)) {
      console.log(`Processing stats for away team (ID: ${awayTeamID}), found ${teams[1].playerStats.length} players`);
      
      for (const playerStat of teams[1].playerStats) {
        try {
          // Extract player info
          const firstName = playerStat.firstName || '';
          const lastName = playerStat.lastName || '';
          const position = playerStat.position || '';
          
          // Get player ID
          const playerID = await getOrCreatePlayerID(pool, firstName, lastName, awayTeamID, position);
          
          if (playerID) {
            // Parse stats
            const stats = {
              points: parseInt(playerStat.points) || 0,
              rebounds: parseInt(playerStat.totalRebounds) || 0,
              assists: parseInt(playerStat.assists) || 0,
              steals: parseInt(playerStat.steals) || 0,
              blocks: parseInt(playerStat.blockedShots) || 0,
              minutesPlayed: parseMinutes(playerStat.minutesPlayed) || 0
            };
            
            // Save stats
            await savePlayerStats(pool, gameID, playerID, stats);
            playersProcessed++;
          }
        } catch (playerError) {
          console.error(`Error processing away team player:`, playerError.message);
        }
      }
    } else {
      console.log(`No player stats found for away team`);
    }
    
    console.log(`Successfully processed ${playersProcessed} players for game ${gameID}`);
    return playersProcessed > 0;
  } catch (error) {
    console.error(`Error processing boxscore for game ${gameID}:`, error.message);
    return false;
  }
}

// Main function to fetch and store March Madness data
async function fetchAndStoreMarchMadnessData() {
  try {
    console.log("Fetching NCAA March Madness data...");
    const response = await axios.get(NCAA_API_SCOREBOARD);
    
    if (!response.data || !response.data.games || response.data.games.length === 0) {
      console.error("No March Madness games found in API response.");
      return;
    }
    
    console.log(`API returned ${response.data.games.length} games`);
    
    // Connect to Azure SQL
    const pool = await sql.connect(dbConfig);
    
    // Process games and save basic game info
    const savedGames = [];
    let updatedGames = 0;
    let skippedGames = 0;
    
    for (const item of response.data.games) {
      try {
        // Extract game data from nested structure
        const gameData = item.game;
        
        if (!gameData) {
          console.log("Skipping item with no game data");
          continue;
        }
        
        // Extract team names
        const team1Name = gameData.away?.names?.full || gameData.away?.names?.short;
        const team2Name = gameData.home?.names?.full || gameData.home?.names?.short;
        
        if (!team1Name || !team2Name) {
          console.log(`Skipping game due to missing team names: ${gameData.title || 'Unknown game'}`);
          continue;
        }
        
        // Extract other game data
        const team1Score = gameData.away && gameData.away.score ? parseInt(gameData.away.score) : 0;
        const team2Score = gameData.home && gameData.home.score ? parseInt(gameData.home.score) : 0;
        const team1Seed = gameData.away && gameData.away.seed ? gameData.away.seed : null;
        const team2Seed = gameData.home && gameData.home.seed ? gameData.home.seed : null;
        const team1Conf = gameData.away && gameData.away.conferences && gameData.away.conferences[0] 
          ? gameData.away.conferences[0].conferenceName : '';
        const team2Conf = gameData.home && gameData.home.conferences && gameData.home.conferences[0] 
          ? gameData.home.conferences[0].conferenceName : '';
        
        const round = gameData.bracketRound || "Unknown Round";
        const location = gameData.venue && gameData.venue.name ? gameData.venue.name : "Unknown Location";
        const gameAPIID = gameData.gameID || '';
        const gameURL = gameData.url || '';
        const gameState = gameData.gameState || 'unknown'; // Not stored, but used for logic
        
        // Parse date (format is "03-21-2025" MM-DD-YYYY)
        let datePlayed = new Date();
        if (gameData.startDate) {
          try {
            const [month, day, year] = gameData.startDate.split('-');
            datePlayed = new Date(`${year}-${month}-${day}`);
          } catch (err) {
            console.log(`Error parsing date "${gameData.startDate}":`, err.message);
          }
        }
        
        console.log(`Processing game: ${team1Name} vs ${team2Name} (Round: ${round}, State: ${gameState})`);
        
        // Get or create team IDs
        const team1ID = await getOrCreateTeamID(pool, team1Name, team1Seed, team1Conf);
        const team2ID = await getOrCreateTeamID(pool, team2Name, team2Seed, team2Conf);
        
        if (!team1ID || !team2ID) {
          console.log("Skipping game insertion due to missing team ID(s)");
          continue;
        }
        
        // Determine winner ID
        let winnerID = null;
        if (gameState === 'final') {
          if (team1Score > team2Score) {
            winnerID = team1ID;
          } else if (team2Score > team1Score) {
            winnerID = team2ID;
          }
        }
        
        // Check if game exists and if we need to update it - IMPROVED to check teams in either order
        const checkResult = await pool.request()
          .input('team1ID', sql.Int, team1ID)
          .input('team2ID', sql.Int, team2ID)
          .input('datePlayed', sql.Date, datePlayed)
          .query(`
            SELECT GameID, LastUpdated, ScoreTeam1, ScoreTeam2
            FROM Games
            WHERE 
              ((Team1ID = @team1ID AND Team2ID = @team2ID) OR
               (Team1ID = @team2ID AND Team2ID = @team1ID))
              AND DatePlayed = @datePlayed
          `);
        
        let dbGameID = null;
        let needsUpdate = true;
        
        if (checkResult.recordset.length > 0) {
          dbGameID = checkResult.recordset[0].GameID;
          
          // Check if we need to update based on scores and time
          needsUpdate = await shouldUpdateGame(pool, dbGameID, team1Score, team2Score);
          
          if (!needsUpdate) {
            console.log(`Game ${dbGameID} doesn't need updating (scores unchanged and updated recently). Skipping.`);
            skippedGames++;
            
            // Still add to savedGames for potential boxscore processing
            savedGames.push({
              dbGameID,
              apiGameID: gameAPIID,
              gameURL,
              team1ID,
              team2ID,
              gameState,
              skipBoxscore: true  // Flag to skip boxscore if we skipped game update
            });
            
            continue;
          }
        }
        
        // Insert or update game
        const gameResult = await pool.request()
          .input('round', sql.NVarChar, round)
          .input('datePlayed', sql.Date, datePlayed)
          .input('location', sql.NVarChar, location)
          .input('team1ID', sql.Int, team1ID)
          .input('team2ID', sql.Int, team2ID)
          .input('winnerID', sql.Int, winnerID)
          .input('scoreTeam1', sql.Int, team1Score)
          .input('scoreTeam2', sql.Int, team2Score)
          .input('lastUpdated', sql.DateTime, new Date())
          .query(dbGameID ? `
            -- Update existing game
            UPDATE Games
            SET Round = @round,
                Location = @location,
                WinnerID = @winnerID,
                ScoreTeam1 = @scoreTeam1,
                ScoreTeam2 = @scoreTeam2,
                LastUpdated = @lastUpdated
            WHERE GameID = ${dbGameID};
            
            SELECT ${dbGameID} AS GameID;
          ` : `
            -- Insert new game
            INSERT INTO Games (
              Round, DatePlayed, Location, Team1ID, 
              Team2ID, WinnerID, ScoreTeam1, ScoreTeam2, LastUpdated
            )
            OUTPUT INSERTED.GameID
            VALUES (
              @round, @datePlayed, @location, @team1ID,
              @team2ID, @winnerID, @scoreTeam1, @scoreTeam2, @lastUpdated
            );
          `);
          
        if (gameResult.recordset && gameResult.recordset.length > 0) {
          dbGameID = gameResult.recordset[0].GameID;
          console.log(`Successfully ${dbGameID ? 'updated' : 'inserted'} game: ${team1Name} vs ${team2Name} with ID ${dbGameID}`);
          updatedGames++;
          
          // Save game info for player stats processing
          savedGames.push({
            dbGameID,
            apiGameID: gameAPIID,
            gameURL,
            team1ID,
            team2ID,
            gameState
          });
        } else {
          console.log(`Game operation completed but couldn't retrieve GameID`);
        }
      } catch (gameError) {
        console.error(`Error processing game:`, gameError.message);
      }
    }
    
    console.log(`\nGame processing summary:`);
    console.log(`- Updated: ${updatedGames} games`);
    console.log(`- Skipped: ${skippedGames} games (recently updated)`);
    console.log(`- Total: ${savedGames.length} games saved or found`);
    
    // Now process player stats for each saved game
    console.log(`\nFetching player statistics for games...`);
    
    let statsProcessed = 0;
    let statsSkipped = 0;
    let statsErrors = 0;
    
    for (const game of savedGames) {
      try {
        // Skip boxscore processing if the game was not updated
        if (game.skipBoxscore) {
          console.log(`Skipping boxscore for game ID ${game.dbGameID} (game not updated)`);
          statsSkipped++;
          continue;
        }
        
        console.log(`\nProcessing player stats for game ID ${game.dbGameID} (API ID: ${game.apiGameID})`);
        
        // Fetch boxscore data
        const boxscoreData = await fetchGameBoxscore(game.apiGameID, game.gameURL);
        
        // Process boxscore data and save player stats
        if (boxscoreData) {
          // Make sure we have the right data structure (boxscore.teams array)
          if (boxscoreData.teams && Array.isArray(boxscoreData.teams)) {
            const success = await processBoxscoreData(pool, game.dbGameID, boxscoreData, game.team1ID, game.team2ID);
            if (success) {
              statsProcessed++;
            } else {
              statsErrors++;
            }
          } else {
            console.log(`Boxscore data for game ${game.dbGameID} doesn't have expected structure`);
            statsErrors++;
          }
        } else {
          console.log(`No boxscore data available for game ID ${game.dbGameID}`);
          
          // If game is final but no boxscore, consider it an error
          if (game.gameState === 'final') {
            console.log(`Game is final but no boxscore available - this may indicate a deeper issue`);
            statsErrors++;
          } else {
            console.log(`Game is not final yet (${game.gameState}), boxscore may become available later`);
            statsSkipped++;
          }
        }
      } catch (error) {
        console.error(`Error processing player stats for game ${game.dbGameID}:`, error.message);
        statsErrors++;
      }
    }
    
    console.log("\nPlayer statistics summary:");
    console.log(`- Processed: ${statsProcessed} games with player statistics`);
    console.log(`- Skipped: ${statsSkipped} games (recently updated or stats not available yet)`);
    console.log(`- Errors: ${statsErrors} games had errors during stats processing`);
    
    console.log("\nNCAA Tournament Data Processing Completed.");
    await pool.close();
  } catch (error) {
    console.error("Error in main process:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Display current game count in database
async function displayGameCount() {
  try {
    console.log("\nChecking current game count in database...");
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request().query(`
      SELECT COUNT(*) AS GameCount
      FROM Games
      WHERE DatePlayed >= '2025-03-19' -- Starting with First Four games
    `);
    
    console.log(`Currently have ${result.recordset[0].GameCount} March Madness games in database`);
    
    // Get breakdown by date
    const dateResult = await pool.request().query(`
      SELECT 
        FORMAT(DatePlayed, 'yyyy-MM-dd') AS GameDate,
        COUNT(*) AS GamesCount
      FROM Games
      WHERE DatePlayed >= '2025-03-19' -- Starting with First Four games
      GROUP BY FORMAT(DatePlayed, 'yyyy-MM-dd')
      ORDER BY GameDate
    `);
    
    console.log("\nGames by date:");
    for (const row of dateResult.recordset) {
      console.log(`- ${row.GameDate}: ${row.GamesCount} games`);
    }
    
    await pool.close();
    
    return result.recordset[0].GameCount;
  } catch (error) {
    console.error("Error checking game count:", error.message);
    return 0;
  }
}

// Main update function - runs a complete update cycle
async function runUpdate() {
  console.log(`\n[${new Date().toISOString()}] Starting scheduled NCAA data update...`);
  
  try {
    // Test database connection
    const connectionSuccessful = await testDatabaseConnection();
    
    if (!connectionSuccessful) {
      console.error("Skipping data fetch because database connection failed");
      return;
    }
    
    // Check current game count
    const beforeCount = await displayGameCount();
    
    // Fetch and store the data
    await fetchAndStoreMarchMadnessData();
    
    // Check updated game count
    const afterCount = await displayGameCount();
    
    console.log(`\n[${new Date().toISOString()}] Added ${afterCount - beforeCount} new games to the database`);
    console.log(`Next update scheduled for: ${new Date(Date.now() + UPDATE_INTERVAL_MS).toISOString()}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in scheduled update:`, error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived shutdown signal, closing connections...');
  try {
    // Close any existing SQL connections
    await sql.close();
    console.log('All connections closed successfully.');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
});

// ====================================
// MAIN EXECUTION STARTS HERE
// ====================================
console.log(`[${new Date().toISOString()}] NCAA Data Updater Service Started`);
console.log(`Update interval set to: ${UPDATE_INTERVAL_MS / 1000} seconds (${UPDATE_INTERVAL_MS / 60000} minutes)`);

// Run immediately on startup
runUpdate();

// Then schedule to run every 5 minutes
setInterval(runUpdate, UPDATE_INTERVAL_MS);