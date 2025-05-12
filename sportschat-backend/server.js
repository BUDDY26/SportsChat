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
  ? (process.env.PORT || 8080)
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

let pool;
async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to MSSQL database');
  } catch (err) {
    console.error('❌ Database connection failed at startup:', err);
    process.exit(1);
  }
}
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://sportschatplus-ehfub6gedrhyfmbt.centralus-01.azurewebsites.net'
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

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Basic DB test
app.get('/api/test-database', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT 1 AS connected');
    res.json({ success: true, message: 'Connected', result: result.recordset });
  } catch (err) {
    console.error('Test DB error:', err);
    res.status(500).json({ success: false, message: 'Failed to connect to database', error: err.message });
  }
});

// Example Signup Route
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const check = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Username = @username OR Email = @email');

    if (check.recordset.length > 0) {
      return res.status(409).json({ message: 'Username or email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('hashedPassword', sql.VarChar, hashedPassword)
      .query('INSERT INTO Users (Username, Email, PasswordHash, CreatedAt) VALUES (@username, @email, @hashedPassword, GETDATE())');

    res.status(201).json({ message: 'Signup successful.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Determine frontend build path
let frontendPath = path.join(__dirname, '../sportschat-frontend/build');
if (process.env.NODE_ENV === 'production' && !fs.existsSync(frontendPath)) {
  frontendPath = path.join(process.cwd(), 'sportschat-frontend/build');
}

app.use(express.static(frontendPath));

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});